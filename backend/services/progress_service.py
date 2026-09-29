from datetime import datetime
from sqlalchemy.orm import Session
from backend.models.goal import Goal, Milestone
from backend.models.practice import PracticeSession

class GoalProgressService:
    """
    Service responsible for goal progress calculations and milestone triggers.
    Runs whenever a practice session is logged or updated.
    """

    @staticmethod
    def calculate_progress_percent(current_val: float, target_val: float) -> float:
        """Calculates capped percentage progress."""
        if target_val <= 0:
            return 100.0 if current_val > 0 else 0.0
        pct = (current_val / target_val) * 100.0
        return min(100.0, max(0.0, round(pct, 1)))

    @classmethod
    def sync_goals_for_practice(cls, db: Session, user_id: int, skill_id: int, duration_minutes: int):
        """
        Updates relevant goals and automatically unlocks milestones
        matching practice duration or session count.
        """
        hours_logged = duration_minutes / 60.0

        goals = db.query(Goal).filter(
            Goal.user_id == user_id,
            Goal.skill_id == skill_id,
            Goal.status == "IN_PROGRESS"
        ).all()

        updated_goals = []
        unlocked_milestones = []

        for goal in goals:
            # If goal unit is hours, add hours; if sessions, increment by 1
            if goal.unit.lower() in ["hour", "hours", "hrs", "hr"]:
                goal.current_value = round(goal.current_value + hours_logged, 2)
            elif goal.unit.lower() in ["session", "sessions"]:
                goal.current_value = round(goal.current_value + 1, 2)

            # Check if goal target reached
            if goal.current_value >= goal.target_value:
                goal.status = "COMPLETED"

            # Check and unlock milestones
            for milestone in goal.milestones:
                if not milestone.achieved and goal.current_value >= milestone.target_value:
                    milestone.achieved = True
                    milestone.achieved_at = datetime.utcnow()
                    unlocked_milestones.append({
                        "milestone_id": milestone.milestone_id,
                        "title": milestone.title,
                        "goal_title": goal.title
                    })

            updated_goals.append(goal)

        db.commit()
        return {
            "updated_goals_count": len(updated_goals),
            "unlocked_milestones": unlocked_milestones
        }

goal_progress_service = GoalProgressService()
