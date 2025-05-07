from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect, Query
from fastapi.responses import JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from database import get_db
from datetime import datetime
import json
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ConnectionManager:
    def __init__(self):
        self.active_connections = {}

    async def connect(self, doctor_id: int, patient_id: int, websocket: WebSocket):
        await websocket.accept()
        key = (doctor_id, patient_id)
        if key not in self.active_connections:
            self.active_connections[key] = []
        self.active_connections[key].append(websocket)
        logger.info(f"WebSocket connected for doctor {doctor_id} and patient {patient_id}")

    def disconnect(self, doctor_id: int, patient_id: int, websocket: WebSocket):
        key = (doctor_id, patient_id)
        if key in self.active_connections:
            self.active_connections[key].remove(websocket)
            if not self.active_connections[key]:
                del self.active_connections[key]
            logger.info(f"WebSocket disconnected for doctor {doctor_id} and patient {patient_id}")

    async def broadcast(self, doctor_id: int, patient_id: int, message: str):
        key = (doctor_id, patient_id)
        if key in self.active_connections:
            for connection in self.active_connections[key]:
                await connection.send_text(message)

manager = ConnectionManager()
router = APIRouter()

@router.websocket("/ws/chat")
async def websocket_endpoint(
    websocket: WebSocket,
    doctor_id: int = Query(...),
    patient_id: int = Query(...),
    db: AsyncSession = Depends(get_db)
):
    await manager.connect(doctor_id, patient_id, websocket)
    
    try:
        while True:
            data = await websocket.receive_text()
            message_data = json.loads(data)
            
            # Extract message data
            sender_id = message_data["sender_id"]
            receiver_id = message_data["receiver_id"]
            content = message_data["content"]
            appointment_id = message_data.get("appointment_id")
            
            # Insert message into database - use a new transaction for each message
            try:
                # Start a fresh transaction
                await db.rollback()  # Roll back any previous failed transaction
                
                # Skip appointment lookup and directly insert the message
                # This avoids the error with the doctor_id column
                query = text("""
                INSERT INTO messages (sender_id, receiver_id, content, appointment_id, timestamp)
                VALUES (:sender_id, :receiver_id, :content, :appointment_id, :timestamp)
                RETURNING id, timestamp
                """)
                
                result = await db.execute(
                    query,
                    {
                        "sender_id": sender_id,
                        "receiver_id": receiver_id,
                        "content": content,
                        "appointment_id": appointment_id,  # This can be None
                        "timestamp": datetime.now()
                    }
                )
                
                # Get the inserted message details
                row = result.fetchone()
                message_id = row[0]
                timestamp = row[1]
                
                # IMPORTANT: Commit the transaction to save to database
                await db.commit()
                
                logger.info(f"Message saved to database with ID: {message_id}")
                
                # Broadcast the message to all connected clients
                response_message = {
                    "id": message_id,
                    "sender_id": sender_id,
                    "receiver_id": receiver_id,
                    "content": content,
                    "appointment_id": appointment_id,
                    "timestamp": timestamp.isoformat() if hasattr(timestamp, 'isoformat') else str(timestamp)
                }
                
                await manager.broadcast(doctor_id, patient_id, json.dumps(response_message))
                
            except Exception as e:
                # Roll back the transaction on error
                await db.rollback()
                logger.error(f"Error saving message: {e}")
                # Try to notify the client of the error
                try:
                    await websocket.send_text(json.dumps({"error": str(e)}))
                except:
                    pass
                
    except WebSocketDisconnect:
        manager.disconnect(doctor_id, patient_id, websocket)
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        manager.disconnect(doctor_id, patient_id, websocket)

@router.get("/messages/doctor-patient")
async def get_chat_history(
    doctor_id: int, 
    patient_id: int, 
    db: AsyncSession = Depends(get_db)
):
    """Get chat history between a doctor and patient"""
    try:
        # Make sure we're starting with a clean transaction
        await db.rollback()
        
        query = text("""
        SELECT id, sender_id, receiver_id, content, 
               appointment_id, timestamp
        FROM messages
        WHERE (sender_id = :doctor_id AND receiver_id = :patient_id)
           OR (sender_id = :patient_id AND receiver_id = :doctor_id)
        ORDER BY timestamp ASC
        """)
        
        result = await db.execute(
            query, 
            {"doctor_id": doctor_id, "patient_id": patient_id}
        )
        
        messages = []
        for row in result:
            messages.append({
                "id": row.id,
                "sender_id": row.sender_id,
                "receiver_id": row.receiver_id,
                "content": row.content,
                "appointment_id": row.appointment_id,
                "timestamp": row.timestamp.isoformat() if hasattr(row.timestamp, 'isoformat') else str(row.timestamp)
            })
        
        return messages
    except Exception as e:
        # Roll back on error
        await db.rollback()
        logger.error(f"Error fetching messages: {e}")
        return JSONResponse(
            status_code=500,
            content={"detail": f"Error fetching messages: {str(e)}"}
        )
