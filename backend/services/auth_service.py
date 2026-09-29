from datetime import timedelta
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from backend.models.user import User
from cloud.auth_service import cloud_auth
from backend.config import settings

class AuthService:
    """Service handling user credentials, registration, and token validation."""

    @staticmethod
    def register_user(db: Session, name: str, username: str, email: str, password: str, interests: str = "") -> User:
        username_clean = username.strip().lower()
        email_clean = email.strip().lower()

        # Check existing username
        if db.query(User).filter(User.username == username_clean).first():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username is already taken."
            )

        # Check existing email
        if db.query(User).filter(User.email == email_clean).first():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email is already registered."
            )

        hashed_pw = cloud_auth.get_password_hash(password)
        new_user = User(
            name=name.strip(),
            username=username_clean,
            email=email_clean,
            password_hash=hashed_pw,
            interests=interests or "Coding, Music, Photography",
            bio=f"Hey there! I'm {name.strip()}, tracking my passions on the cloud.",
            profile_picture="https://api.dicebear.com/7.x/bottts/svg?seed=" + username_clean
        )
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        return new_user

    @staticmethod
    def authenticate_user(db: Session, username_or_email: str, password: str) -> User:
        clean_input = username_or_email.strip().lower()
        user = db.query(User).filter(
            (User.username == clean_input) | (User.email == clean_input)
        ).first()

        if not user or not cloud_auth.verify_password(password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid username/email or password.",
                headers={"WWW-Authenticate": "Bearer"}
            )
        return user

    @staticmethod
    def generate_token_for_user(user: User) -> dict:
        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        token_data = {
            "sub": str(user.user_id),
            "username": user.username,
            "role": user.role
        }
        token = cloud_auth.create_access_token(token_data, access_token_expires)
        return {
            "access_token": token,
            "token_type": "bearer",
            "expires_in": settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            "user": {
                "user_id": user.user_id,
                "name": user.name,
                "username": user.username,
                "email": user.email,
                "role": user.role,
                "profile_picture": user.profile_picture
            }
        }

auth_service = AuthService()
