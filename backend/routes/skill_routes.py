from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from backend.database import get_db
from backend.models.user import User
from backend.models.skill import Skill, SkillLevel, SkillStatus
from backend.models.practice import PracticeSession
from backend.models.goal import Goal
from backend.middleware.auth_middleware import get_current_user
from backend.utils.helpers import success_response

router = APIRouter(prefix="/api/skills", tags=["Hobby & Skills Management"])

class CreateSkillRequest(BaseModel):
    skill_name: str = Field(..., min_length=2, max_length=100)
    category: str = Field(..., max_length=50) # Music, Coding, Art, Fitness, Photography, Cooking, etc.
    current_level: SkillLevel = SkillLevel.BEGINNER
    target_level: SkillLevel = SkillLevel.ADVANCED
    status: SkillStatus = SkillStatus.ACTIVE
    description: Optional[str] = None
    icon: Optional[str] = "Sparkles"
    target_date: Optional[datetime] = None

class UpdateSkillRequest(BaseModel):
    skill_name: Optional[str] = None
    category: Optional[str] = None
    current_level: Optional[SkillLevel] = None
    target_level: Optional[SkillLevel] = None
    status: Optional[SkillStatus] = None
    description: Optional[str] = None
    icon: Optional[str] = None
    target_date: Optional[datetime] = None

@router.post("", status_code=status.HTTP_201_CREATED)
def create_skill(
    req: CreateSkillRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Adds a new hobby or skill to the user's personal cloud portfolio."""
    skill = Skill(
        user_id=current_user.user_id,
        skill_name=req.skill_name.strip(),
        category=req.category.strip(),
        current_level=req.current_level.value,
        target_level=req.target_level.value,
        status=req.status.value,
        description=req.description,
        icon=req.icon or "Sparkles",
        target_date=req.target_date
    )
    db.add(skill)
    db.commit()
    db.refresh(skill)

    return success_response(data={
        "skill_id": skill.skill_id,
        "skill_name": skill.skill_name,
        "category": skill.category,
        "current_level": skill.current_level,
        "target_level": skill.target_level,
        "status": skill.status,
        "description": skill.description,
        "icon": skill.icon,
        "created_at": skill.created_at.isoformat()
    }, message=f"Skill '{skill.skill_name}' created successfully")

@router.get("")
def get_my_skills(
    category: Optional[str] = Query(None),
    status_filter: Optional[str] = Query(None, alias="status"),
    search: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieves all hobbies/skills for the authenticated user with filters."""
    query = db.query(Skill).filter(Skill.user_id == current_user.user_id)

    if category:
        query = query.filter(Skill.category.ilike(f"%{category.strip()}%"))
    if status_filter:
        query = query.filter(Skill.status == status_filter.strip().upper())
    if search:
        query = query.filter(
            (Skill.skill_name.ilike(f"%{search.strip()}%")) |
            (Skill.description.ilike(f"%{search.strip()}%"))
        )

    skills = query.order_by(Skill.created_at.desc()).all()

    # Enrich with practice minutes
    results = []
    for s in skills:
        total_mins = db.query(PracticeSession).filter(
            PracticeSession.skill_id == s.skill_id
        ).all()
        practice_time = sum(p.duration_minutes for p in total_mins)
        results.append({
            "skill_id": s.skill_id,
            "skill_name": s.skill_name,
            "category": s.category,
            "current_level": s.current_level,
            "target_level": s.target_level,
            "status": s.status,
            "description": s.description,
            "icon": s.icon,
            "total_practice_hours": round(practice_time / 60.0, 1),
            "total_practice_minutes": practice_time,
            "created_at": s.created_at.isoformat()
        })

    return success_response(data=results)

@router.get("/{skill_id}")
def get_skill_details(
    skill_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Fetches details of a specific skill, its goals, and recent practice sessions."""
    skill = db.query(Skill).filter(
        Skill.skill_id == skill_id,
        Skill.user_id == current_user.user_id
    ).first()

    if not skill:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Skill not found")

    sessions = db.query(PracticeSession).filter(
        PracticeSession.skill_id == skill_id
    ).order_by(PracticeSession.practiced_at.desc()).all()

    goals = db.query(Goal).filter(Goal.skill_id == skill_id).all()
    total_minutes = sum(s.duration_minutes for s in sessions)

    return success_response(data={
        "skill_id": skill.skill_id,
        "skill_name": skill.skill_name,
        "category": skill.category,
        "current_level": skill.current_level,
        "target_level": skill.target_level,
        "status": skill.status,
        "description": skill.description,
        "icon": skill.icon,
        "target_date": skill.target_date.isoformat() if skill.target_date else None,
        "total_practice_hours": round(total_minutes / 60.0, 1),
        "total_practice_minutes": total_minutes,
        "goals": [
            {
                "goal_id": g.goal_id,
                "title": g.title,
                "target_value": g.target_value,
                "current_value": g.current_value,
                "unit": g.unit,
                "status": g.status,
                "progress_percent": min(100.0, round((g.current_value / g.target_value) * 100, 1)) if g.target_value > 0 else 0
            }
            for g in goals
        ],
        "recent_sessions": [
            {
                "session_id": s.session_id,
                "duration_minutes": s.duration_minutes,
                "activity": s.activity,
                "notes": s.notes,
                "practiced_at": s.practiced_at.isoformat()
            }
            for s in sessions[:10]
        ]
    })

@router.put("/{skill_id}")
def update_skill(
    skill_id: int,
    req: UpdateSkillRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Updates an existing skill."""
    skill = db.query(Skill).filter(
        Skill.skill_id == skill_id,
        Skill.user_id == current_user.user_id
    ).first()

    if not skill:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Skill not found")

    if req.skill_name is not None:
        skill.skill_name = req.skill_name.strip()
    if req.category is not None:
        skill.category = req.category.strip()
    if req.current_level is not None:
        skill.current_level = req.current_level.value
    if req.target_level is not None:
        skill.target_level = req.target_level.value
    if req.status is not None:
        skill.status = req.status.value
    if req.description is not None:
        skill.description = req.description
    if req.icon is not None:
        skill.icon = req.icon
    if req.target_date is not None:
        skill.target_date = req.target_date

    db.commit()
    db.refresh(skill)
    return success_response(data={"skill_id": skill.skill_id}, message="Skill updated successfully")

@router.delete("/{skill_id}")
def delete_skill(
    skill_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Deletes a skill and cascades deletions to goals and practice sessions."""
    skill = db.query(Skill).filter(
        Skill.skill_id == skill_id,
        Skill.user_id == current_user.user_id
    ).first()

    if not skill:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Skill not found")

    db.delete(skill)
    db.commit()
    return success_response(message="Skill deleted successfully")
