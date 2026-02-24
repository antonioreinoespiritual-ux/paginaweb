from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import and_, or_, select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Hypothesis
from app.schemas.core import HypothesisCreate, HypothesisRead

router = APIRouter(prefix="/hypotheses", tags=["hypotheses"])


@router.get("", response_model=list[HypothesisRead])
def list_hypotheses(
    q: str | None = None,
    project_id: int | None = None,
    status: str | None = None,
    db: Session = Depends(get_db),
):
    stmt = select(Hypothesis)
    filters = []
    if q:
        filters.append(or_(Hypothesis.title.ilike(f"%{q}%"), Hypothesis.pain.ilike(f"%{q}%"), Hypothesis.persona.ilike(f"%{q}%")))
    if project_id:
        filters.append(Hypothesis.project_id == project_id)
    if status:
        filters.append(Hypothesis.status == status)
    if filters:
        stmt = stmt.where(and_(*filters))
    return db.scalars(stmt.order_by(Hypothesis.updated_at.desc())).all()


@router.get("/{item_id}", response_model=HypothesisRead)
def get_hypothesis(item_id: int, db: Session = Depends(get_db)):
    item = db.get(Hypothesis, item_id)
    if not item:
        raise HTTPException(404, "Hypothesis not found")
    return item


@router.post("", response_model=HypothesisRead)
def create_hypothesis(payload: HypothesisCreate, db: Session = Depends(get_db)):
    item = Hypothesis(**payload.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.put("/{item_id}", response_model=HypothesisRead)
def update_hypothesis(item_id: int, payload: HypothesisCreate, db: Session = Depends(get_db)):
    item = db.get(Hypothesis, item_id)
    if not item:
        raise HTTPException(404, "Hypothesis not found")
    for k, v in payload.model_dump().items():
        setattr(item, k, v)
    db.commit()
    db.refresh(item)
    return item


@router.delete("/{item_id}")
def delete_hypothesis(item_id: int, db: Session = Depends(get_db)):
    item = db.get(Hypothesis, item_id)
    if not item:
        raise HTTPException(404, "Hypothesis not found")
    db.delete(item)
    db.commit()
    return {"ok": True}
