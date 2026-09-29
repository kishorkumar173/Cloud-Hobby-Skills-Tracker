from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import Optional
from backend.database import get_db
from backend.models.user import User
from backend.models.storage_file import StorageFile
from backend.middleware.auth_middleware import get_current_user
from cloud.storage_service import cloud_storage
from backend.utils.helpers import success_response

router = APIRouter(prefix="/api/files", tags=["Cloud Object Storage"])

@router.post("/upload", status_code=status.HTTP_201_CREATED)
async def upload_file_to_cloud(
    file: UploadFile = File(...),
    category: str = Form("general"), # 'profiles', 'skills', 'posts', 'achievements'
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Direct Cloud Object Storage Upload.
    - Validates file extension, MIME type, and size limits
    - Writes to Cloud Storage Bucket / Container
    - Saves metadata record to Cloud Database
    """
    content = await file.read()
    filename = file.filename or "uploaded_file"
    content_type = file.content_type or "application/octet-stream"

    try:
        storage_path, public_url, file_size = await cloud_storage.upload_file(
            file_bytes=content,
            filename=filename,
            content_type=content_type,
            user_id=current_user.user_id,
            category=category
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

    record = StorageFile(
        user_id=current_user.user_id,
        file_name=filename,
        file_type=content_type,
        file_size=file_size,
        storage_provider=cloud_storage.provider,
        storage_path=storage_path,
        public_url=public_url
    )
    db.add(record)
    db.commit()
    db.refresh(record)

    return success_response(data={
        "file_id": record.file_id,
        "file_name": record.file_name,
        "file_size": record.file_size,
        "storage_path": record.storage_path,
        "public_url": record.public_url,
        "created_at": record.created_at.isoformat()
    }, message="File uploaded to cloud storage successfully")

@router.get("")
def list_my_files(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Lists all stored files belonging to the authenticated user."""
    files = db.query(StorageFile).filter(
        StorageFile.user_id == current_user.user_id
    ).order_by(StorageFile.created_at.desc()).all()

    return success_response(data=[
        {
            "file_id": f.file_id,
            "file_name": f.file_name,
            "file_type": f.file_type,
            "file_size": f.file_size,
            "storage_path": f.storage_path,
            "public_url": f.public_url,
            "created_at": f.created_at.isoformat()
        }
        for f in files
    ])

@router.get("/{file_id}/signed-url")
def get_file_signed_url(
    file_id: int,
    expires_in: int = 3600,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Generates a temporary signed URL for secure private file download."""
    f = db.query(StorageFile).filter(
        StorageFile.file_id == file_id,
        StorageFile.user_id == current_user.user_id
    ).first()
    if not f:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="File not found")

    signed_url = cloud_storage.generate_signed_url(f.storage_path, expires_in_seconds=expires_in)
    return success_response(data={
        "file_id": f.file_id,
        "signed_url": signed_url,
        "expires_in_seconds": expires_in
    })

@router.delete("/{file_id}")
def delete_file_from_cloud(
    file_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Deletes an object from cloud storage and removes its metadata record."""
    f = db.query(StorageFile).filter(
        StorageFile.file_id == file_id,
        StorageFile.user_id == current_user.user_id
    ).first()
    if not f:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="File not found")

    cloud_storage.delete_file(f.storage_path)
    db.delete(f)
    db.commit()

    return success_response(message="File deleted from cloud storage successfully")
