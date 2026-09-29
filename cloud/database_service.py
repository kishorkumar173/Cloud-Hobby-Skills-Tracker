from sqlalchemy import text
from sqlalchemy.orm import Session
from backend.database import engine, Base

class CloudDatabaseService:
    """
    Cloud Database Abstraction & Health Management Service.
    Demonstrates database connectivity patterns, health probes, and schema migration.
    """

    @staticmethod
    def initialize_schema():
        """Initializes tables in the target cloud database."""
        Base.metadata.create_all(bind=engine)
        return {"status": "success", "message": "Database schema initialized successfully"}

    @staticmethod
    def check_health(db: Session) -> dict:
        """
        Executes a lightweight query to test database availability.
        Used by Cloud Health Checkers & Kubernetes Liveness Probes.
        """
        try:
            db.execute(text("SELECT 1"))
            return {
                "status": "healthy",
                "dialect": engine.dialect.name,
                "pool_size": engine.pool.size() if hasattr(engine.pool, "size") else 1,
                "connected": True
            }
        except Exception as e:
            return {
                "status": "unhealthy",
                "error": str(e),
                "connected": False
            }

cloud_database = CloudDatabaseService()
