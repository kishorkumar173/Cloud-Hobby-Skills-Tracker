from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from backend.database import get_db
from backend.models.user import User
from backend.models.skill import Skill
from backend.models.practice import PracticeSession
from backend.services.progress_service import goal_progress_service
from backend.services.streak_service import streak_service
from backend.middleware.auth_middleware import get_current_user
from backend.utils.helpers import success_response

router = APIRouter(prefix="/api/practice", tags=["Practice Sessions"])

class LogPracticeRequest(BaseModel):
    skill_id: int
    duration_minutes: int = Field(..., gt=0, le=1440) # Up to 24 hours
    activity: str = Field(..., min_length=2, max_length=200)
    notes: Optional[str] = None
    practiced_at: Optional[datetime] = None

@router.post("", status_code=status.HTTP_201_CREATED)
def log_practice_session(
    req: LogPracticeRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Logs a practice session for a skill.
    Automatically:
    - Increments goal progress
    - Unlocks milestones
    - Recalculates streak
    """
    skill = db.query(Skill).filter(
        Skill.skill_id == req.skill_id,
        Skill.user_id == current_user.user_id
    ).first()
    if not skill:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Skill not found")

    session = PracticeSession(
        user_id=current_user.user_id,
        skill_id=req.skill_id,
        duration_minutes=req.duration_minutes,
        activity=req.activity.strip(),
        notes=req.notes.strip() if req.notes else None,
        practiced_at=req.practiced_at or datetime.utcnow()
    )
    db.add(session)
    db.commit()
    db.refresh(session)

    # Automatically sync active goals and milestones
    sync_result = goal_progress_service.sync_goals_for_practice(
        db=db,
        user_id=current_user.user_id,
        skill_id=req.skill_id,
        duration_minutes=req.duration_minutes
    )

    # Recalculate streak
    streaks = streak_service.get_user_streak(db, current_user.user_id)

    return success_response(
        data={
            "session_id": session.session_id,
            "skill_id": skill.skill_id,
            "skill_name": skill.skill_name,
            "duration_minutes": session.duration_minutes,
            "activity": session.activity,
            "practiced_at": session.practiced_at.isoformat(),
            "current_streak": streaks["current_streak"],
            "goals_updated": sync_result["updated_goals_count"],
            "unlocked_milestones": sync_result["unlocked_milestones"]
        },
        message="Practice session recorded successfully"
    )

@router.get("")
def get_practice_history(
    skill_id: Optional[int] = Query(None),
    limit: int = Query(50, le=200),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieves practice history logs for the user."""
    query = db.query(PracticeSession).filter(PracticeSession.user_id == current_user.user_id)
    if skill_id:
        query = query.filter(PracticeSession.skill_id == skill_id)

    sessions = query.order_by(PracticeSession.practiced_at.desc()).limit(limit).all()

    skills_map = {s.skill_id: s.skill_name for s in db.query(Skill).filter(Skill.user_id == current_user.user_id).all()}

    results = [
        {
            "session_id": s.session_id,
            "skill_id": s.skill_id,
            "skill_name": skills_map.get(s.skill_id, "Unknown"),
            "duration_minutes": s.duration_minutes,
            "activity": s.activity,
            "notes": s.notes,
            "practiced_at": s.practiced_at.isoformat() if s.practiced_at else None
        }
        for s in sessions
    ]

    return success_response(data=results)

@router.delete("/{session_id}")
def delete_practice_session(
    session_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Deletes a practice session log."""
    session = db.query(PracticeSession).filter(
        PracticeSession.session_id == session_id,
        PracticeSession.user_id == current_user.user_id
    ).first()
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Practice session not found")

    db.delete(session)
    db.commit()
    return success_response(message="Practice session deleted successfully")
