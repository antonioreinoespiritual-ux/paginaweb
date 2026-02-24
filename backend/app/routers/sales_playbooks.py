from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import SalesPlaybook
from app.schemas.core import SalesPlaybookCreate, SalesPlaybookRead

router = APIRouter(prefix="/sales-playbooks", tags=["sales-playbooks"])


@router.get("", response_model=list[SalesPlaybookRead])
def list_playbooks(hypothesis_id: int | None = None, db: Session = Depends(get_db)):
    stmt = select(SalesPlaybook)
    if hypothesis_id:
        stmt = stmt.where(SalesPlaybook.hypothesis_id == hypothesis_id)
    return db.scalars(stmt.order_by(SalesPlaybook.updated_at.desc())).all()


@router.get("/{item_id}", response_model=SalesPlaybookRead)
def get_playbook(item_id: int, db: Session = Depends(get_db)):
    item = db.get(SalesPlaybook, item_id)
    if not item:
        raise HTTPException(404, "SalesPlaybook not found")
    return item


@router.post("", response_model=SalesPlaybookRead)
def create_playbook(payload: SalesPlaybookCreate, db: Session = Depends(get_db)):
    exists = db.scalar(select(SalesPlaybook).where(SalesPlaybook.hypothesis_id == payload.hypothesis_id))
    if exists:
        raise HTTPException(422, "Hypothesis already has a playbook")
    item = SalesPlaybook(**payload.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.put("/{item_id}", response_model=SalesPlaybookRead)
def update_playbook(item_id: int, payload: SalesPlaybookCreate, db: Session = Depends(get_db)):
    item = db.get(SalesPlaybook, item_id)
    if not item:
        raise HTTPException(404, "SalesPlaybook not found")
    for k, v in payload.model_dump().items():
        setattr(item, k, v)
    db.commit()
    db.refresh(item)
    return item


@router.delete("/{item_id}")
def delete_playbook(item_id: int, db: Session = Depends(get_db)):
    item = db.get(SalesPlaybook, item_id)
    if not item:
        raise HTTPException(404, "SalesPlaybook not found")
    db.delete(item)
    db.commit()
    return {"ok": True}
