from pydantic import BaseModel
from datetime import date
from typing import Optional

# Model for creating an appointment (request body)
class AppointmentRequest(BaseModel):
    patient_id: int
    medecin_id: int
    date: date
    status: Optional[str] = "pending"
    note: Optional[str] = None

# Model for appointment response
class AppointmentResponse(BaseModel):
    id: int
    patient_id: int
    medecin_id: int
    date: date
    status: str
    note: Optional[str] = None

class UpdateAppointmentRequest(BaseModel):
    date: date  # Only the date is required for update


    class Config:
        from_attributes = True  # Updated from orm_mode in Pydantic v2