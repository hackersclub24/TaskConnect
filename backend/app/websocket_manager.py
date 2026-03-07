"""
WebSocket connection manager for task chat rooms.
Handles multiple users in the same chat room and broadcasts messages in real-time.
"""
import json
import logging
from collections import defaultdict
from typing import Dict, Set

from fastapi import WebSocket

logger = logging.getLogger(__name__)


class ConnectionManager:
    """
    Manages WebSocket connections per task room.
    task_id -> set of (websocket, user_id) connections
    """

    def __init__(self):
        # task_id -> set of WebSocket instances
        self.active_connections: Dict[int, Set[WebSocket]] = defaultdict(set)

    async def connect(
        self,
        websocket: WebSocket,
        task_id: int,
    ) -> None:
        """Add a WebSocket connection to the task room. Must be accepted by the router first."""
        self.active_connections[task_id].add(websocket)
        logger.info(f"Client connected to task {task_id}, total: {len(self.active_connections[task_id])}")

    def disconnect(self, websocket: WebSocket, task_id: int) -> None:
        """Remove a WebSocket from the task room."""
        self.active_connections[task_id].discard(websocket)
        if not self.active_connections[task_id]:
            del self.active_connections[task_id]
        logger.info(f"Client disconnected from task {task_id}")

    async def broadcast_to_room(
        self,
        task_id: int,
        message: dict,
        exclude: WebSocket | None = None,
    ) -> None:
        """Send a message to all connected clients in the task room."""
        if task_id not in self.active_connections:
            return
        disconnected = set()
        for connection in list(self.active_connections[task_id]):
            if connection is exclude:
                continue
            try:
                await connection.send_json(message)
            except Exception as e:
                logger.warning(f"Failed to send to client: {e}")
                disconnected.add(connection)
        for conn in disconnected:
            self.disconnect(conn, task_id)


# Global connection manager instance
manager = ConnectionManager()
