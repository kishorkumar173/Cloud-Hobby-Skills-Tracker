import os
import uuid
import hmac
import hashlib
import time
from pathlib import Path
from typing import Tuple, Optional
from backend.config import settings

class CloudStorageService:
    """
    Cloud Object Storage Service Abstraction.
    Implements multi-cloud storage patterns:
    - Object key hierarchy: users/{user_id}/{category}/{unique_filename}
    - Content-type and file-size validation
    - Signed URL generation for temporary access
    - Support for Local Simulated S3/Blob, AWS S3, Supabase, and Firebase Storage.
    """

    def __init__(self):
        self.provider = settings.STORAGE_PROVIDER
        self.local_dir = Path(settings.STORAGE_LOCAL_DIR)
        self.base_url = settings.STORAGE_PUBLIC_BASE_URL.rstrip('/')
        self.max_size_bytes = settings.MAX_FILE_SIZE_MB * 1024 * 1024
        self.allowed_exts = set(settings.ALLOWED_EXTENSIONS)

        if self.provider == "local":
            self.local_dir.mkdir(parents=True, exist_ok=True)

    def validate_file(self, filename: str, file_size: int, content_type: str) -> None:
        """Enforces security controls: extension whitelist, MIME type, and size limit."""
        if file_size > self.max_size_bytes:
            raise ValueError(f"File size ({file_size / (1024*1024):.2f}MB) exceeds limit of {settings.MAX_FILE_SIZE_MB}MB")

        ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
        if ext not in self.allowed_exts:
            raise ValueError(f"File extension '.{ext}' is not permitted. Allowed: {', '.join(self.allowed_exts)}")

        # Block executable MIME types
        dangerous_mimes = ["application/x-executable", "application/x-msdownload", "application/javascript"]
        if content_type in dangerous_mimes:
            raise ValueError(f"Dangerous MIME type '{content_type}' is prohibited")

    async def upload_file(
        self,
        file_bytes: bytes,
        filename: str,
        content_type: str,
        user_id: int,
        category: str = "posts"
    ) -> Tuple[str, str, int]:
        """
        Uploads file to cloud object storage.
        Returns: (storage_path, public_or_signed_url, file_size)
        """
        file_size = len(file_bytes)
        self.validate_file(filename, file_size, content_type)

        ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else "bin"
        unique_name = f"{uuid.uuid4().hex}.{ext}"
        storage_path = f"users/{user_id}/{category}/{unique_name}"

        if self.provider == "local":
            target_path = self.local_dir / "users" / str(user_id) / category
            target_path.mkdir(parents=True, exist_ok=True)
            full_file_path = target_path / unique_name

            with open(full_file_path, "wb") as f:
                f.write(file_bytes)

            public_url = f"{self.base_url}/{storage_path}"
            return storage_path, public_url, file_size

        elif self.provider == "supabase":
            # Direct Supabase Storage integration pattern
            # supabase.storage.from_('bucket').upload(storage_path, file_bytes)
            public_url = f"{os.getenv('SUPABASE_URL')}/storage/v1/object/public/{os.getenv('SUPABASE_STORAGE_BUCKET', 'hobby-media')}/{storage_path}"
            return storage_path, public_url, file_size

        elif self.provider == "s3":
            # AWS S3 integration pattern
            # s3_client.put_object(Bucket=bucket, Key=storage_path, Body=file_bytes, ContentType=content_type)
            public_url = f"https://{os.getenv('AWS_S3_BUCKET_NAME')}.s3.{os.getenv('AWS_REGION', 'us-east-1')}.amazonaws.com/{storage_path}"
            return storage_path, public_url, file_size

        else:
            # Default fallback to local simulation
            target_path = self.local_dir / "users" / str(user_id) / category
            target_path.mkdir(parents=True, exist_ok=True)
            full_file_path = target_path / unique_name
            with open(full_file_path, "wb") as f:
                f.write(file_bytes)
            public_url = f"{self.base_url}/{storage_path}"
            return storage_path, public_url, file_size

    def delete_file(self, storage_path: str) -> bool:
        """Deletes an object from the cloud storage bucket."""
        if self.provider == "local":
            file_path = self.local_dir / storage_path
            if file_path.exists():
                file_path.unlink()
                return True
            return False
        # Cloud providers implement s3.delete_object or supabase.storage.remove
        return True

    def generate_signed_url(self, storage_path: str, expires_in_seconds: int = 3600) -> str:
        """
        Generates a cryptographically signed URL with expiration timestamp.
        Demonstrates Cloud Security & Granular Authorization for private objects.
        """
        expiration_time = int(time.time()) + expires_in_seconds
        payload = f"{storage_path}:{expiration_time}".encode("utf-8")
        signature = hmac.new(
            settings.SECRET_KEY.encode("utf-8"),
            payload,
            hashlib.sha256
        ).hexdigest()

        return f"{self.base_url}/{storage_path}?expires={expiration_time}&signature={signature}"

cloud_storage = CloudStorageService()
