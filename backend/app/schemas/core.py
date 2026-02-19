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


class FlowPayload(BaseModel):
    name: str
    template_id: int | None = None
    flow_json: dict[str, Any]


class InterviewCreate(BaseModel):
    hypothesis_id: int
    flow_id: int | None = None


class InterviewResponseCreate(BaseModel):
    question_id: str
    question_text: str
    response_type: str
    response_text: str
    metadata_json: dict[str, Any] = Field(default_factory=dict)


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


class SalesEventPayload(BaseModel):
    interview_id: int
    offer_id: int
    response: str
    objections: list[str] = Field(default_factory=list)
    notes: str = ""
    accepted_price: float | None = None
    next_step: str = ""
    lead_status: str = "warm"
