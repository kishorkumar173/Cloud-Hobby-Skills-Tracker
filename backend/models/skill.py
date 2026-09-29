from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
import enum
from backend.database import Base

class SkillLevel(str, enum.Enum):
    BEGINNER = "BEGINNER"
    INTERMEDIATE = "INTERMEDIATE"
    ADVANCED = "ADVANCED"

class SkillStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"
    PAUSED = "PAUSED"
    COMPLETED = "COMPLETED"

class Skill(Base):
    __tablename__ = "skills"

    skill_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False, index=True)
    skill_name = Column(String(100), nullable=False)
    category = Column(String(50), nullable=False) # e.g. Music, Coding, Art, Fitness, Photography, Cooking, Writing, Other
    current_level = Column(String(20), default=SkillLevel.BEGINNER.value)
    target_level = Column(String(20), default=SkillLevel.ADVANCED.value)
    start_date = Column(DateTime, default=datetime.utcnow)
    target_date = Column(DateTime, nullable=True)
    status = Column(String(20), default=SkillStatus.ACTIVE.value)
    description = Column(Text, nullable=True)
    icon = Column(String(50), default="Sparkles")
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="skills")
    goals = relationship("Goal", back_populates="skill", cascade="all, delete-orphan")
    practice_sessions = relationship("PracticeSession", back_populates="skill", cascade="all, delete-orphan")
    posts = relationship("Post", back_populates="skill", cascade="all, delete-orphan")
