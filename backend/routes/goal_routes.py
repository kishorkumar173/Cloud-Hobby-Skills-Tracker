from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from backend.database import get_db
from backend.models.user import User
from backend.models.skill import Skill
from backend.models.goal import Goal, Milestone
from backend.middleware.auth_middleware import get_current_user
from backend.utils.helpers import success_response

router = APIRouter(prefix="/api/goals", tags=["Goals & Milestones"])

class CreateMilestoneSchema(BaseModel):
    title: str = Field(..., max_length=150)
    target_value: float = Field(..., gt=0)

class CreateGoalRequest(BaseModel):
    skill_id: int
    title: str = Field(..., min_length=2, max_length=150)
    target_value: float = Field(..., gt=0)
    current_value: float = 0.0
    unit: str = "hours"
    deadline: Optional[datetime] = None
    milestones: Optional[List[CreateMilestoneSchema]] = []

class UpdateGoalRequest(BaseModel):
    title: Optional[str] = None
    target_value: Optional[float] = None
    current_value: Optional[float] = None
    unit: Optional[str] = None
    status: Optional[str] = None
    deadline: Optional[datetime] = None

class UpdateMilestoneRequest(BaseModel):
    achieved: bool

@router.post("", status_code=status.HTTP_201_CREATED)
def create_goal(
    req: CreateGoalRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Creates a new learning goal with optional intermediate milestones."""
    # Verify skill belongs to user
    skill = db.query(Skill).filter(
        Skill.skill_id == req.skill_id,
        Skill.user_id == current_user.user_id
    ).first()
    if not skill:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Skill not found")

    goal = Goal(
        user_id=current_user.user_id,
        skill_id=req.skill_id,
        title=req.title.strip(),
        target_value=req.target_value,
        current_value=req.current_value,
        unit=req.unit.strip().lower(),
        deadline=req.deadline,
        status="IN_PROGRESS"
    )
    db.add(goal)
    db.flush()

    # Add default or user-provided milestones
    milestones_to_add = req.milestones or []
    if not milestones_to_add:
        # Generate 4 logical proportional milestones (e.g., 25%, 50%, 75%, 100%)
        milestones_to_add = [
            CreateMilestoneSchema(title=f"Reach {round(req.target_value * 0.25, 1)} {req.unit}", target_value=round(req.target_value * 0.25, 1)),
            CreateMilestoneSchema(title=f"Reach {round(req.target_value * 0.50, 1)} {req.unit}", target_value=round(req.target_value * 0.50, 1)),
            CreateMilestoneSchema(title=f"Reach {round(req.target_value * 0.75, 1)} {req.unit}", target_value=round(req.target_value * 0.75, 1)),
            CreateMilestoneSchema(title=f"Reach {round(req.target_value, 1)} {req.unit}", target_value=req.target_value)
        ]

    for m in milestones_to_add:
        db.add(Milestone(
            goal_id=goal.goal_id,
            title=m.title,
            target_value=m.target_value,
            achieved=(goal.current_value >= m.target_value),
            achieved_at=datetime.utcnow() if goal.current_value >= m.target_value else None
        ))

    db.commit()
    db.refresh(goal)

    return success_response(data={"goal_id": goal.goal_id, "title": goal.title}, message="Goal created successfully")

@router.get("")
def get_goals(
    skill_id: Optional[int] = Query(None),
    status_filter: Optional[str] = Query(None, alias="status"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieves all goals and milestones for the user."""
    query = db.query(Goal).filter(Goal.user_id == current_user.user_id)
    if skill_id:
        query = query.filter(Goal.skill_id == skill_id)
    if status_filter:
        query = query.filter(Goal.status == status_filter.upper())

    goals = query.order_by(Goal.created_at.desc()).all()

    skill_map = {s.skill_id: s.skill_name for s in db.query(Skill).filter(Skill.user_id == current_user.user_id).all()}

    results = []
    for g in goals:
        progress_pct = min(100.0, round((g.current_value / g.target_value) * 100, 1)) if g.target_value > 0 else 0
        results.append({
            "goal_id": g.goal_id,
            "skill_id": g.skill_id,
            "skill_name": skill_map.get(g.skill_id, "General"),
            "title": g.title,
            "target_value": g.target_value,
            "current_value": g.current_value,
            "unit": g.unit,
            "progress_percent": progress_pct,
            "status": g.status,
            "deadline": g.deadline.isoformat() if g.deadline else None,
            "milestones": [
                {
                    "milestone_id": m.milestone_id,
                    "title": m.title,
                    "target_value": m.target_value,
                    "achieved": m.achieved,
                    "achieved_at": m.achieved_at.isoformat() if m.achieved_at else None
                }
                for m in g.milestones
            ]
        })

    return success_response(data=results)

@router.put("/{goal_id}")
def update_goal(
    goal_id: int,
    req: UpdateGoalRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Updates goal attributes."""
    goal = db.query(Goal).filter(
        Goal.goal_id == goal_id,
        Goal.user_id == current_user.user_id
    ).first()
    if not goal:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Goal not found")

    if req.title is not None:
        goal.title = req.title.strip()
    if req.target_value is not None:
        goal.target_value = req.target_value
    if req.current_value is not None:
        goal.current_value = req.current_value
    if req.unit is not None:
        goal.unit = req.unit.strip().lower()
    if req.status is not None:
        goal.status = req.status.upper()
    if req.deadline is not None:
        goal.deadline = req.deadline

    # Auto check completion
    if goal.current_value >= goal.target_value:
        goal.status = "COMPLETED"

    # Check milestones
    for m in goal.milestones:
        if not m.achieved and goal.current_value >= m.target_value:
            m.achieved = True
            m.achieved_at = datetime.utcnow()

    db.commit()
    db.refresh(goal)
    return success_response(data={"goal_id": goal.goal_id}, message="Goal updated successfully")

@router.delete("/{goal_id}")
def delete_goal(
    goal_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Deletes a goal and its milestones."""
    goal = db.query(Goal).filter(
        Goal.goal_id == goal_id,
        Goal.user_id == current_user.user_id
    ).first()
    if not goal:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Goal not found")

    db.delete(goal)
    db.commit()
    return success_response(message="Goal deleted successfully")

@router.put("/milestones/{milestone_id}")
def update_milestone_status(
    milestone_id: int,
    req: UpdateMilestoneRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Toggles or updates milestone completion."""
    milestone = db.query(Milestone).join(Goal).filter(
        Milestone.milestone_id == milestone_id,
        Goal.user_id == current_user.user_id
    ).first()
    if not milestone:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Milestone not found")

    milestone.achieved = req.achieved
    milestone.achieved_at = datetime.utcnow() if req.achieved else None
    db.commit()

    return success_response(data={"milestone_id": milestone.milestone_id, "achieved": milestone.achieved})
