from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import InterviewSession
from app.schemas.core import InterviewSessionCreate, InterviewSessionRead

router = APIRouter(prefix="/interviews", tags=["interviews"])


@router.get("", response_model=list[InterviewSessionRead])
def list_interviews(q: str | None = None, hypothesis_id: int | None = None, status: str | None = None, db: Session = Depends(get_db)):
    stmt = select(InterviewSession)
    if q:
        stmt = stmt.where(or_(InterviewSession.interviewer.ilike(f"%{q}%"), InterviewSession.respondent_alias.ilike(f"%{q}%"), InterviewSession.notes.ilike(f"%{q}%")))
    if hypothesis_id:
        stmt = stmt.where(InterviewSession.hypothesis_id == hypothesis_id)
    if status:
        stmt = stmt.where(InterviewSession.status == status)
    return db.scalars(stmt.order_by(InterviewSession.updated_at.desc())).all()


@router.get("/{item_id}", response_model=InterviewSessionRead)
def get_interview(item_id: int, db: Session = Depends(get_db)):
    item = db.get(InterviewSession, item_id)
    if not item:
        raise HTTPException(404, "Interview not found")
    return item


@router.post("", response_model=InterviewSessionRead)
def create_interview(payload: InterviewSessionCreate, db: Session = Depends(get_db)):
    item = InterviewSession(**payload.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.put("/{item_id}", response_model=InterviewSessionRead)
def update_interview(item_id: int, payload: InterviewSessionCreate, db: Session = Depends(get_db)):
    item = db.get(InterviewSession, item_id)
    if not item:
        raise HTTPException(404, "Interview not found")
    for k, v in payload.model_dump().items():
        setattr(item, k, v)
    db.commit()
    db.refresh(item)
    return item


@router.patch("/{item_id}", response_model=InterviewSessionRead)
def patch_interview(item_id: int, payload: dict, db: Session = Depends(get_db)):
    item = db.get(InterviewSession, item_id)
    if not item:
        raise HTTPException(404, "Interview not found")
    for k, v in payload.items():
        if hasattr(item, k):
            setattr(item, k, v)
    db.commit()
    db.refresh(item)
    return item


@router.delete("/{item_id}")
def delete_interview(item_id: int, db: Session = Depends(get_db)):
    item = db.get(InterviewSession, item_id)
    if not item:
        raise HTTPException(404, "Interview not found")
    db.delete(item)
    db.commit()
    return {"ok": True}
