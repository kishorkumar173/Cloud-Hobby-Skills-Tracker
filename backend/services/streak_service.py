from datetime import datetime, timedelta
from typing import Dict, List
from sqlalchemy.orm import Session
from backend.models.practice import PracticeSession

class StreakService:
    """
    Dedicated Service for calculating and maintaining habit streaks.
    Uses consecutive calendar dates to track engagement continuity.
    """

    @staticmethod
    def get_user_streak(db: Session, user_id: int) -> Dict[str, int]:
        sessions = db.query(PracticeSession).filter(
            PracticeSession.user_id == user_id
        ).order_by(PracticeSession.practiced_at.asc()).all()

        if not sessions:
            return {"current_streak": 0, "longest_streak": 0}

        dates = sorted({s.practiced_at.date() for s in sessions if s.practiced_at})
        if not dates:
            return {"current_streak": 0, "longest_streak": 0}

        longest = 1
        current_run = 1
        for i in range(1, len(dates)):
            if dates[i] == dates[i - 1] + timedelta(days=1):
                current_run += 1
            else:
                current_run = 1
            if current_run > longest:
                longest = current_run

        today = datetime.utcnow().date()
        yesterday = today - timedelta(days=1)
        last_date = dates[-1]

        if last_date < yesterday:
            current_streak = 0
        else:
            current_streak = 0
            check_date = last_date
            dates_set = set(dates)
            while check_date in dates_set:
                current_streak += 1
                check_date -= timedelta(days=1)

        return {
            "current_streak": current_streak,
            "longest_streak": max(longest, current_streak)
        }

streak_service = StreakService()
