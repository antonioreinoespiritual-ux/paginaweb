from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import InterviewTemplate
from app.schemas.core import InterviewTemplateCreate, InterviewTemplateRead

router = APIRouter(prefix="/interview-templates", tags=["interview-templates"])


@router.get("", response_model=list[InterviewTemplateRead])
def list_templates(q: str | None = None, db: Session = Depends(get_db)):
    stmt = select(InterviewTemplate)
    if q:
        stmt = stmt.where(or_(InterviewTemplate.name.ilike(f"%{q}%"), InterviewTemplate.goal.ilike(f"%{q}%")))
    return db.scalars(stmt.order_by(InterviewTemplate.updated_at.desc())).all()


@router.get("/{item_id}", response_model=InterviewTemplateRead)
def get_template(item_id: int, db: Session = Depends(get_db)):
    item = db.get(InterviewTemplate, item_id)
    if not item:
        raise HTTPException(404, "InterviewTemplate not found")
    return item


@router.post("", response_model=InterviewTemplateRead)
def create_template(payload: InterviewTemplateCreate, db: Session = Depends(get_db)):
    item = InterviewTemplate(**payload.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.put("/{item_id}", response_model=InterviewTemplateRead)
def update_template(item_id: int, payload: InterviewTemplateCreate, db: Session = Depends(get_db)):
    item = db.get(InterviewTemplate, item_id)
    if not item:
        raise HTTPException(404, "InterviewTemplate not found")
    for k, v in payload.model_dump().items():
        setattr(item, k, v)
    db.commit()
    db.refresh(item)
    return item


@router.delete("/{item_id}")
def delete_template(item_id: int, db: Session = Depends(get_db)):
    item = db.get(InterviewTemplate, item_id)
    if not item:
        raise HTTPException(404, "InterviewTemplate not found")
    db.delete(item)
    db.commit()
    return {"ok": True}
