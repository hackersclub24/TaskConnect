"""
Chat routes: WebSocket for real-time messaging and REST for message history.
Only task creator and assigned user (acceptor) can access the chat.
"""
import logging
import os
import requests
from pathlib import Path
from urllib.parse import urlparse
from uuid import uuid4
from datetime import datetime

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, File, UploadFile, HTTPException, status
from sqlalchemy.orm import Session

from .. import models, schemas
from ..auth import get_current_user
from ..core.security import decode_access_token
from ..database import SessionLocal, get_db
from ..websocket_manager import manager

logger = logging.getLogger(__name__)
router = APIRouter()


def _get_user_from_token(token: str, db: Session) -> models.User | None:
    """Extract user from JWT token. Returns None if invalid."""
    if not token:
        return None
    try:
        token_data = decode_access_token(token)
        if not token_data or not token_data.user_id:
            return None
        return db.query(models.User).filter(models.User.id == token_data.user_id).first()
    except Exception as e:
        logger.warning(f"Token decode failed: {e}")
        return None


def _can_access_chat(user: models.User, task: models.Task) -> bool:
    """Check if user is allowed to access this task's chat (owner or assigned)."""
    if user.id == task.owner_id:
        return True
    if task.assigned_to is not None and user.id == task.assigned_to:
        return True
    return False


@router.post("/{task_id}/seen")
def mark_task_messages_seen(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Mark unread incoming messages as seen for the current user."""
    task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")

    if not _can_access_chat(current_user, task):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    unseen_messages = (
        db.query(models.Message)
        .filter(
            models.Message.task_id == task_id,
            models.Message.sender_id != current_user.id,
            models.Message.seen_at.is_(None),
        )
        .all()
    )

    if not unseen_messages:
        return {"updated": 0}

    seen_time = datetime.utcnow()
    for message in unseen_messages:
        message.seen_at = seen_time
    db.commit()

    return {"updated": len(unseen_messages), "seen_at": seen_time.isoformat()}


@router.post("/{task_id}/upload-pdf", response_model=schemas.MessageOut)
def upload_pdf_to_chat(
    task_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Upload PDF to task chat - stores locally for reliable direct download."""
    
    # Check task exists
    task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )
    
    # Check access (owner or assigned user)
    if current_user.id != task.owner_id and current_user.id != task.assigned_to:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    # Validate file type
    allowed_types = {"application/pdf"}
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PDF files are allowed"
        )
    
    # Validate file size (max 10MB)
    max_size = 10 * 1024 * 1024  # 10MB
    content = file.file.read()
    if len(content) > max_size:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File too large (max 10MB)"
        )
    
    try:
        uploads_dir = Path(__file__).parent.parent / "uploads" / "chat_files"
        uploads_dir.mkdir(parents=True, exist_ok=True)

        original_name = Path(file.filename or "document.pdf").name
        safe_name = original_name.replace(" ", "_")
        stored_name = f"{uuid4().hex}_{safe_name}"
        stored_path = uploads_dir / stored_name

        with open(stored_path, "wb") as f:
            f.write(content)

        file_url = f"/api/uploads/chat_files/{stored_name}"
        
        # Create message with file attachment
        msg = models.Message(
            task_id=task_id,
            sender_id=current_user.id,
            message=f"📎 Shared a PDF: {file.filename}",
            file_url=file_url,
            file_name=file.filename,
        )
        db.add(msg)
        db.commit()
        db.refresh(msg)
        
        return msg
    
    except Exception as e:
        logger.exception(f"PDF upload error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Upload failed: {str(e)}"
        )


