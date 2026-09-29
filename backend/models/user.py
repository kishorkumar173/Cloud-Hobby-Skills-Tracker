from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from backend.database import Base

class User(Base):
    __tablename__ = "users"

    user_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(100), nullable=False)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(120), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    profile_picture = Column(String(500), default="/default-avatar.png")
    bio = Column(Text, default="Passionate lifelong learner tracking skills on the cloud.")
    interests = Column(String(255), default="Coding, Music, Photography")
    role = Column(String(20), default="user") # 'user', 'moderator', 'admin'
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    skills = relationship("Skill", back_populates="user", cascade="all, delete-orphan")
    practice_sessions = relationship("PracticeSession", back_populates="user", cascade="all, delete-orphan")
    goals = relationship("Goal", back_populates="user", cascade="all, delete-orphan")
    posts = relationship("Post", back_populates="user", cascade="all, delete-orphan")
    comments = relationship("Comment", back_populates="user", cascade="all, delete-orphan")
    likes = relationship("Like", back_populates="user", cascade="all, delete-orphan")
    files = relationship("StorageFile", back_populates="user", cascade="all, delete-orphan")

    # Following relationships
    following = relationship(
        "Follow",
        foreign_keys="Follow.follower_id",
        back_populates="follower",
        cascade="all, delete-orphan"
    )
    followers = relationship(
        "Follow",
        foreign_keys="Follow.following_id",
        back_populates="following_user",
        cascade="all, delete-orphan"
    )

class Follow(Base):
    __tablename__ = "follows"

    id = Column(Integer, primary_key=True, autoincrement=True)
    follower_id = Column(Integer, ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False)
    following_id = Column(Integer, ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    follower = relationship("User", foreign_keys=[follower_id], back_populates="following")
    following_user = relationship("User", foreign_keys=[following_id], back_populates="followers")

    __table_args__ = (
        UniqueConstraint("follower_id", "following_id", name="uq_follower_following"),
    )
