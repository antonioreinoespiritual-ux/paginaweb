from __future__ import annotations
from typing import Any, Literal
from pydantic import BaseModel, Field

HypStatus = Literal["draft", "running", "paused", "won", "lost"]
InterviewStatus = Literal["in-progress", "completed"]


class ProjectBase(BaseModel):
    name: str
    description: str = ""


class ProjectCreate(ProjectBase):
    pass


class ProjectRead(ProjectBase):
    id: int
    model_config = {"from_attributes": True}


class HypothesisBase(BaseModel):
    project_id: int
    title: str
    pain: str
    persona: str
    context: str = ""
    falsifiable_statement: str
    success_criteria: dict[str, Any] = Field(default_factory=dict)
    traffic_source: str = "organico"
    status: HypStatus = "draft"
    notes: str = ""
    validation_flow_id: int | None = None
    interview_template_id: int | None = None
    sales_playbook_id: int | None = None


class HypothesisCreate(HypothesisBase):
    pass


class HypothesisRead(HypothesisBase):
    id: int
    model_config = {"from_attributes": True}


class FlowBase(BaseModel):
    hypothesis_id: int | None = None
    name: str
    description: str = ""
    nodes: list[dict[str, Any]] = Field(default_factory=list)
    edges: list[dict[str, Any]] = Field(default_factory=list)


class FlowCreate(FlowBase):
    pass


class FlowRead(FlowBase):
    id: int
    version: int
    model_config = {"from_attributes": True}


class InterviewTemplateBase(BaseModel):
    name: str
    goal: str = ""
    target_persona: str = ""
    questions: list[dict[str, Any]] = Field(default_factory=list)
    scoring_rules: dict[str, Any] = Field(default_factory=dict)


class InterviewTemplateCreate(InterviewTemplateBase):
    pass


class InterviewTemplateRead(InterviewTemplateBase):
    id: int
    model_config = {"from_attributes": True}


class InterviewSessionBase(BaseModel):
    hypothesis_id: int
    template_id: int | None = None
    date: str = ""
    interviewer: str = ""
    respondent_alias: str = ""
    notes: str = ""
    answers: dict[str, Any] = Field(default_factory=dict)
    score_total: float = 0
    signals: dict[str, Any] = Field(default_factory=dict)
    status: InterviewStatus = "in-progress"


class InterviewSessionCreate(InterviewSessionBase):
    pass


class InterviewSessionRead(InterviewSessionBase):
    id: int
    model_config = {"from_attributes": True}


class SalesPlaybookBase(BaseModel):
    hypothesis_id: int
    offer: str = ""
    objections: dict[str, str] = Field(default_factory=dict)
    scripts: dict[str, str] = Field(default_factory=dict)
    followup_sequences: list[str] = Field(default_factory=list)


class SalesPlaybookCreate(SalesPlaybookBase):
    pass


class SalesPlaybookRead(SalesPlaybookBase):
    id: int
    model_config = {"from_attributes": True}
