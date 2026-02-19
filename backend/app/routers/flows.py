from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import FlowEdge, FlowNode, InterviewFlow, InterviewTemplate
from app.schemas.core import FlowCreate, FlowEdgePayload, FlowNodePayload

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
    return db.scalars(select(InterviewFlow).order_by(InterviewFlow.updated_at.desc())).all()


@router.post("/api/flows")
def create_flow(payload: FlowCreate, db: Session = Depends(get_db)):
    flow = InterviewFlow(**payload.model_dump())
    db.add(flow)
    db.commit()
    db.refresh(flow)
    return flow


@router.get("/api/flows/{flow_id}")
def get_flow(flow_id: int, db: Session = Depends(get_db)):
    flow = db.get(InterviewFlow, flow_id)
    if not flow:
        raise HTTPException(404)
    nodes = db.scalars(select(FlowNode).where(FlowNode.flow_id == flow_id)).all()
    edges = db.scalars(select(FlowEdge).where(FlowEdge.flow_id == flow_id)).all()
    return {"flow": flow, "nodes": nodes, "edges": edges}


@router.put("/api/flows/{flow_id}")
def save_flow(flow_id: int, payload: dict, db: Session = Depends(get_db)):
    flow = db.get(InterviewFlow, flow_id)
    if not flow:
        raise HTTPException(404)
    flow.name = payload.get("name", flow.name)
    flow.version += 1

    db.execute(delete(FlowNode).where(FlowNode.flow_id == flow_id))
    db.execute(delete(FlowEdge).where(FlowEdge.flow_id == flow_id))

    for n in payload.get("nodes", []):
        db.add(FlowNode(flow_id=flow_id, **FlowNodePayload(**n).model_dump()))
    for e in payload.get("edges", []):
        db.add(FlowEdge(flow_id=flow_id, **FlowEdgePayload(**e).model_dump()))

    db.commit()
    return {"ok": True, "version": flow.version}


@router.delete("/api/flows/{flow_id}")
def delete_flow(flow_id: int, db: Session = Depends(get_db)):
    flow = db.get(InterviewFlow, flow_id)
    if not flow:
        raise HTTPException(404)
    db.delete(flow)
    db.commit()
    return {"ok": True}