@router.post("/{task_id}/upload-image", response_model=schemas.MessageOut)
def upload_image_to_chat(
    task_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Upload image to task chat - stores in Cloudinary"""
    
    # Check task exists
    task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )
    
    # Check access (owner or assigned user)
    if current_user.id != task.owner_id and current_user.id != task.assigned_to:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    # Validate file type (images only)
    allowed_types = {"image/jpeg", "image/png", "image/webp", "image/gif"}
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only image files (JPEG, PNG, WebP, GIF) are allowed"
        )
    
    # Validate file size (max 10MB)
    max_size = 10 * 1024 * 1024  # 10MB
    content = file.file.read()
    if len(content) > max_size:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File too large (max 10MB)"
        )
    
    # Parse Cloudinary cloud_name
    cloudinary_url_env = os.getenv("CLOUDINARY_URL", "")
    if cloudinary_url_env.startswith("cloudinary://"):
        parsed = urlparse(cloudinary_url_env)
        cloud_name = parsed.hostname
    else:
        cloud_name = os.getenv("CLOUDINARY_CLOUD_NAME")
    
    if not cloud_name:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Cloudinary cloud name not configured"
        )
    
    # Upload to Cloudinary (image endpoint)
    cloudinary_upload_url = f"https://api.cloudinary.com/v1_1/{cloud_name}/image/upload"
    
    files_data = {
        "file": (file.filename, content, file.content_type)
    }
    
    data = {
        "upload_preset": os.getenv("CLOUDINARY_UPLOAD_PRESET"),
    }
    
    try:
        response = requests.post(cloudinary_upload_url, files=files_data, data=data, timeout=10)
        response.raise_for_status()
        result = response.json()
        file_url = result.get("secure_url")
        
        if not file_url:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Cloudinary upload succeeded but no URL returned"
            )
        
        # Create message with image attachment
        msg = models.Message(
            task_id=task_id,
            sender_id=current_user.id,
            message=f"🖼️ Shared an image: {file.filename}",
            file_url=file_url,
            file_name=file.filename,
        )
        db.add(msg)
        db.commit()
        db.refresh(msg)
        
        # Broadcast to connected clients
        payload = {
            "id": msg.id,
            "task_id": msg.task_id,
            "sender_id": msg.sender_id,
            "sender_name": current_user.name or current_user.email,
            "message": msg.message,
            "file_url": msg.file_url,
            "file_name": msg.file_name,
            "seen_at": msg.seen_at.isoformat() if msg.seen_at else None,
            "seen_at": msg.seen_at.isoformat() if msg.seen_at else None,
            "timestamp": msg.timestamp.isoformat() if msg.timestamp else None,
        }
        
        return msg
    
    except requests.exceptions.RequestException as e:
        logger.error(f"Cloudinary upload failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Image hosting service temporarily unavailable. Please try again."
        )
    except Exception as e:
        logger.exception(f"Image upload error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Upload failed: {str(e)}"
        )


@router.websocket("/{task_id}")
async def websocket_chat_endpoint(websocket: WebSocket, task_id: int):
    """
    WebSocket endpoint for task chat.
    Client must send ?token=JWT in query params for authentication.
    """
    await websocket.accept()
    # return {'message': 'hello'}
    db = SessionLocal()
    try:
        token = websocket.query_params.get("token")
        user = _get_user_from_token(token, db)
        if not user:
            logger.warning(f"WebSocket auth failed for task {task_id}: no valid user")
            await websocket.close(code=4001, reason="Authentication required")
            return

        task = db.query(models.Task).filter(models.Task.id == task_id).first()
        if not task:
            logger.warning(f"WebSocket: task {task_id} not found")
            await websocket.close(code=4004, reason="Task not found")
            return

        if not _can_access_chat(user, task):
            logger.warning(f"WebSocket: user {user.id} denied access to task {task_id} chat")
            await websocket.close(code=4003, reason="Access denied")
            return

        await manager.connect(websocket, task_id)

        try:
            while True:
                data = await websocket.receive_json()
                message_text = (data.get("message") or "").strip()
                if not message_text:
                    continue

                msg = models.Message(
                    task_id=task_id,
                    sender_id=user.id,
                    message=message_text,
                )
                db.add(msg)
                db.commit()
                db.refresh(msg)

                payload = {
                    "id": msg.id,
                    "task_id": msg.task_id,
                    "sender_id": msg.sender_id,
                    "sender_name": user.name or user.email,
                    "message": msg.message,
                    "file_url": msg.file_url,
                    "file_name": msg.file_name,
                    "seen_at": msg.seen_at.isoformat() if msg.seen_at else None,
                    "timestamp": msg.timestamp.isoformat() if msg.timestamp else None,
                }
                await manager.broadcast_to_room(task_id, payload)
        except WebSocketDisconnect:
            pass
        except Exception as e:
            logger.exception(f"WebSocket error for task {task_id}: {e}")
        finally:
            manager.disconnect(websocket, task_id)
    except Exception as e:
        logger.exception(f"WebSocket setup error: {e}")
    finally:
        db.close()
