from __future__ import annotations

import json
from pathlib import Path
import duckdb

DB_PATH = Path(__file__).resolve().parent.parent / "market_gap.duckdb"
DATA_DIR = Path(__file__).resolve().parent.parent / "data"
UPLOAD_DIR = DATA_DIR / "uploads"
EXPORT_DIR = DATA_DIR / "exports"

for d in (DATA_DIR, UPLOAD_DIR, EXPORT_DIR):
    d.mkdir(parents=True, exist_ok=True)


def get_conn() -> duckdb.DuckDBPyConnection:
    conn = duckdb.connect(str(DB_PATH))
    conn.execute("PRAGMA threads=4")
    return conn


def init_db() -> None:
    conn = get_conn()
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS datasets (
            id VARCHAR PRIMARY KEY,
            filename VARCHAR,
            filepath VARCHAR,
            created_at TIMESTAMP DEFAULT NOW(),
            n_rows BIGINT DEFAULT 0,
            schema_json VARCHAR
        );

        CREATE TABLE IF NOT EXISTS comments (
            dataset_id VARCHAR,
            comment_id VARCHAR,
            comment VARCHAR,
            like_count BIGINT,
            query VARCHAR,
            title VARCHAR,
            channel VARCHAR,
            video_id VARCHAR,
            published_at VARCHAR,
            comment_published_at VARCHAR,
            author VARCHAR,
            comment_norm VARCHAR,
            is_promo BOOLEAN,
            is_duplicate BOOLEAN
        );

        CREATE TABLE IF NOT EXISTS signals (
            dataset_id VARCHAR,
            comment_id VARCHAR,
            frustration BOOLEAN,
            urgency BOOLEAN,
            prior_attempt BOOLEAN,
            econ_impact BOOLEAN,
            tech_block BOOLEAN,
            coldfit_neg BOOLEAN,
            signal_score DOUBLE
        );

        CREATE TABLE IF NOT EXISTS clusters (
            dataset_id VARCHAR,
            cluster_id BIGINT,
            cluster_name VARCHAR,
            cluster_score DOUBLE,
            size BIGINT,
            keywords_json VARCHAR,
            top_terms_json VARCHAR,
            top_ngrams_json VARCHAR,
            signal_rates_json VARCHAR
        );

        CREATE TABLE IF NOT EXISTS evidence (
            dataset_id VARCHAR,
            cluster_id BIGINT,
            comment_id VARCHAR,
            rank BIGINT,
            comment VARCHAR,
            like_count BIGINT,
            signal_score DOUBLE
        );

        CREATE TABLE IF NOT EXISTS jobs (
            job_id VARCHAR PRIMARY KEY,
            dataset_id VARCHAR,
            type VARCHAR,
            status VARCHAR,
            progress DOUBLE,
            message VARCHAR,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
        );
        """
    )
    conn.close()


def to_json(value: dict) -> str:
    return json.dumps(value, ensure_ascii=False)
