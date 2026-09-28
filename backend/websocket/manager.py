from fastapi import WebSocket
from typing import List
import json
import logging

logger = logging.getLogger("ConnectionManager")

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.info(f"Client connected. Active: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
            logger.info(f"Client disconnected. Active: {len(self.active_connections)}")

    async def broadcast_json(self, data: dict):
        if not self.active_connections:
            return
        payload = json.dumps(data)
        disconnected = []
        for conn in self.active_connections:
            try:
                await conn.send_text(payload)
            except Exception as e:
                logger.warning(f"Send error: {e}")
                disconnected.append(conn)
        for conn in disconnected:
            self.disconnect(conn)

manager = ConnectionManager()
