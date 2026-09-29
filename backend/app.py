import os
from contextlib import asynccontextmanager
from pathlib import Path
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session

from backend.config import settings
from backend.database import get_db
from cloud.database_service import cloud_database
from backend.routes import (
    auth_router,
    profile_router,
    skill_router,
    goal_router,
    practice_router,
    post_router,
    social_router,
    file_router,
    analytics_router
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Initialize Database Schema
    cloud_database.initialize_schema()
    # Ensure local upload directories exist
    upload_path = Path(settings.STORAGE_LOCAL_DIR)
    upload_path.mkdir(parents=True, exist_ok=True)
    for sub in ["profiles", "posts", "skills"]:
        (upload_path / sub).mkdir(parents=True, exist_ok=True)
    yield
    # Shutdown logic if needed

app = FastAPI(
    title="Online Hobby & Skills Tracker API",
    description="Cloud-backed hobby & skills tracking platform with progress analytics, community feed, and cloud storage.",
    version="1.0.0",
    lifespan=lifespan
)

# CORS Configuration for Cross-Device Web Clients
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS if settings.CORS_ORIGINS != ["*"] else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Cloud Object Storage Static Mount (Local Simulation)
uploads_dir = Path(settings.STORAGE_LOCAL_DIR).resolve()
uploads_dir.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(uploads_dir)), name="uploads")

# Register Feature Routers
app.include_router(auth_router)
app.include_router(profile_router)
app.include_router(skill_router)
app.include_router(goal_router)
app.include_router(practice_router)
app.include_router(post_router)
app.include_router(social_router)
app.include_router(file_router)
app.include_router(analytics_router)

from fastapi.responses import FileResponse

# Serve unified static frontend if built
frontend_dist = Path(__file__).resolve().parent.parent / "frontend" / "dist"
if frontend_dist.exists():
    assets_dir = frontend_dist / "assets"
    if assets_dir.exists():
        app.mount("/assets", StaticFiles(directory=str(assets_dir)), name="assets")
    app.mount("/client", StaticFiles(directory=str(frontend_dist), html=True), name="frontend")

@app.get("/", tags=["System"])
def root():
    index_file = frontend_dist / "index.html"
    if index_file.exists():
        return FileResponse(str(index_file))
    return {
        "service": "Online Hobby & Skills Tracker Cloud API",
        "status": "online",
        "version": "1.0.0",
        "documentation": "/docs",
        "health_check": "/health",
        "web_client": "/client/" if frontend_dist.exists() else "Run frontend dev server on port 5173"
    }

@app.get("/health", tags=["System"])
def health_check(db: Session = Depends(get_db)):
    """Cloud Health Check / Liveness & Readiness Probe."""
    db_health = cloud_database.check_health(db)
    return {
        "status": "healthy" if db_health.get("connected") else "degraded",
        "database": db_health,
        "storage_provider": settings.STORAGE_PROVIDER,
        "environment": settings.ENVIRONMENT
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app:app", host=settings.HOST, port=settings.PORT, reload=True)
