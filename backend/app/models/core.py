from datetime import datetime
from typing import Any

from pgvector.sqlalchemy import Vector
from sqlalchemy import JSON, Boolean, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class TimestampMixin:
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class Hypothesis(Base, TimestampMixin):
    __tablename__ = "hypotheses"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    type: Mapped[str] = mapped_column(String(50), index=True)
    short_name: Mapped[str] = mapped_column(String(120), unique=True, index=True)
    statement: Mapped[str] = mapped_column(Text)
    independent_variable: Mapped[str] = mapped_column(String(120))
    primary_metric: Mapped[str] = mapped_column(String(120))
    channel: Mapped[str] = mapped_column(String(120))
    status: Mapped[str] = mapped_column(String(30), default="draft", index=True)
    validation_threshold: Mapped[float] = mapped_column(Float, default=70.0)
    min_volume: Mapped[int] = mapped_column(Integer, default=10)
    tags: Mapped[list[str]] = mapped_column(JSON, default=list)
    target_segments: Mapped[list[str]] = mapped_column(JSON, default=list)


class HypothesisRule(Base, TimestampMixin):
    __tablename__ = "hypothesis_rules"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    hypothesis_id: Mapped[int] = mapped_column(ForeignKey("hypotheses.id", ondelete="CASCADE"), index=True)
    name: Mapped[str] = mapped_column(String(150))
    rule_json: Mapped[dict[str, Any]] = mapped_column(JSON)


class InterviewTemplate(Base, TimestampMixin):
    __tablename__ = "interview_templates"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    hypothesis_type: Mapped[str] = mapped_column(String(50), index=True)
    name: Mapped[str] = mapped_column(String(120), unique=True)
    template_json: Mapped[dict[str, Any]] = mapped_column(JSON)


class InterviewFlow(Base, TimestampMixin):
    __tablename__ = "interview_flows"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    template_id: Mapped[int | None] = mapped_column(ForeignKey("interview_templates.id", ondelete="SET NULL"))
    hypothesis_id: Mapped[int | None] = mapped_column(ForeignKey("hypotheses.id", ondelete="SET NULL"), index=True)
    name: Mapped[str] = mapped_column(String(120), index=True)
    version: Mapped[int] = mapped_column(Integer, default=1)


class FlowNode(Base, TimestampMixin):
    __tablename__ = "flow_nodes"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    flow_id: Mapped[int] = mapped_column(ForeignKey("interview_flows.id", ondelete="CASCADE"), index=True)
    node_key: Mapped[str] = mapped_column(String(120), index=True)
    label: Mapped[str] = mapped_column(String(200))
    question_text: Mapped[str] = mapped_column(Text, default="")
    response_type: Mapped[str] = mapped_column(String(30), default="texto")
    pos_x: Mapped[float] = mapped_column(Float, default=0)
    pos_y: Mapped[float] = mapped_column(Float, default=0)
    metadata_json: Mapped[dict[str, Any]] = mapped_column(JSON, default=dict)


class FlowEdge(Base, TimestampMixin):
    __tablename__ = "flow_edges"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    flow_id: Mapped[int] = mapped_column(ForeignKey("interview_flows.id", ondelete="CASCADE"), index=True)
    edge_key: Mapped[str] = mapped_column(String(120), index=True)
    source_node_key: Mapped[str] = mapped_column(String(120), index=True)
    target_node_key: Mapped[str] = mapped_column(String(120), index=True)
    condition_json: Mapped[dict[str, Any]] = mapped_column(JSON, default=dict)


class Interview(Base, TimestampMixin):
    __tablename__ = "interviews"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    hypothesis_id: Mapped[int] = mapped_column(ForeignKey("hypotheses.id", ondelete="CASCADE"), index=True)
    flow_id: Mapped[int | None] = mapped_column(ForeignKey("interview_flows.id", ondelete="SET NULL"))
    status: Mapped[str] = mapped_column(String(30), default="draft")
    started_at: Mapped[datetime | None] = mapped_column(DateTime)
    ended_at: Mapped[datetime | None] = mapped_column(DateTime)


class InterviewSession(Base, TimestampMixin):
    __tablename__ = "interview_sessions"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    interview_id: Mapped[int] = mapped_column(ForeignKey("interviews.id", ondelete="CASCADE"), index=True)
    hypothesis_id: Mapped[int] = mapped_column(ForeignKey("hypotheses.id", ondelete="CASCADE"), index=True)
    status: Mapped[str] = mapped_column(String(30), default="active")
    current_question: Mapped[str] = mapped_column(Text, default="")


class InterviewParticipant(Base, TimestampMixin):
    __tablename__ = "interview_participants"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    interview_id: Mapped[int] = mapped_column(ForeignKey("interviews.id", ondelete="CASCADE"), unique=True)
    full_name: Mapped[str] = mapped_column(String(120))
    segment: Mapped[str] = mapped_column(String(120), index=True)
    profile_json: Mapped[dict[str, Any]] = mapped_column(JSON, default=dict)


