from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Interview, Objection, Offer, SalesEvent, Script
from app.schemas.core import ObjectionPayload, OfferPayload, SalesEventPayload, ScriptPayload

router = APIRouter(tags=["sales"])


@router.get("/api/offers")
def list_offers(hypothesis_id: int | None = None, db: Session = Depends(get_db)):
    stmt = select(Offer)
    if hypothesis_id:
        stmt = stmt.where(Offer.hypothesis_id == hypothesis_id)
    return db.scalars(stmt.order_by(Offer.updated_at.desc())).all()


@router.post("/api/offers")
def create_offer(payload: OfferPayload, db: Session = Depends(get_db)):
    offer = Offer(**payload.model_dump())
    db.add(offer)
    db.commit()
    db.refresh(offer)
    return offer


@router.delete("/api/offers/{offer_id}")
def delete_offer(offer_id: int, db: Session = Depends(get_db)):
    offer = db.get(Offer, offer_id)
    if not offer:
        raise HTTPException(404)
    db.delete(offer)
    db.commit()
    return {"ok": True}


@router.get("/api/scripts")
def list_scripts(hypothesis_id: int | None = None, db: Session = Depends(get_db)):
    stmt = select(Script)
    if hypothesis_id:
        stmt = stmt.where(Script.hypothesis_id == hypothesis_id)
    return db.scalars(stmt.order_by(Script.updated_at.desc())).all()


@router.post("/api/scripts")
def create_script(payload: ScriptPayload, db: Session = Depends(get_db)):
    script = Script(**payload.model_dump())
    db.add(script)
    db.commit()
    db.refresh(script)
    return script


@router.get("/api/objections")
def list_objections(hypothesis_id: int | None = None, db: Session = Depends(get_db)):
    stmt = select(Objection)
    if hypothesis_id:
        stmt = stmt.where(Objection.hypothesis_id == hypothesis_id)
    return db.scalars(stmt.order_by(Objection.updated_at.desc())).all()


@router.post("/api/objections")
def create_objection(payload: ObjectionPayload, db: Session = Depends(get_db)):
    obj = Objection(**payload.model_dump())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


@router.post("/api/sales")
def register_sale(payload: SalesEventPayload, db: Session = Depends(get_db)):
    event = SalesEvent(**payload.model_dump())
    db.add(event)
    db.commit()
    db.refresh(event)
    return event


@router.get("/api/sales/activate")
def activate_sale(hypothesis_id: int, db: Session = Depends(get_db)):
    offers = db.scalars(select(Offer).where(Offer.hypothesis_id == hypothesis_id)).all()
    scripts = db.scalars(select(Script).where(Script.hypothesis_id == hypothesis_id)).all()
    return {
        "can_activate": len(offers) > 0,
        "recommended_script": scripts[0].body if scripts else "",
        "offers": offers,
    }


@router.get("/api/analytics/funnel")
def funnel(db: Session = Depends(get_db)):
    total = db.scalar(select(func.count(Interview.id))) or 0
    sales_mode = db.scalar(select(func.count(SalesEvent.id))) or 0
    accepted = db.scalar(select(func.count(SalesEvent.id)).where(SalesEvent.response == "acepto")) or 0
    return {
        "entrevistas_totales": total,
        "activo_modo_venta": sales_mode,
        "acepto": accepted,
        "tasa_activacion_venta": (sales_mode / total) if total else 0,
        "tasa_cierre": (accepted / sales_mode) if sales_mode else 0,
        "explicacion": "El embudo muestra desde entrevistas totales hasta aceptación de oferta.",
    }
