from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect, Query
from fastapi.responses import JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from database import get_db
from models.messages import Message
from models.appointments import Appointment
from datetime import datetime
from typing import Dict, List
import json

class WebSocketManager:
    def __init__(self):
        self.active_connections: Dict[int, List[WebSocket]] = {}  # key: appointment_id

    async def connect(self, appointment_id: int, websocket: WebSocket):
        await websocket.accept()
        if appointment_id not in self.active_connections:
            self.active_connections[appointment_id] = []
        self.active_connections[appointment_id].append(websocket)

    def disconnect(self, appointment_id: int, websocket: WebSocket):
        if appointment_id in self.active_connections:
            self.active_connections[appointment_id].remove(websocket)
            if not self.active_connections[appointment_id]:
                del self.active_connections[appointment_id]

    async def send_personal_message(self, message: str, websocket: WebSocket):
        await websocket.send_text(message)

    async def broadcast(self, appointment_id: int, message: str):
        connections = self.active_connections.get(appointment_id, [])
        for connection in connections:
            await connection.send_text(message)

manager = WebSocketManager()
router = APIRouter()

@router.websocket("/ws")
async def websocket_endpoint(
    websocket: WebSocket,
    appointment_id: int = Query(...),
    db: AsyncSession = Depends(get_db)
):
    await manager.connect(appointment_id, websocket)

    try:
        while True:
            data = await websocket.receive_text()
            message_data = json.loads(data)

            # Extract message info
            sender_id = message_data["sender_id"]
            receiver_id = message_data["receiver_id"]
            content = message_data["content"]

            # Save to DB
            msg = Message(
                appointment_id=appointment_id,
                sender_id=sender_id,
                receiver_id=receiver_id,
                content=content,
            )
            db.add(msg)
            await db.commit()

            # Broadcast to the appointment chat room
            await manager.broadcast(
                appointment_id,
                json.dumps({
                    "sender_id": sender_id,
                    "receiver_id": receiver_id,
                    "content": content,
                    "timestamp": msg.timestamp.isoformat()
                })
            )

    except WebSocketDisconnect:
        manager.disconnect(appointment_id, websocket)
        
        
@router.get("/messages/{appointment_id}")
async def get_chat_history(appointment_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Message).where(Message.appointment_id == appointment_id).order_by(Message.timestamp)
    )
    return result.scalars().all()

    
      