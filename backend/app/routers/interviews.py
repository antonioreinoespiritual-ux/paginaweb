from datetime import datetime
import json
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy import select
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import HypothesisRule, Interview, InterviewResponse, InterviewScore, EmbeddingStore
from app.schemas.core import InterviewCreate, InterviewResponseCreate, RuleConfig
from app.services.embedding_service import normalize_text, simple_embedding
from app.services.scoring_engine import compute_scores

router = APIRouter(prefix="/api/interviews", tags=["interviews"])


@router.get("")
def list_interviews(db: Session = Depends(get_db)):
    return db.scalars(select(Interview)).all()


@router.post("")
def create_interview(payload: InterviewCreate, db: Session = Depends(get_db)):
    interview = Interview(**payload.model_dump(), status="draft")
    db.add(interview)
    db.commit()
    db.refresh(interview)
    return interview


@router.post("/{interview_id}/start")
def start_interview(interview_id: int, db: Session = Depends(get_db)):
    interview = db.get(Interview, interview_id)
    if not interview:
        raise HTTPException(404)
    interview.status = "in_progress"
    interview.started_at = datetime.utcnow()
    db.commit()
    return {"ok": True}


@router.post("/{interview_id}/finalize")
def finalize_interview(interview_id: int, db: Session = Depends(get_db)):
    interview = db.get(Interview, interview_id)
    if not interview:
        raise HTTPException(404)
    interview.status = "completed"
    interview.ended_at = datetime.utcnow()
    db.commit()
    return {"ok": True}


@router.post("/{interview_id}/responses")
def save_response(interview_id: int, payload: InterviewResponseCreate, db: Session = Depends(get_db)):
    interview = db.get(Interview, interview_id)
    if not interview:
        raise HTTPException(404)
    response = InterviewResponse(interview_id=interview_id, **payload.model_dump())
    db.add(response)

    norm = normalize_text(payload.response_text)
    vec = simple_embedding(norm)
    db.add(EmbeddingStore(interview_id=interview_id, hypothesis_id=interview.hypothesis_id, source_text=norm, vector=vec))

    rules = db.scalars(select(HypothesisRule).where(HypothesisRule.hypothesis_id == interview.hypothesis_id)).all()
    parsed = [RuleConfig(**r.rule_json) for r in rules]
    score_result = compute_scores(parsed, norm)
    cached = db.scalar(select(InterviewScore).where(InterviewScore.interview_id == interview_id))
    if not cached:
        cached = InterviewScore(interview_id=interview_id, hypothesis_id=interview.hypothesis_id)
        db.add(cached)
    cached.total_score = score_result["score_total_hipotesis"]
    cached.criteria_scores = score_result["score_por_criterio"]
    cached.flags = score_result["flags"]
    cached.evidence = score_result["evidencia"]

    db.commit()
    return {"ok": True, "scores": score_result}


@router.get("/{interview_id}/scores")
def get_scores(interview_id: int, db: Session = Depends(get_db)):
    score = db.scalar(select(InterviewScore).where(InterviewScore.interview_id == interview_id))
    if not score:
        raise HTTPException(404)
    return score


@router.get("/{interview_id}/live")
def live_scores(interview_id: int, db: Session = Depends(get_db)):
    def event_gen():
        score = db.scalar(select(InterviewScore).where(InterviewScore.interview_id == interview_id))
        payload = {"total": score.total_score if score else 0, "flags": score.flags if score else {}}
        yield f"data: {json.dumps(payload)}\n\n"

    return StreamingResponse(event_gen(), media_type="text/event-stream")
