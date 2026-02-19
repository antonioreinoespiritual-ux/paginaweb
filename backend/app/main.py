import logging
import os
from pathlib import Path
import shutil
from datetime import datetime

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import inspect

from app.database import Base, DATABASE_URL, engine
from app.routers.flows import router as flows_router
from app.routers.hypotheses import router as hypotheses_router
from app.routers.interviews import router as interviews_router
from app.routers.interview_templates import router as templates_router
from app.routers.projects import router as projects_router
from app.routers.sales_playbooks import router as playbooks_router

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s - %(message)s")
logger = logging.getLogger("research-os")

app = FastAPI(title="Research OS API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(projects_router)
app.include_router(hypotheses_router)
app.include_router(flows_router)
app.include_router(templates_router)
app.include_router(interviews_router)
app.include_router(playbooks_router)


@app.on_event("startup")
def startup() -> None:
    Path(".").mkdir(exist_ok=True)
    _ensure_sqlite_schema_compatibility()
    Base.metadata.create_all(bind=engine)
    logger.info("DB ready and API started")


def _ensure_sqlite_schema_compatibility() -> None:
    """Dev-friendly compatibility guard for legacy SQLite schemas.

    When switching from the old schema to the new one, SQLite keeps stale tables
    because create_all() does not alter existing columns.
    """
    if not DATABASE_URL.startswith("sqlite"):
        return

    # opt-out available in case someone wants strict behavior
    if os.getenv("SQLITE_AUTO_RESET_ON_SCHEMA_MISMATCH", "true").lower() != "true":
        return

    required_cols = {
        "project_id",
        "title",
        "pain",
        "persona",
        "falsifiable_statement",
    }

    inspector = inspect(engine)
    if "hypotheses" not in inspector.get_table_names():
        return

    existing = {c["name"] for c in inspector.get_columns("hypotheses")}
    if required_cols.issubset(existing):
        return

    db_path = DATABASE_URL.replace("sqlite:///", "", 1)
    db_file = Path(db_path)
    if db_file.exists():
        backup = db_file.with_suffix(f".bak-{datetime.now().strftime('%Y%m%d-%H%M%S')}.db")
        shutil.copy2(db_file, backup)
        logger.warning("Legacy SQLite schema detected. Backup created at: %s", backup)

    Base.metadata.drop_all(bind=engine)


@app.exception_handler(HTTPException)
async def http_exception_handler(_: Request, exc: HTTPException):
    return JSONResponse(status_code=exc.status_code, content={"detail": exc.detail, "type": "http_error"})


@app.exception_handler(Exception)
async def generic_exception_handler(_: Request, exc: Exception):
    logger.exception("Unhandled error: %s", exc)
    return JSONResponse(status_code=500, content={"detail": "Internal server error", "type": "server_error"})


@app.get("/health")
def health():
    return {"ok": True}


@app.get("/api/routes")
def list_routes():
    return sorted([r.path for r in app.routes if hasattr(r, "path")])
