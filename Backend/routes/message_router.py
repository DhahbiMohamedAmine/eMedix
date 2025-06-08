from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect, Query
from fastapi.responses import JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from database import get_db
from datetime import datetime
import json
import logging
import asyncio

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
        logger.info(f"WebSocket connected for doctor {doctor_id} and patient {patient_id}. Total connections: {len(self.active_connections[key])}")

    def disconnect(self, doctor_id: int, patient_id: int, websocket: WebSocket):
        key = (doctor_id, patient_id)
        if key in self.active_connections:
            try:
                self.active_connections[key].remove(websocket)
                if not self.active_connections[key]:
                    del self.active_connections[key]
                logger.info(f"WebSocket disconnected for doctor {doctor_id} and patient {patient_id}")
            except ValueError:
                # WebSocket was already removed
                pass

    async def broadcast(self, doctor_id: int, patient_id: int, message: str):
        key = (doctor_id, patient_id)
        if key in self.active_connections:
            # Create a copy of the connections list to avoid modification during iteration
            connections = self.active_connections[key].copy()
            disconnected_connections = []
            
            for connection in connections:
                try:
                    await connection.send_text(message)
                    logger.info(f"Message broadcasted to connection")
                except Exception as e:
                    logger.error(f"Failed to send message to connection: {e}")
                    disconnected_connections.append(connection)
            
            # Remove disconnected connections
            for conn in disconnected_connections:
                try:
                    self.active_connections[key].remove(conn)
                except ValueError:
                    pass
            
            # Clean up empty connection lists
            if key in self.active_connections and not self.active_connections[key]:
                del self.active_connections[key]

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
            
            logger.info(f"Received message from {sender_id} to {receiver_id}: {content[:50]}...")
            
            # Insert message into database using a fresh session
            try:
                # Create a fresh timestamp
                timestamp = datetime.now()
                
                # Insert the message
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
                        "appointment_id": appointment_id,
                        "timestamp": timestamp
                    }
                )
                
                # Get the inserted message details
                row = result.fetchone()
                if row:
                    message_id = row[0]
                    db_timestamp = row[1]
                    
                    # Commit the transaction
                    await db.commit()
                    
                    logger.info(f"Message saved to database with ID: {message_id}")
                    
                    # Prepare the response message
                    response_message = {
                        "id": message_id,
                        "sender_id": sender_id,
                        "receiver_id": receiver_id,
                        "content": content,
                        "appointment_id": appointment_id,
                        "timestamp": db_timestamp.isoformat() if hasattr(db_timestamp, 'isoformat') else str(db_timestamp)
                    }
                    
                    # Broadcast the message to all connected clients
                    message_json = json.dumps(response_message)
                    await manager.broadcast(doctor_id, patient_id, message_json)
                    
                    logger.info(f"Message broadcasted successfully")
                else:
                    logger.error("No row returned from message insert")
                    await db.rollback()
                
            except Exception as e:
                # Roll back the transaction on error
                await db.rollback()
                logger.error(f"Error saving message: {e}")
                
                # Send error message back to the sender only
                error_response = {"error": f"Failed to save message: {str(e)}"}
                try:
                    await websocket.send_text(json.dumps(error_response))
                except Exception as send_error:
                    logger.error(f"Failed to send error message: {send_error}")
                
    except WebSocketDisconnect:
        logger.info(f"WebSocket disconnected normally for doctor {doctor_id} and patient {patient_id}")
        manager.disconnect(doctor_id, patient_id, websocket)
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        manager.disconnect(doctor_id, patient_id, websocket)
        try:
            await websocket.close()
        except:
            pass

@router.get("/messages/doctor-patient")
async def get_chat_history(
    doctor_id: int, 
    patient_id: int, 
    db: AsyncSession = Depends(get_db)
):
    """Get chat history between a doctor and patient"""
    try:
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
        
        logger.info(f"Retrieved {len(messages)} messages for doctor {doctor_id} and patient {patient_id}")
        return messages
        
    except Exception as e:
        logger.error(f"Error fetching messages: {e}")
        return JSONResponse(
            status_code=500,
            content={"detail": f"Error fetching messages: {str(e)}"}
        )

# Health check endpoint for WebSocket connections
@router.get("/chat/health")
async def chat_health():
    """Health check endpoint to verify chat service is running"""
    active_connections_count = sum(len(connections) for connections in manager.active_connections.values())
    return {
        "status": "healthy",
        "active_connections": active_connections_count,
        "connection_groups": len(manager.active_connections)
    }
