from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field
from typing import Optional
from backend.database import get_db
from backend.models.user import User
from backend.models.storage_file import StorageFile
from backend.middleware.auth_middleware import get_current_user
from backend.utils.helpers import success_response
from cloud.storage_service import cloud_storage

router = APIRouter(prefix="/api/profile", tags=["User Profile"])

class UpdateProfileRequest(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    bio: Optional[str] = Field(None, max_length=500)
    interests: Optional[str] = Field(None, max_length=255)
    profile_picture: Optional[str] = None

@router.get("")
def get_profile(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Fetches full personal profile with following/follower counts."""
    follower_count = len(current_user.followers)
    following_count = len(current_user.following)

    return success_response(data={
        "user_id": current_user.user_id,
        "name": current_user.name,
        "username": current_user.username,
        "email": current_user.email,
        "bio": current_user.bio,
        "interests": current_user.interests,
        "profile_picture": current_user.profile_picture,
        "role": current_user.role,
        "followers_count": follower_count,
        "following_count": following_count,
        "created_at": current_user.created_at.isoformat()
    })

@router.put("")
def update_profile(
    req: UpdateProfileRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Updates user profile information."""
    if req.name is not None:
        current_user.name = req.name.strip()
    if req.bio is not None:
        current_user.bio = req.bio.strip()
    if req.interests is not None:
        current_user.interests = req.interests.strip()
    if req.profile_picture is not None:
        current_user.profile_picture = req.profile_picture.strip()

    db.commit()
    db.refresh(current_user)

    return success_response(data={
        "user_id": current_user.user_id,
        "name": current_user.name,
        "bio": current_user.bio,
        "interests": current_user.interests,
        "profile_picture": current_user.profile_picture
    }, message="Profile updated successfully")

@router.post("/picture")
async def upload_profile_picture(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Uploads profile picture to Cloud Object Storage and updates user profile."""
    content = await file.read()
    try:
        storage_path, public_url, file_size = await cloud_storage.upload_file(
            file_bytes=content,
            filename=file.filename or "avatar.jpg",
            content_type=file.content_type or "image/jpeg",
            user_id=current_user.user_id,
            category="profiles"
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

    # Record in database storage files
    storage_record = StorageFile(
        user_id=current_user.user_id,
        file_name=file.filename or "avatar.jpg",
        file_type=file.content_type or "image/jpeg",
        file_size=file_size,
        storage_provider=cloud_storage.provider,
        storage_path=storage_path,
        public_url=public_url
    )
    db.add(storage_record)

    # Update profile picture reference
    current_user.profile_picture = public_url
    db.commit()

    return success_response(data={
        "profile_picture": public_url,
        "storage_path": storage_path
    }, message="Profile picture updated successfully")

@router.get("/{username}")
def get_public_profile(username: str, db: Session = Depends(get_db)):
    """Fetches public profile view of another community member."""
    user = db.query(User).filter(User.username == username.strip().lower()).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    return success_response(data={
        "user_id": user.user_id,
        "name": user.name,
        "username": user.username,
        "bio": user.bio,
        "interests": user.interests,
        "profile_picture": user.profile_picture,
        "followers_count": len(user.followers),
        "following_count": len(user.following),
        "created_at": user.created_at.isoformat()
    })
