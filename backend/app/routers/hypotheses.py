from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Hypothesis, HypothesisRule, InterviewScore
from app.schemas.core import HypothesisCreate, HypothesisRead, RuleConfig, RuleCreate, RuleRead
from app.services.analytics_engine import build_hypothesis_dashboard

router = APIRouter(prefix="/api/hypotheses", tags=["hypotheses"])


@router.get("", response_model=list[HypothesisRead])
def list_hypotheses(
    q: str | None = None,
    status: str | None = None,
    hypothesis_type: str | None = Query(None, alias="type"),
    limit: int = 30,
    offset: int = 0,
    db: Session = Depends(get_db),
):
    stmt = select(Hypothesis)
    if q:
        stmt = stmt.where(or_(Hypothesis.short_name.ilike(f"%{q}%"), Hypothesis.statement.ilike(f"%{q}%")))
    if status:
        stmt = stmt.where(Hypothesis.status == status)
    if hypothesis_type:
        stmt = stmt.where(Hypothesis.type == hypothesis_type)
    stmt = stmt.order_by(Hypothesis.updated_at.desc()).limit(limit).offset(offset)
    return db.scalars(stmt).all()


@router.post("", response_model=HypothesisRead)
def create_hypothesis(payload: HypothesisCreate, db: Session = Depends(get_db)):
    hyp = Hypothesis(**payload.model_dump())
    db.add(hyp)
    db.commit()
    db.refresh(hyp)
    return hyp


@router.get("/{hypothesis_id}")
def get_hypothesis_detail(hypothesis_id: int, db: Session = Depends(get_db)):
    hyp = db.get(Hypothesis, hypothesis_id)
    if not hyp:
        raise HTTPException(404, "Hypothesis not found")
    rules = db.scalars(select(HypothesisRule).where(HypothesisRule.hypothesis_id == hypothesis_id)).all()
    scores = db.scalars(select(InterviewScore).where(InterviewScore.hypothesis_id == hypothesis_id)).all()
    return {
        "hypothesis": HypothesisRead.model_validate(hyp),
        "rules": [RuleRead(id=r.id, hypothesis_id=r.hypothesis_id, name=r.name, rule_json=RuleConfig(**r.rule_json)) for r in rules],
        "metrics": {
            "interviews": len(scores),
            "avg_score": sum(s.total_score for s in scores) / len(scores) if scores else 0,
        },
    }


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
    rows = db.scalars(select(HypothesisRule).where(HypothesisRule.hypothesis_id == hypothesis_id)).all()
    return [RuleRead(id=r.id, hypothesis_id=r.hypothesis_id, name=r.name, rule_json=RuleConfig(**r.rule_json)) for r in rows]


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
    data = [{"total_score": s.total_score, "evidence": s.evidence or {}} for s in scores]
    dashboard = build_hypothesis_dashboard(data, hyp.validation_threshold if hyp else 70)
    dashboard["ultima_semana"] = db.scalar(select(func.count(InterviewScore.id)).where(InterviewScore.hypothesis_id == hypothesis_id)) or 0
    return dashboard
