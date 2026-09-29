from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from backend.database import Base

class PracticeSession(Base):
    __tablename__ = "practice_sessions"

    session_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False, index=True)
    skill_id = Column(Integer, ForeignKey("skills.skill_id", ondelete="CASCADE"), nullable=False, index=True)
    duration_minutes = Column(Integer, nullable=False) # In minutes
    activity = Column(String(200), nullable=False) # e.g. "Practiced fingerstyle chord progressions"
    notes = Column(Text, nullable=True) # Reflective notes, takeaways
    practiced_at = Column(DateTime, default=datetime.utcnow, index=True)

    # Relationships
    user = relationship("User", back_populates="practice_sessions")
    skill = relationship("Skill", back_populates="practice_sessions")
