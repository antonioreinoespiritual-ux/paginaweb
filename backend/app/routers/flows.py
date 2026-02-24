from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Flow
from app.schemas.core import FlowCreate, FlowRead

router = APIRouter(prefix="/flows", tags=["flows"])


@router.get("", response_model=list[FlowRead])
def list_flows(q: str | None = None, hypothesis_id: int | None = None, db: Session = Depends(get_db)):
    stmt = select(Flow)
    if q:
        stmt = stmt.where(or_(Flow.name.ilike(f"%{q}%"), Flow.description.ilike(f"%{q}%")))
    if hypothesis_id:
        stmt = stmt.where(Flow.hypothesis_id == hypothesis_id)
    return db.scalars(stmt.order_by(Flow.updated_at.desc())).all()


@router.get("/{item_id}", response_model=FlowRead)
def get_flow(item_id: int, db: Session = Depends(get_db)):
    item = db.get(Flow, item_id)
    if not item:
        raise HTTPException(404, "Flow not found")
    return item


@router.post("", response_model=FlowRead)
def create_flow(payload: FlowCreate, db: Session = Depends(get_db)):
    item = Flow(**payload.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.put("/{item_id}", response_model=FlowRead)
def update_flow(item_id: int, payload: FlowCreate, db: Session = Depends(get_db)):
    item = db.get(Flow, item_id)
    if not item:
        raise HTTPException(404, "Flow not found")
    for k, v in payload.model_dump().items():
        setattr(item, k, v)
    item.version += 1
    db.commit()
    db.refresh(item)
    return item


@router.delete("/{item_id}")
def delete_flow(item_id: int, db: Session = Depends(get_db)):
    item = db.get(Flow, item_id)
    if not item:
        raise HTTPException(404, "Flow not found")
    db.delete(item)
    db.commit()
    return {"ok": True}
