from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from backend.database import get_db
from backend.models.user import User
from backend.models.skill import Skill
from backend.models.practice import PracticeSession
from backend.models.community import Post
from backend.middleware.auth_middleware import get_current_user
from analytics.progress_service import progress_analytics
from backend.utils.helpers import success_response

router = APIRouter(prefix="/api/analytics", tags=["Analytics & Insights"])

@router.get("/dashboard")
def get_user_dashboard(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Returns aggregated analytics for the authenticated user's command center:
    - Total Practice Hours, Weekly Hours, Monthly Hours
    - Current and Longest Streak
    - Hours by Skill distribution
    - Weekly Practice Trend
    - Goal Progress summaries
    - Gamified Badges / Achievements
    - Recent Practice Logs
    """
    data = progress_analytics.get_user_dashboard_analytics(db, current_user.user_id)
    return success_response(data=data)

@router.get("/community")
def get_community_overview(db: Session = Depends(get_db)):
    """
    Returns high-level community platform metrics:
    - Total registered learners
    - Total active skills tracked
    - Total practice hours across platform
    - Total community posts shared
    """
    total_users = db.query(User).count()
    total_skills = db.query(Skill).count()
    total_posts = db.query(Post).count()

    total_minutes = db.query(func.sum(PracticeSession.duration_minutes)).scalar() or 0
    total_hours = round(total_minutes / 60.0, 1)

    # Top popular skills categories
    popular_categories = db.query(
        Skill.category,
        func.count(Skill.skill_id).label("count")
    ).group_by(Skill.category).order_by(func.count(Skill.skill_id).desc()).limit(5).all()

    return success_response(data={
        "total_learners": total_users,
        "total_skills_tracked": total_skills,
        "total_practice_hours": total_hours,
        "total_posts_shared": total_posts,
        "popular_categories": [{"category": cat, "count": cnt} for cat, cnt in popular_categories]
    })
