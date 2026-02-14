from pathlib import Path
import uuid

from app.database import get_conn, init_db
from app.pipeline import ingest_dataset, analyze_dataset


def test_ingest_and_analyze(tmp_path: Path):
    init_db()
    ds = str(uuid.uuid4())
    csv = tmp_path / "sample.csv"
    csv.write_text("comment,like_count\nNo funciona mi pixel y pierdo ventas,3\nNecesito urgente mejorar ROAS,5\n", encoding="utf-8")

    conn = get_conn()
    conn.execute("INSERT INTO datasets(id, filename, filepath, schema_json) VALUES(?,?,?,?)", [ds, "sample.csv", str(csv), "{}"])
    conn.close()

    ingest_dataset(ds)
    analyze_dataset(ds)

    conn = get_conn()
    n_comments = conn.execute("SELECT COUNT(*) FROM comments WHERE dataset_id=?", [ds]).fetchone()[0]
    n_clusters = conn.execute("SELECT COUNT(*) FROM clusters WHERE dataset_id=?", [ds]).fetchone()[0]
    conn.close()

    assert n_comments == 2
    assert n_clusters >= 1
