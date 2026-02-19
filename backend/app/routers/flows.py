from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import InterviewTemplate, InterviewFlow
from app.schemas.core import FlowPayload

router = APIRouter(tags=["flows"])


@router.get("/api/templates")
def list_templates(db: Session = Depends(get_db)):
    return db.scalars(select(InterviewTemplate)).all()


@router.post("/api/templates")
def create_template(payload: dict, db: Session = Depends(get_db)):
    t = InterviewTemplate(**payload)
    db.add(t)
    db.commit()
    db.refresh(t)
    return t


@router.get("/api/flows")
def list_flows(db: Session = Depends(get_db)):
    return db.scalars(select(InterviewFlow)).all()


@router.post("/api/flows")
def create_flow(payload: FlowPayload, db: Session = Depends(get_db)):
    flow = InterviewFlow(**payload.model_dump())
    db.add(flow)
    db.commit()
    db.refresh(flow)
    return flow
