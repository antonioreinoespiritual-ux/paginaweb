from datetime import datetime
from typing import Any

from sqlalchemy import JSON, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class TimestampMixin:
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class Project(Base, TimestampMixin):
    __tablename__ = "projects"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(140), unique=True, index=True)
    description: Mapped[str] = mapped_column(Text, default="")


class Flow(Base, TimestampMixin):
    __tablename__ = "flows"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    hypothesis_id: Mapped[int | None] = mapped_column(ForeignKey("hypotheses.id", ondelete="SET NULL"), index=True)
    name: Mapped[str] = mapped_column(String(140), index=True)
    description: Mapped[str] = mapped_column(Text, default="")
    nodes: Mapped[list[dict[str, Any]]] = mapped_column(JSON, default=list)
    edges: Mapped[list[dict[str, Any]]] = mapped_column(JSON, default=list)
    version: Mapped[int] = mapped_column(Integer, default=1)


class InterviewTemplate(Base, TimestampMixin):
    __tablename__ = "interview_templates"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(140), unique=True)
    goal: Mapped[str] = mapped_column(Text, default="")
    target_persona: Mapped[str] = mapped_column(String(140), default="")
    questions: Mapped[list[dict[str, Any]]] = mapped_column(JSON, default=list)
    scoring_rules: Mapped[dict[str, Any]] = mapped_column(JSON, default=dict)


class SalesPlaybook(Base, TimestampMixin):
    __tablename__ = "sales_playbooks"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    hypothesis_id: Mapped[int] = mapped_column(ForeignKey("hypotheses.id", ondelete="CASCADE"), unique=True, index=True)
    offer: Mapped[str] = mapped_column(Text, default="")
    objections: Mapped[dict[str, str]] = mapped_column(JSON, default=dict)
    scripts: Mapped[dict[str, str]] = mapped_column(JSON, default=dict)
    followup_sequences: Mapped[list[str]] = mapped_column(JSON, default=list)


class Hypothesis(Base, TimestampMixin):
    __tablename__ = "hypotheses"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    project_id: Mapped[int] = mapped_column(ForeignKey("projects.id", ondelete="CASCADE"), index=True)
    title: Mapped[str] = mapped_column(String(180), index=True)
    pain: Mapped[str] = mapped_column(Text)
    persona: Mapped[str] = mapped_column(String(140), index=True)
    context: Mapped[str] = mapped_column(Text, default="")
    falsifiable_statement: Mapped[str] = mapped_column(Text)
    success_criteria: Mapped[dict[str, Any]] = mapped_column(JSON, default=dict)
    traffic_source: Mapped[str] = mapped_column(String(80), default="organico")
    status: Mapped[str] = mapped_column(String(30), default="draft", index=True)
    notes: Mapped[str] = mapped_column(Text, default="")
    validation_flow_id: Mapped[int | None] = mapped_column(ForeignKey("flows.id", ondelete="SET NULL"))
    interview_template_id: Mapped[int | None] = mapped_column(ForeignKey("interview_templates.id", ondelete="SET NULL"))
    sales_playbook_id: Mapped[int | None] = mapped_column(ForeignKey("sales_playbooks.id", ondelete="SET NULL"))


class InterviewSession(Base, TimestampMixin):
    __tablename__ = "interview_sessions"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    hypothesis_id: Mapped[int] = mapped_column(ForeignKey("hypotheses.id", ondelete="CASCADE"), index=True)
    template_id: Mapped[int | None] = mapped_column(ForeignKey("interview_templates.id", ondelete="SET NULL"), index=True)
    date: Mapped[str] = mapped_column(String(40), default="")
    interviewer: Mapped[str] = mapped_column(String(120), default="")
    respondent_alias: Mapped[str] = mapped_column(String(120), default="")
    notes: Mapped[str] = mapped_column(Text, default="")
    answers: Mapped[dict[str, Any]] = mapped_column(JSON, default=dict)
    score_total: Mapped[float] = mapped_column(Float, default=0)
    signals: Mapped[dict[str, Any]] = mapped_column(JSON, default=dict)
    status: Mapped[str] = mapped_column(String(30), default="in-progress", index=True)
