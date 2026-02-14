from __future__ import annotations

from typing import Any
from pydantic import BaseModel, Field


class UploadResponse(BaseModel):
    dataset_id: str
    filename: str


class JobResponse(BaseModel):
    job_id: str


class JobStatus(BaseModel):
    job_id: str
    dataset_id: str
    type: str
    status: str
    progress: float
    message: str


class SignalConfig(BaseModel):
    patterns: dict[str, list[str]] = Field(default_factory=dict)
    weights: dict[str, float] = Field(default_factory=dict)
    threshold: float = 40.0


class DatasetSummary(BaseModel):
    dataset_id: str
    n_rows: int
    n_comments: int
    n_clusters: int
    mean_signal_score: float
    promo_rate: float
    duplicate_rate: float


class ClusterItem(BaseModel):
    cluster_id: int
    cluster_name: str
    cluster_score: float
    size: int
    keywords_json: str
    top_terms_json: str
    top_ngrams_json: str
    signal_rates_json: str


class ClusterDetail(BaseModel):
    cluster: dict[str, Any]
    evidence: list[dict[str, Any]]
    gap_statement: dict[str, Any]
