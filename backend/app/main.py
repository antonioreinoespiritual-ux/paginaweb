from __future__ import annotations

import json
import logging
import uuid
from pathlib import Path

from fastapi import FastAPI, File, HTTPException, Query, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse

from .database import UPLOAD_DIR, get_conn, init_db
from .jobs import create_job, run_job_async
from .pipeline import compute_signals, export_dataset, ingest_dataset, analyze_dataset
from .schemas import JobResponse, JobStatus, SignalConfig, UploadResponse

logging.basicConfig(level=logging.INFO, format='{"level":"%(levelname)s","msg":"%(message)s"}')
logger = logging.getLogger(__name__)

app = FastAPI(title="Market Gap Analyzer")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])


@app.on_event("startup")
def startup() -> None:
    init_db()


@app.post("/api/datasets/upload", response_model=UploadResponse)
async def upload_dataset(file: UploadFile = File(...)) -> UploadResponse:
    if not file.filename.lower().endswith(".csv"):
        raise HTTPException(400, "Only CSV files are supported")
    dataset_id = str(uuid.uuid4())
    dst = UPLOAD_DIR / f"{dataset_id}.csv"
    content = await file.read()
    dst.write_bytes(content)
    conn = get_conn()
    conn.execute(
        "INSERT INTO datasets(id, filename, filepath, schema_json) VALUES(?,?,?,?)",
        [dataset_id, file.filename, str(dst), json.dumps({})],
    )
    conn.close()
    return UploadResponse(dataset_id=dataset_id, filename=file.filename)


@app.post("/api/datasets/{dataset_id}/ingest", response_model=JobResponse)
def ingest(dataset_id: str, colmap: dict[str, str] | None = None) -> JobResponse:
    job_id = create_job(dataset_id, "ingest")
    run_job_async(job_id, lambda: ingest_dataset(dataset_id, colmap))
    return JobResponse(job_id=job_id)


@app.post("/api/datasets/{dataset_id}/analyze", response_model=JobResponse)
def analyze(dataset_id: str) -> JobResponse:
    job_id = create_job(dataset_id, "analyze")
    run_job_async(job_id, lambda: analyze_dataset(dataset_id))
    return JobResponse(job_id=job_id)


@app.get("/api/jobs/{job_id}", response_model=JobStatus)
def job_status(job_id: str) -> JobStatus:
    conn = get_conn()
    row = conn.execute("SELECT job_id,dataset_id,type,status,progress,message FROM jobs WHERE job_id=?", [job_id]).fetchone()
    conn.close()
    if not row:
        raise HTTPException(404, "Job not found")
    return JobStatus(job_id=row[0], dataset_id=row[1], type=row[2], status=row[3], progress=row[4], message=row[5])


@app.get("/api/datasets/{dataset_id}/summary")
def summary(dataset_id: str):
    conn = get_conn()
    row = conn.execute(
        """
        SELECT d.n_rows,
               (SELECT COUNT(*) FROM comments WHERE dataset_id=d.id),
               (SELECT COUNT(*) FROM clusters WHERE dataset_id=d.id),
               COALESCE((SELECT AVG(signal_score) FROM signals WHERE dataset_id=d.id),0),
               COALESCE((SELECT AVG(CASE WHEN is_promo THEN 1 ELSE 0 END) FROM comments WHERE dataset_id=d.id),0),
               COALESCE((SELECT AVG(CASE WHEN is_duplicate THEN 1 ELSE 0 END) FROM comments WHERE dataset_id=d.id),0)
        FROM datasets d WHERE d.id = ?
        """,
        [dataset_id],
    ).fetchone()
    conn.close()
    if not row:
        raise HTTPException(404, "Dataset not found")
    return {
        "dataset_id": dataset_id,
        "n_rows": row[0],
        "n_comments": row[1],
        "n_clusters": row[2],
        "mean_signal_score": row[3],
        "promo_rate": row[4],
        "duplicate_rate": row[5],
    }


@app.get("/api/datasets/{dataset_id}/clusters")
def clusters(dataset_id: str, limit: int = 50, offset: int = 0, min_score: float = Query(0)):
    conn = get_conn()
    rows = conn.execute(
        "SELECT * FROM clusters WHERE dataset_id=? AND cluster_score>=? ORDER BY cluster_score DESC LIMIT ? OFFSET ?",
        [dataset_id, min_score, limit, offset],
    ).fetchall()
    cols = ["dataset_id", "cluster_id", "cluster_name", "cluster_score", "size", "keywords_json", "top_terms_json", "top_ngrams_json", "signal_rates_json"]
    conn.close()
    return [dict(zip(cols, r)) for r in rows]


@app.get("/api/clusters/{cluster_id}")
def cluster_detail(cluster_id: int, dataset_id: str):
    conn = get_conn()
    cl = conn.execute("SELECT * FROM clusters WHERE dataset_id=? AND cluster_id=?", [dataset_id, cluster_id]).fetchone()
    ev = conn.execute("SELECT comment, like_count, signal_score, rank FROM evidence WHERE dataset_id=? AND cluster_id=? ORDER BY rank", [dataset_id, cluster_id]).fetchall()
    conn.close()
    if not cl:
        raise HTTPException(404, "Cluster not found")
    report_path = Path(__file__).resolve().parent.parent / "data" / "exports" / f"{dataset_id}_report.json"
    gap = {}
    if report_path.exists():
        report = json.loads(report_path.read_text(encoding="utf-8"))
        gap = next((x for x in report.get("clusters", []) if x["cluster_id"] == cluster_id), {})
    return {"cluster": {"cluster_id": cl[1], "cluster_name": cl[2], "cluster_score": cl[3], "size": cl[4], "keywords_json": cl[5], "top_terms_json": cl[6], "top_ngrams_json": cl[7], "signal_rates_json": cl[8]}, "evidence": [{"comment": e[0], "like_count": e[1], "signal_score": e[2], "rank": e[3]} for e in ev], "gap_statement": gap}


@app.get("/api/datasets/{dataset_id}/signals")
def signals(dataset_id: str):
    conn = get_conn()
    rows = conn.execute("SELECT * FROM signals WHERE dataset_id=? LIMIT 500", [dataset_id]).df().to_dict(orient="records")
    conn.close()
    return rows


@app.post("/api/datasets/{dataset_id}/signals/recompute", response_model=JobResponse)
def recompute_signals(dataset_id: str, config: SignalConfig) -> JobResponse:
    job_id = create_job(dataset_id, "recompute_signals")
    run_job_async(job_id, lambda: compute_signals(dataset_id, config.patterns or None, config.weights or None))
    return JobResponse(job_id=job_id)


@app.get("/api/datasets/{dataset_id}/export/{export_type}")
def export(dataset_id: str, export_type: str):
    try:
        path = export_dataset(dataset_id, export_type)
    except ValueError as exc:
        raise HTTPException(400, str(exc))
    if not path.exists():
        raise HTTPException(404, "Export not found")
    return FileResponse(path=str(path), filename=path.name)
