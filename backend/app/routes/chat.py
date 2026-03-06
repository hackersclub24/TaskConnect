"""
Chat routes: WebSocket for real-time messaging and REST for message history.
Only task creator and assigned user (acceptor) can access the chat.
"""
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, status
from sqlalchemy.orm import Session

from .. import models
from ..core.security import decode_access_token
from ..database import SessionLocal
from ..websocket_manager import manager

router = APIRouter()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def _get_user_from_token(token: str, db: Session) -> models.User | None:
    """Extract user from JWT token. Returns None if invalid."""
    if not token:
        return None
    token_data = decode_access_token(token)
    if not token_data or not token_data.user_id:
        return None
    return db.query(models.User).filter(models.User.id == token_data.user_id).first()


def _can_access_chat(user: models.User, task: models.Task) -> bool:
    """Check if user is allowed to access this task's chat (owner or assigned)."""
    return user.id == task.owner_id or user.id == task.assigned_to


@router.websocket("/chat/{task_id}")
async def websocket_chat_endpoint(websocket: WebSocket, task_id: int):
    """
    WebSocket endpoint for task chat.
    Client must send ?token=JWT in query params for authentication.
    """
    db = SessionLocal()
    try:
        # Get token from query params (WebSockets don't support headers easily)
        token = websocket.query_params.get("token")
        user = _get_user_from_token(token, db)
        if not user:
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return

        task = db.query(models.Task).filter(models.Task.id == task_id).first()
        if not task:
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return

        if not _can_access_chat(user, task):
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return

        await manager.connect(websocket, task_id)

        try:
            while True:
                # Receive message from client: {"message": "text"}
                data = await websocket.receive_json()
                message_text = data.get("message", "").strip()
                if not message_text:
                    continue

                # Save to database
                msg = models.Message(
                    task_id=task_id,
                    sender_id=user.id,
                    message=message_text,
                )
                db.add(msg)
                db.commit()
                db.refresh(msg)

                # Broadcast to all in room (including sender, so they see their msg)
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
        finally:
            manager.disconnect(websocket, task_id)
    finally:
        db.close()
