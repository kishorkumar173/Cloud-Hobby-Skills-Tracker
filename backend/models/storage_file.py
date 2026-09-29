from datetime import datetime
from sqlalchemy import Column, Integer, String, BigInteger, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from backend.database import Base

class StorageFile(Base):
    __tablename__ = "storage_files"

    file_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False, index=True)
    file_name = Column(String(255), nullable=False)
    file_type = Column(String(50), nullable=False) # e.g. image/jpeg, image/png, application/pdf
    file_size = Column(BigInteger, nullable=False)  # in bytes
    storage_provider = Column(String(50), default="local") # local, s3, supabase, firebase
    storage_path = Column(String(500), nullable=False) # object path inside storage bucket
    public_url = Column(String(500), nullable=False) # Accessible web/CDN URL or signed URL
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="files")
