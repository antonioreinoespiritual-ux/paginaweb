from __future__ import annotations

import threading
import uuid
from typing import Callable

from .database import get_conn


def create_job(dataset_id: str, job_type: str) -> str:
    job_id = str(uuid.uuid4())
    conn = get_conn()
    conn.execute(
        "INSERT INTO jobs(job_id,dataset_id,type,status,progress,message) VALUES(?,?,?,?,?,?)",
        [job_id, dataset_id, job_type, "queued", 0.0, "queued"],
    )
    conn.close()
    return job_id


def update_job(job_id: str, status: str, progress: float, message: str) -> None:
    conn = get_conn()
    conn.execute(
        "UPDATE jobs SET status=?, progress=?, message=?, updated_at=NOW() WHERE job_id=?",
        [status, progress, message, job_id],
    )
    conn.close()


def run_job_async(job_id: str, fn: Callable[[], None]) -> None:
    def runner() -> None:
        try:
            update_job(job_id, "running", 10, "processing")
            fn()
            update_job(job_id, "done", 100, "completed")
        except Exception as exc:
            update_job(job_id, "failed", 100, str(exc))

    t = threading.Thread(target=runner, daemon=True)
    t.start()
