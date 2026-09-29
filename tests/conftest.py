import os
import sys
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Add project root to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.database import Base, get_db
from backend.app import app
from cloud.auth_service import cloud_auth
from backend.models.user import User

TEST_DATABASE_URL = "sqlite:///./test_hobby_tracker.db"
test_engine = create_engine(TEST_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)

@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    Base.metadata.create_all(bind=test_engine)
    yield
    Base.metadata.drop_all(bind=test_engine)
    if os.path.exists("./test_hobby_tracker.db"):
        try:
            os.remove("./test_hobby_tracker.db")
        except Exception:
            pass

@pytest.fixture
def db_session():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

@pytest.fixture
def client(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass
    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()

@pytest.fixture
def test_user(db_session):
    user = db_session.query(User).filter(User.username == "test_learner").first()
    if not user:
        user = User(
            name="Test Learner",
            username="test_learner",
            email="test@learner.com",
            password_hash=cloud_auth.get_password_hash("Password123!"),
            role="user",
            bio="Testing cloud tracking platform",
            interests="Coding, Guitar"
        )
        db_session.add(user)
        db_session.commit()
        db_session.refresh(user)
    return user

@pytest.fixture
def auth_headers(test_user):
    token = cloud_auth.create_access_token({"sub": str(test_user.user_id), "username": test_user.username, "role": test_user.role})
    return {"Authorization": f"Bearer {token}"}
