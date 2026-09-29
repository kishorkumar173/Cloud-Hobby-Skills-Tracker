from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field
from backend.database import get_db
from backend.models.user import User
from backend.services.auth_service import auth_service
from backend.middleware.auth_middleware import get_current_user
from backend.utils.helpers import success_response

router = APIRouter(prefix="/api", tags=["Authentication"])

class RegisterRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    username: str = Field(..., min_length=3, max_length=50)
    email: str = Field(..., pattern=r"^[\w\.-]+@[\w\.-]+\.\w+$")
    password: str = Field(..., min_length=6)
    interests: str = "Coding, Music, Photography"

class LoginRequest(BaseModel):
    username_or_email: str
    password: str

@router.post("/register", status_code=status.HTTP_201_CREATED)
def register(req: RegisterRequest, db: Session = Depends(get_db)):
    """Creates a new user profile with secure hashed password."""
    user = auth_service.register_user(
        db=db,
        name=req.name,
        username=req.username,
        email=req.email,
        password=req.password,
        interests=req.interests
    )
    auth_data = auth_service.generate_token_for_user(user)
    return success_response(data=auth_data, message="Account registered successfully")

@router.post("/login")
def login(req: LoginRequest, db: Session = Depends(get_db)):
    """Authenticates credentials and returns a JWT bearer token."""
    user = auth_service.authenticate_user(db, req.username_or_email, req.password)
    auth_data = auth_service.generate_token_for_user(user)
    return success_response(data=auth_data, message="Login successful")

@router.post("/logout")
def logout(current_user: User = Depends(get_current_user)):
    """Stateless JWT logout confirmation."""
    return success_response(message="Logged out successfully")

@router.get("/me")
def get_current_user_profile(current_user: User = Depends(get_current_user)):
    """Returns authenticated user's session data."""
    return success_response(data={
        "user_id": current_user.user_id,
        "name": current_user.name,
        "username": current_user.username,
        "email": current_user.email,
        "role": current_user.role,
        "bio": current_user.bio,
        "interests": current_user.interests,
        "profile_picture": current_user.profile_picture,
        "created_at": current_user.created_at.isoformat()
    })
