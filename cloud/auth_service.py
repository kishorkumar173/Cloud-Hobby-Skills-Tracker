from datetime import datetime, timedelta
from typing import Optional, Dict, Any
import jwt
import bcrypt
from backend.config import settings

class CloudAuthService:
    """
    Cloud Identity & Access Management (IAM) Service.
    Handles JWT issuance, verification, password hashing, and token claims.
    Can be seamlessly replaced with Firebase Auth or AWS Cognito tokens.
    """

    @staticmethod
    def verify_password(plain_password: str, hashed_password: str) -> bool:
        try:
            return bcrypt.checkpw(
                plain_password.encode("utf-8"),
                hashed_password.encode("utf-8")
            )
        except Exception:
            return False

    @staticmethod
    def get_password_hash(password: str) -> str:
        salt = bcrypt.gensalt()
        return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")

    @staticmethod
    def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
        """Issues cryptographically signed JWT bearer token with claims."""
        to_encode = data.copy()
        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)

        to_encode.update({
            "exp": expire,
            "iat": datetime.utcnow(),
            "iss": "cloud-hobby-skills-tracker-auth-service"
        })
        encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
        return encoded_jwt

    @staticmethod
    def decode_token(token: str) -> Optional[Dict[str, Any]]:
        """Validates and decodes JWT token."""
        try:
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
            return payload
        except (jwt.ExpiredSignatureError, jwt.InvalidTokenError):
            return None

cloud_auth = CloudAuthService()
