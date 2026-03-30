"""
Chat service: cleanup operations for chat history and attachments.
Handles deletion of messages and associated Cloudinary files when tasks are cancelled/completed.
"""
import logging
import os
import requests
from pathlib import Path
from sqlalchemy.orm import Session

from .. import models

logger = logging.getLogger(__name__)
UPLOADS_BASE_DIR = Path(__file__).resolve().parents[1] / "uploads"


def get_cloudinary_public_id(file_url: str) -> str:
    """
    Extract public_id from Cloudinary URL.
    Example: https://res.cloudinary.com/dcipkpth9/image/upload/v1234567890/abc123.pdf
    Returns: abc123 (or abc123.pdf depending on format)
    """
    if not file_url or "cloudinary.com" not in file_url:
        return None
    
    try:
        # Split by '/' and get the last part (filename with extension)
        parts = file_url.rstrip("/").split("/")
        filename = parts[-1]
        
        # Remove version parameter if present (e.g., "abc123.pdf" from "v1234567890/abc123.pdf")
        # The filename is what we need
        return filename
    except Exception as e:
        logger.error(f"Failed to extract public_id from {file_url}: {e}")
        return None


def delete_file_from_cloudinary(file_url: str, resource_type: str = "auto") -> bool:
    """
    Delete a file from Cloudinary using the destroy API.
    
    Args:
        file_url: Cloudinary secure URL
        resource_type: Type of resource (auto, image, raw, etc.)
    
    Returns:
        True if deletion succeeded or file doesn't exist, False if error
    """
    if not file_url:
        return True

    if "cloudinary.com" not in file_url:
        return True
    
    public_id = get_cloudinary_public_id(file_url)
    if not public_id:
        logger.warning(f"Could not extract public_id from URL: {file_url}")
        return True
    
    # Remove extension for public_id (Cloudinary expects it without extension for destroy)
    public_id_no_ext = public_id.rsplit(".", 1)[0] if "." in public_id else public_id
    
    # Get Cloudinary credentials
    cloud_name = os.getenv("CLOUDINARY_CLOUD_NAME")
    api_key = os.getenv("CLOUDINARY_API_KEY")
    api_secret = os.getenv("CLOUDINARY_API_SECRET")
    
    if not all([cloud_name, api_key, api_secret]):
        logger.error("Cloudinary credentials not configured for deletion")
        return False
    
    # Call Cloudinary destroy endpoint
    destroy_url = f"https://api.cloudinary.com/v1_1/{cloud_name}/{resource_type}/destroy"
    
    try:
        response = requests.post(
            destroy_url,
            data={
                "public_id": public_id_no_ext,
                "api_key": api_key,
                "api_secret": api_secret,
            },
            timeout=10
        )
        
        if response.status_code == 200:
            result = response.json()
            if result.get("result") == "ok":
                logger.info(f"Successfully deleted from Cloudinary: {public_id_no_ext}")
                return True
            elif result.get("result") == "not found":
                # File doesn't exist anymore - still consider it success
                logger.info(f"File not found in Cloudinary (already deleted): {public_id_no_ext}")
                return True
            else:
                logger.warning(f"Unexpected Cloudinary response: {result}")
                return False
        else:
            logger.warning(f"Cloudinary delete failed with status {response.status_code}: {response.text}")
            return False
    
    except requests.exceptions.RequestException as e:
        logger.error(f"Failed to delete from Cloudinary: {str(e)}")
        return False
    except Exception as e:
        logger.exception(f"Unexpected error deleting from Cloudinary: {str(e)}")
        return False


def delete_local_uploaded_file(file_url: str) -> bool:
    """Delete a locally served file under /api/uploads if present."""
    if not file_url or not file_url.startswith("/api/uploads/"):
        return False

    rel_path = file_url.replace("/api/uploads/", "", 1)
    target_path = (UPLOADS_BASE_DIR / rel_path).resolve()
    base_path = UPLOADS_BASE_DIR.resolve()

    # Prevent path traversal from malformed URLs.
    if not str(target_path).startswith(str(base_path)):
        logger.warning(f"Refusing to delete path outside uploads dir: {target_path}")
        return False

    if target_path.exists() and target_path.is_file():
        target_path.unlink()
        return True
    return True


def delete_task_chat_history(db: Session, task_id: int) -> dict:
    """
    Delete all chat messages for a task and their associated Cloudinary files.
    
    Args:
        db: Database session
        task_id: ID of the task
    
    Returns:
        dict with counts: {messages_deleted: int, files_deleted: int, errors: int}
    """
    stats = {
        "messages_deleted": 0,
        "files_deleted": 0,
        "errors": 0
    }
    
    try:
        # Get all messages with file attachments for this task
        messages = db.query(models.Message).filter(
            models.Message.task_id == task_id
        ).all()
        
        if not messages:
            logger.info(f"No messages found for task {task_id}")
            return stats
        
        # Delete associated attachments
        for msg in messages:
            if msg.file_url:
                if msg.file_url.startswith("/api/uploads/"):
                    success = delete_local_uploaded_file(msg.file_url)
                else:
                    success = delete_file_from_cloudinary(msg.file_url, resource_type="auto")
                if success:
                    stats["files_deleted"] += 1
                else:
                    stats["errors"] += 1
        
        # Delete all messages from database
        db.query(models.Message).filter(
            models.Message.task_id == task_id
        ).delete()
        
        stats["messages_deleted"] = len(messages)
        db.commit()
        
        logger.info(f"Deleted chat history for task {task_id}: {stats}")
        return stats
    
    except Exception as e:
        logger.exception(f"Error deleting chat history for task {task_id}: {str(e)}")
        stats["errors"] += 1
        db.rollback()
        return stats