class InterviewResponse(Base, TimestampMixin):
    __tablename__ = "interview_responses"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    interview_id: Mapped[int] = mapped_column(ForeignKey("interviews.id", ondelete="CASCADE"), index=True)
    question_id: Mapped[str] = mapped_column(String(120), index=True)
    question_text: Mapped[str] = mapped_column(Text)
    response_type: Mapped[str] = mapped_column(String(30))
    response_text: Mapped[str] = mapped_column(Text)
    metadata_json: Mapped[dict[str, Any]] = mapped_column(JSON, default=dict)


class InterviewNote(Base, TimestampMixin):
    __tablename__ = "interview_notes"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    interview_id: Mapped[int] = mapped_column(ForeignKey("interviews.id", ondelete="CASCADE"), index=True)
    note_text: Mapped[str] = mapped_column(Text)
    tags: Mapped[list[str]] = mapped_column(JSON, default=list)


class InterviewScore(Base, TimestampMixin):
    __tablename__ = "interview_scores"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    interview_id: Mapped[int] = mapped_column(ForeignKey("interviews.id", ondelete="CASCADE"), unique=True)
    hypothesis_id: Mapped[int] = mapped_column(ForeignKey("hypotheses.id", ondelete="CASCADE"), index=True)
    total_score: Mapped[float] = mapped_column(Float, default=0.0)
    criteria_scores: Mapped[dict[str, Any]] = mapped_column(JSON, default=dict)
    flags: Mapped[dict[str, Any]] = mapped_column(JSON, default=dict)
    evidence: Mapped[dict[str, Any]] = mapped_column(JSON, default=dict)


class Offer(Base, TimestampMixin):
    __tablename__ = "offers"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    hypothesis_id: Mapped[int] = mapped_column(ForeignKey("hypotheses.id", ondelete="CASCADE"), index=True)
    name: Mapped[str] = mapped_column(String(150))
    value_proposition: Mapped[str] = mapped_column(Text)
    base_price: Mapped[float] = mapped_column(Float)
    price_options: Mapped[list[float]] = mapped_column(JSON, default=list)
    guarantee: Mapped[str] = mapped_column(String(250))
    cta: Mapped[str] = mapped_column(String(50))
    script_text: Mapped[str] = mapped_column(Text)
    objections_expected: Mapped[list[str]] = mapped_column(JSON, default=list)
    objection_responses_tree: Mapped[dict[str, Any]] = mapped_column(JSON, default=dict)


class Script(Base, TimestampMixin):
    __tablename__ = "scripts"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    hypothesis_id: Mapped[int] = mapped_column(ForeignKey("hypotheses.id", ondelete="CASCADE"), index=True)
    title: Mapped[str] = mapped_column(String(150))
    body: Mapped[str] = mapped_column(Text)
    stage: Mapped[str] = mapped_column(String(50), default="venta")


class Objection(Base, TimestampMixin):
    __tablename__ = "objections"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    offer_id: Mapped[int | None] = mapped_column(ForeignKey("offers.id", ondelete="CASCADE"), index=True)
    hypothesis_id: Mapped[int] = mapped_column(ForeignKey("hypotheses.id", ondelete="CASCADE"), index=True)
    text: Mapped[str] = mapped_column(String(250), index=True)


class SalesEvent(Base, TimestampMixin):
    __tablename__ = "sales_events"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    interview_id: Mapped[int] = mapped_column(ForeignKey("interviews.id", ondelete="CASCADE"), index=True)
    offer_id: Mapped[int] = mapped_column(ForeignKey("offers.id", ondelete="CASCADE"), index=True)
    response: Mapped[str] = mapped_column(String(30))
    objections: Mapped[list[str]] = mapped_column(JSON, default=list)
    notes: Mapped[str] = mapped_column(Text, default="")
    accepted_price: Mapped[float | None] = mapped_column(Float)
    next_step: Mapped[str] = mapped_column(String(200), default="")
    lead_status: Mapped[str] = mapped_column(String(30), default="warm")


class AnalyticsSnapshot(Base, TimestampMixin):
    __tablename__ = "analytics_snapshots"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    hypothesis_id: Mapped[int] = mapped_column(ForeignKey("hypotheses.id", ondelete="CASCADE"), index=True)
    snapshot_type: Mapped[str] = mapped_column(String(60), index=True)
    payload: Mapped[dict[str, Any]] = mapped_column(JSON)


class EmbeddingStore(Base, TimestampMixin):
    __tablename__ = "embeddings_store"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    interview_id: Mapped[int] = mapped_column(ForeignKey("interviews.id", ondelete="CASCADE"), index=True)
    hypothesis_id: Mapped[int] = mapped_column(ForeignKey("hypotheses.id", ondelete="CASCADE"), index=True)
    source_text: Mapped[str] = mapped_column(Text)
    vector: Mapped[list[float]] = mapped_column(Vector(8))
    metadata_json: Mapped[dict[str, Any]] = mapped_column(JSON, default=dict)
    cluster_label: Mapped[int | None] = mapped_column(Integer)
    umap_x: Mapped[float | None] = mapped_column(Float)
    umap_y: Mapped[float | None] = mapped_column(Float)
    keyphrases: Mapped[list[str]] = mapped_column(JSON, default=list)
    is_live: Mapped[bool] = mapped_column(Boolean, default=True)
