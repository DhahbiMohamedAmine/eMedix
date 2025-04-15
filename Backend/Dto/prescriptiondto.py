from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class PrescriptionRequest(BaseModel):
    patient_id: int
    medecin_id: int
    medicament_id: int
    date: datetime
    content: Optional[str] = None
    dosage: Optional[str] = None
    duration: Optional[str] = None



class PrescriptionUpdate(BaseModel):
    medicament_id: Optional[int] = None
    content: Optional[str] = None
    date: Optional[datetime] = None
    dosage: Optional[str] = None
    duration: Optional[str] = None

class PrescriptionResponse(BaseModel):
    id: int
    patient_id: int
    medecin_id: int
    medicament_id: int
    date: datetime
    content: Optional[str] = None
    dosage: Optional[str] = None
    duration: Optional[str] = None

    


