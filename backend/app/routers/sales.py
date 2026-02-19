from fastapi import APIRouter, Depends
from sqlalchemy import select, func
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Offer, SalesEvent, Interview
from app.schemas.core import OfferPayload, SalesEventPayload

router = APIRouter(tags=["sales"])


@router.get("/api/offers")
def list_offers(db: Session = Depends(get_db)):
    return db.scalars(select(Offer)).all()


@router.post("/api/offers")
def create_offer(payload: OfferPayload, db: Session = Depends(get_db)):
    offer = Offer(**payload.model_dump())
    db.add(offer)
    db.commit()
    db.refresh(offer)
    return offer


@router.post("/api/sales")
def register_sale(payload: SalesEventPayload, db: Session = Depends(get_db)):
    event = SalesEvent(**payload.model_dump())
    db.add(event)
    db.commit()
    db.refresh(event)
    return event


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
    }
