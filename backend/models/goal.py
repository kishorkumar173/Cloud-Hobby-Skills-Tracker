from datetime import datetime
from sqlalchemy import Column, Integer, Float, String, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from backend.database import Base

class Goal(Base):
    __tablename__ = "goals"

    goal_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False, index=True)
    skill_id = Column(Integer, ForeignKey("skills.skill_id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(150), nullable=False)
    target_value = Column(Float, nullable=False) # e.g. 30 (hours), 10 (songs), 50 (problems)
    current_value = Column(Float, default=0.0)
    unit = Column(String(30), default="hours") # hours, projects, sessions, chapters
    deadline = Column(DateTime, nullable=True)
    status = Column(String(20), default="IN_PROGRESS") # IN_PROGRESS, COMPLETED, ABANDONED
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="goals")
    skill = relationship("Skill", back_populates="goals")
    milestones = relationship("Milestone", back_populates="goal", cascade="all, delete-orphan")

class Milestone(Base):
    __tablename__ = "milestones"

    milestone_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    goal_id = Column(Integer, ForeignKey("goals.goal_id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(150), nullable=False)
    target_value = Column(Float, nullable=False)
    achieved = Column(Boolean, default=False)
    achieved_at = Column(DateTime, nullable=True)

    goal = relationship("Goal", back_populates="milestones")
