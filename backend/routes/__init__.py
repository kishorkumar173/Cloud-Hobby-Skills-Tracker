from backend.routes.auth_routes import router as auth_router
from backend.routes.profile_routes import router as profile_router
from backend.routes.skill_routes import router as skill_router
from backend.routes.goal_routes import router as goal_router
from backend.routes.practice_routes import router as practice_router
from backend.routes.post_routes import router as post_router
from backend.routes.social_routes import router as social_router
from backend.routes.file_routes import router as file_router
from backend.routes.analytics_routes import router as analytics_router

__all__ = [
    "auth_router",
    "profile_router",
    "skill_router",
    "goal_router",
    "practice_router",
    "post_router",
    "social_router",
    "file_router",
    "analytics_router"
]
