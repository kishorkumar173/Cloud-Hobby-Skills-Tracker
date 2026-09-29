from datetime import datetime, timedelta
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from sqlalchemy import func
from backend.models.practice import PracticeSession
from backend.models.skill import Skill
from backend.models.goal import Goal, Milestone
from backend.models.community import Post, Like, Comment

class ProgressAnalyticsService:
    """
    Cloud Progress & Performance Analytics Engine.
    Computes real-time user statistics, streaks, trends, skill distributions,
    and gamified badge achievements.
    """

    @staticmethod
    def calculate_streaks(sessions: List[PracticeSession]) -> Dict[str, int]:
        """
        Calculates consecutive active practice days:
        - Current Streak (running active days ending today or yesterday)
        - Longest Streak (maximum consecutive active days recorded)
        """
        if not sessions:
            return {"current_streak": 0, "longest_streak": 0}

        # Extract unique dates sorted in ascending order
        dates = sorted({s.practiced_at.date() for s in sessions if s.practiced_at})
        if not dates:
            return {"current_streak": 0, "longest_streak": 0}

        # Calculate longest streak across entire history
        longest = 1
        current_run = 1
        for i in range(1, len(dates)):
            if dates[i] == dates[i - 1] + timedelta(days=1):
                current_run += 1
            else:
                current_run = 1
            if current_run > longest:
                longest = current_run

        # Calculate current streak ending today or yesterday
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

    @classmethod
    def get_user_dashboard_analytics(cls, db: Session, user_id: int) -> Dict[str, Any]:
        """Aggregates all performance analytics for the personal command center."""
        now = datetime.utcnow()
        week_ago = now - timedelta(days=7)
        month_ago = now - timedelta(days=30)

        # 1. Fetch practice sessions
        sessions = db.query(PracticeSession).filter(PracticeSession.user_id == user_id).order_by(PracticeSession.practiced_at.asc()).all()
        total_minutes = sum(s.duration_minutes for s in sessions)
        total_hours = round(total_minutes / 60.0, 1)

        weekly_minutes = sum(s.duration_minutes for s in sessions if s.practiced_at and s.practiced_at >= week_ago)
        weekly_hours = round(weekly_minutes / 60.0, 1)

        monthly_minutes = sum(s.duration_minutes for s in sessions if s.practiced_at and s.practiced_at >= month_ago)
        monthly_hours = round(monthly_minutes / 60.0, 1)

        # 2. Streaks
        streak_data = cls.calculate_streaks(sessions)

        # 3. Skills
        skills = db.query(Skill).filter(Skill.user_id == user_id).all()
        active_skills_count = sum(1 for s in skills if s.status == "ACTIVE")
        completed_skills_count = sum(1 for s in skills if s.status == "COMPLETED")

        # 4. Hours by Skill
        skill_id_map = {s.skill_id: s.skill_name for s in skills}
        skill_hours_map = {s.skill_name: 0.0 for s in skills}
        for s in sessions:
            name = skill_id_map.get(s.skill_id, "Unknown")
            skill_hours_map[name] = round(skill_hours_map.get(name, 0.0) + (s.duration_minutes / 60.0), 1)

        hours_by_skill = [
            {"skill": name, "hours": hrs} 
            for name, hrs in sorted(skill_hours_map.items(), key=lambda x: x[1], reverse=True)
        ]
        most_practiced_skill = hours_by_skill[0]["skill"] if hours_by_skill and hours_by_skill[0]["hours"] > 0 else "None"

        # 5. Weekly Trend (Last 7 Days)
        trend_days = []
        for i in range(6, -1, -1):
            day_date = (now - timedelta(days=i)).date()
            day_name = day_date.strftime("%a")
            day_mins = sum(s.duration_minutes for s in sessions if s.practiced_at and s.practiced_at.date() == day_date)
            trend_days.append({
                "date": day_date.strftime("%b %d"),
                "day": day_name,
                "hours": round(day_mins / 60.0, 1),
                "minutes": day_mins
            })

        # 6. Goals & Milestones
        goals = db.query(Goal).filter(Goal.user_id == user_id).all()
        completed_goals = sum(1 for g in goals if g.status == "COMPLETED")
        active_goals = sum(1 for g in goals if g.status == "IN_PROGRESS")

        all_milestones = db.query(Milestone).join(Goal).filter(Goal.user_id == user_id).all()
        achieved_milestones = sum(1 for m in all_milestones if m.achieved)

        goals_summary = []
        for g in goals:
            pct = min(100.0, round((g.current_value / g.target_value) * 100, 1)) if g.target_value > 0 else 0
            goals_summary.append({
                "goal_id": g.goal_id,
                "title": g.title,
                "skill_name": skill_id_map.get(g.skill_id, "General"),
                "target": g.target_value,
                "current": g.current_value,
                "unit": g.unit,
                "progress_percent": pct,
                "status": g.status
            })

        # 7. Community Engagement
        user_posts = db.query(Post).filter(Post.user_id == user_id).all()
        post_count = len(user_posts)
        post_ids = [p.post_id for p in user_posts]

        likes_received = db.query(Like).filter(Like.post_id.in_(post_ids)).count() if post_ids else 0
        comments_received = db.query(Comment).filter(Comment.post_id.in_(post_ids)).count() if post_ids else 0

        # 8. Gamified Badges / Achievements
        badges = [
            {
                "id": "first_step",
                "name": "First Step",
                "description": "Logged your first practice session",
                "icon": "Footprints",
                "color": "from-emerald-400 to-teal-500",
                "unlocked": len(sessions) >= 1
            },
            {
                "id": "streak_3",
                "name": "Streak Starter",
                "description": "Maintained a 3-day practice streak",
                "icon": "Flame",
                "color": "from-amber-400 to-orange-500",
                "unlocked": streak_data["longest_streak"] >= 3
            },
            {
                "id": "streak_7",
                "name": "Streak Master",
                "description": "Achieved a 7-day practice streak",
                "icon": "Zap",
                "color": "from-orange-500 to-red-500",
                "unlocked": streak_data["longest_streak"] >= 7
            },
            {
                "id": "polymath",
                "name": "Polymath",
                "description": "Cultivating 3 or more active skills",
                "icon": "Layers",
                "color": "from-blue-500 to-indigo-600",
                "unlocked": active_skills_count >= 3
            },
            {
                "id": "goal_crusher",
                "name": "Goal Crusher",
                "description": "Successfully completed a learning goal",
                "icon": "Trophy",
                "color": "from-yellow-400 to-amber-600",
                "unlocked": completed_goals >= 1
            },
            {
                "id": "century_club",
                "name": "Century Club",
                "description": "Accumulated 100+ total practice hours",
                "icon": "Crown",
                "color": "from-purple-500 to-pink-600",
                "unlocked": total_hours >= 100
            },
            {
                "id": "community_star",
                "name": "Community Voice",
                "description": "Shared achievements with 3+ posts",
                "icon": "MessageSquare",
                "color": "from-cyan-400 to-blue-500",
                "unlocked": post_count >= 3
            }
        ]

        return {
            "total_practice_hours": total_hours,
            "total_practice_minutes": total_minutes,
            "weekly_practice_hours": weekly_hours,
            "monthly_practice_hours": monthly_hours,
            "current_streak": streak_data["current_streak"],
            "longest_streak": streak_data["longest_streak"],
            "active_skills_count": active_skills_count,
            "completed_skills_count": completed_skills_count,
            "most_practiced_skill": most_practiced_skill,
            "goals_completed": completed_goals,
            "active_goals": active_goals,
            "milestones_achieved": achieved_milestones,
            "hours_by_skill": hours_by_skill,
            "weekly_trend": trend_days,
            "goals_summary": goals_summary,
            "posts_count": post_count,
            "likes_received": likes_received,
            "comments_received": comments_received,
            "badges": badges,
            "recent_sessions": [
                {
                    "session_id": s.session_id,
                    "skill_name": skill_id_map.get(s.skill_id, "Unknown"),
                    "duration_minutes": s.duration_minutes,
                    "activity": s.activity,
                    "notes": s.notes,
                    "practiced_at": s.practiced_at.isoformat() if s.practiced_at else None
                }
                for s in sorted(sessions, key=lambda x: x.practiced_at, reverse=True)[:5]
            ]
        }

progress_analytics = ProgressAnalyticsService()
