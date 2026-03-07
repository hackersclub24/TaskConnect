"""
Chat routes: WebSocket for real-time messaging and REST for message history.
Only task creator and assigned user (acceptor) can access the chat.
"""
import logging

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session

from .. import models
from ..core.security import decode_access_token
from ..database import SessionLocal
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


@router.websocket("/chat/{task_id}")
async def websocket_chat_endpoint(websocket: WebSocket, task_id: int):
    """
    WebSocket endpoint for task chat.
    Client must send ?token=JWT in query params for authentication.
    """
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
                    "sender_email": user.email,
                    "message": msg.message,
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
