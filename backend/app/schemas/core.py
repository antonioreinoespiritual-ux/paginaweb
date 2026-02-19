from __future__ import annotations
from typing import Any, Literal
from pydantic import BaseModel, Field

Operator = Literal[">=", "<=", "=="]
ScoreType = Literal["binario", "escala", "porcentaje", "similaridad", "manual"]
TextSource = Literal["respuesta", "notas", "ambos"]


class RuleConfig(BaseModel):
    id: str
    nombre: str
    descripcion: str = ""
    tipo_score: ScoreType
    fuente_texto: TextSource = "ambos"
    keywords_incluir: list[str] = Field(default_factory=list)
    keywords_excluir: list[str] = Field(default_factory=list)
    sinonimos: dict[str, list[str]] = Field(default_factory=dict)
    similitud_minima: float = 0.7
    peso: float = 1.0
    umbral: float = 1.0
    operador: Operator = ">="
    requiere_confirmacion_manual: bool = False
    activa_modo_venta_si_cumple: bool = False


class HypothesisBase(BaseModel):
    type: str
    short_name: str
    statement: str
    independent_variable: str
    primary_metric: str
    channel: str
    status: str = "draft"
    validation_threshold: float = 70
    min_volume: int = 10
    tags: list[str] = Field(default_factory=list)
    target_segments: list[str] = Field(default_factory=list)


class HypothesisCreate(HypothesisBase):
    pass


class HypothesisRead(HypothesisBase):
    id: int
    model_config = {"from_attributes": True}


class RuleCreate(BaseModel):
    name: str
    rule_json: RuleConfig


class RuleRead(BaseModel):
    id: int
    hypothesis_id: int
    name: str
    rule_json: RuleConfig
    model_config = {"from_attributes": True}


class InterviewCreate(BaseModel):
    hypothesis_id: int
    flow_id: int | None = None


class InterviewSessionCreate(BaseModel):
    interview_id: int
    hypothesis_id: int
    current_question: str = ""


class InterviewNoteCreate(BaseModel):
    interview_id: int
    note_text: str
    tags: list[str] = Field(default_factory=list)


class InterviewResponseCreate(BaseModel):
    question_id: str
    question_text: str
    response_type: str
    response_text: str
    metadata_json: dict[str, Any] = Field(default_factory=dict)


class FlowCreate(BaseModel):
    name: str
    hypothesis_id: int | None = None
    template_id: int | None = None


class FlowNodePayload(BaseModel):
    node_key: str
    label: str
    question_text: str = ""
    response_type: str = "texto"
    pos_x: float = 0
    pos_y: float = 0
    metadata_json: dict[str, Any] = Field(default_factory=dict)


class FlowEdgePayload(BaseModel):
    edge_key: str
    source_node_key: str
    target_node_key: str
    condition_json: dict[str, Any] = Field(default_factory=dict)


class OfferPayload(BaseModel):
    hypothesis_id: int
    name: str
    value_proposition: str
    base_price: float
    price_options: list[float] = Field(default_factory=list)
    guarantee: str
    cta: str
    script_text: str
    objections_expected: list[str] = Field(default_factory=list)
    objection_responses_tree: dict[str, Any] = Field(default_factory=dict)


class ScriptPayload(BaseModel):
    hypothesis_id: int
    title: str
    body: str
    stage: str = "venta"


class ObjectionPayload(BaseModel):
    hypothesis_id: int
    offer_id: int | None = None
    text: str


class SalesEventPayload(BaseModel):
    interview_id: int
    offer_id: int
    response: str
    objections: list[str] = Field(default_factory=list)
    notes: str = ""
    accepted_price: float | None = None
    next_step: str = ""
    lead_status: str = "warm"
