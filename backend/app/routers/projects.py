from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Project
from app.schemas.core import ProjectCreate, ProjectRead

router = APIRouter(prefix="/projects", tags=["projects"])


@router.get("", response_model=list[ProjectRead])
def list_projects(q: str | None = None, db: Session = Depends(get_db)):
    stmt = select(Project)
    if q:
        stmt = stmt.where(or_(Project.name.ilike(f"%{q}%"), Project.description.ilike(f"%{q}%")))
    return db.scalars(stmt.order_by(Project.updated_at.desc())).all()


@router.get("/{item_id}", response_model=ProjectRead)
def get_project(item_id: int, db: Session = Depends(get_db)):
    item = db.get(Project, item_id)
    if not item:
        raise HTTPException(404, "Project not found")
    return item


@router.post("", response_model=ProjectRead)
def create_project(payload: ProjectCreate, db: Session = Depends(get_db)):
    item = Project(**payload.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.put("/{item_id}", response_model=ProjectRead)
def update_project(item_id: int, payload: ProjectCreate, db: Session = Depends(get_db)):
    item = db.get(Project, item_id)
    if not item:
        raise HTTPException(404, "Project not found")
    for k, v in payload.model_dump().items():
        setattr(item, k, v)
    db.commit()
    db.refresh(item)
    return item


@router.delete("/{item_id}")
def delete_project(item_id: int, db: Session = Depends(get_db)):
    item = db.get(Project, item_id)
    if not item:
        raise HTTPException(404, "Project not found")
    db.delete(item)
    db.commit()
    return {"ok": True}
