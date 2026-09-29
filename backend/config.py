import os
from typing import List
from dotenv import load_dotenv

# Load .env file if present
load_dotenv()

class Settings:
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    PORT: int = int(os.getenv("PORT", 8000))
    HOST: str = os.getenv("HOST", "0.0.0.0")

    # Security / JWT
    SECRET_KEY: str = os.getenv(
        "SECRET_KEY", 
        "cloud-hobby-skills-tracker-super-secret-key-2026-production-ready"
    )
    ALGORITHM: str = os.getenv("ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 1440))

    # Database: SQLite locally, or PostgreSQL in cloud
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./hobby_skills_tracker.db")

    # Cloud Storage Configuration
    STORAGE_PROVIDER: str = os.getenv("STORAGE_PROVIDER", "local")
    STORAGE_LOCAL_DIR: str = os.getenv("STORAGE_LOCAL_DIR", "./uploads")
    STORAGE_PUBLIC_BASE_URL: str = os.getenv("STORAGE_PUBLIC_BASE_URL", "http://localhost:8000/uploads")
    MAX_FILE_SIZE_MB: int = int(os.getenv("MAX_FILE_SIZE_MB", 5))
    ALLOWED_EXTENSIONS: List[str] = [
        ext.strip().lower() 
        for ext in os.getenv("ALLOWED_EXTENSIONS", "jpg,jpeg,png,webp,gif,pdf").split(",")
    ]

    # CORS settings
    CORS_ORIGINS: List[str] = [
        origin.strip()
        for origin in os.getenv(
            "CORS_ORIGINS", 
            "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000"
        ).split(",")
    ]

settings = Settings()
