from pydantic import BaseModel
from datetime import date, datetime
from typing import Optional

# Model for creating an appointment (request body)
class AppointmentRequest(BaseModel):
    patient_id: int
    date: datetime
    status: Optional[str] = "waiting for medecin confirmation"
    note: Optional[str] = None

# Model for appointment response
class AppointmentResponse(BaseModel):
    id: int
    patient_id: int
    medecin_id: int
    date: datetime
    status: str
    note: Optional[str] = None

from datetime import datetime

class UpdateAppointmentRequest(BaseModel):
    date: datetime | None  # Use datetime instead of date

class AppointmentFilter(BaseModel):
    medecin_id: int
    date: date


class UpdateAppointmentNoteRequest(BaseModel):
    note: str

class AppointmentMedecinRequest(BaseModel):
    medecin_id: int
    date: datetime
    status: Optional[str] = "waiting for patient confirmation"
    note: Optional[str] = None