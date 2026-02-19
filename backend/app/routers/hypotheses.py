from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Hypothesis, HypothesisRule, InterviewScore, EmbeddingStore
from app.schemas.core import HypothesisCreate, HypothesisRead, RuleCreate, RuleRead, RuleConfig
from app.services.analytics_engine import build_hypothesis_dashboard
from app.services.clustering_service import cluster_embeddings

router = APIRouter(prefix="/api/hypotheses", tags=["hypotheses"])


@router.get("", response_model=list[HypothesisRead])
def list_hypotheses(db: Session = Depends(get_db)):
    return db.scalars(select(Hypothesis)).all()


@router.post("", response_model=HypothesisRead)
def create_hypothesis(payload: HypothesisCreate, db: Session = Depends(get_db)):
    hyp = Hypothesis(**payload.model_dump())
    db.add(hyp)
    db.commit()
    db.refresh(hyp)
    return hyp


@router.get("/{hypothesis_id}", response_model=HypothesisRead)
def get_hypothesis(hypothesis_id: int, db: Session = Depends(get_db)):
    hyp = db.get(Hypothesis, hypothesis_id)
    if not hyp:
        raise HTTPException(404)
    return hyp


@router.put("/{hypothesis_id}", response_model=HypothesisRead)
def update_hypothesis(hypothesis_id: int, payload: HypothesisCreate, db: Session = Depends(get_db)):
    hyp = db.get(Hypothesis, hypothesis_id)
    if not hyp:
        raise HTTPException(404)
    for k, v in payload.model_dump().items():
        setattr(hyp, k, v)
    db.commit()
    db.refresh(hyp)
    return hyp


@router.delete("/{hypothesis_id}")
def delete_hypothesis(hypothesis_id: int, db: Session = Depends(get_db)):
    hyp = db.get(Hypothesis, hypothesis_id)
    if not hyp:
        raise HTTPException(404)
    db.delete(hyp)
    db.commit()
    return {"ok": True}


@router.get("/{hypothesis_id}/rules", response_model=list[RuleRead])
def list_rules(hypothesis_id: int, db: Session = Depends(get_db)):
    return db.scalars(select(HypothesisRule).where(HypothesisRule.hypothesis_id == hypothesis_id)).all()


@router.post("/{hypothesis_id}/rules", response_model=RuleRead)
def create_rule(hypothesis_id: int, payload: RuleCreate, db: Session = Depends(get_db)):
    rule = HypothesisRule(hypothesis_id=hypothesis_id, name=payload.name, rule_json=payload.rule_json.model_dump())
    db.add(rule)
    db.commit()
    db.refresh(rule)
    return RuleRead(id=rule.id, hypothesis_id=rule.hypothesis_id, name=rule.name, rule_json=RuleConfig(**rule.rule_json))


@router.get("/{hypothesis_id}/dashboard")
def get_dashboard(hypothesis_id: int, db: Session = Depends(get_db)):
    hyp = db.get(Hypothesis, hypothesis_id)
    scores = db.scalars(select(InterviewScore).where(InterviewScore.hypothesis_id == hypothesis_id)).all()
    data = [
        {"total_score": s.total_score, "evidence": s.evidence or {}}
        for s in scores
    ]
    return build_hypothesis_dashboard(data, hyp.validation_threshold if hyp else 70)


@router.get("/{hypothesis_id}/clusters")
def get_clusters(hypothesis_id: int, db: Session = Depends(get_db)):
    rows = db.scalars(select(EmbeddingStore).where(EmbeddingStore.hypothesis_id == hypothesis_id)).all()
    return cluster_embeddings([r.source_text for r in rows], [r.vector for r in rows])
