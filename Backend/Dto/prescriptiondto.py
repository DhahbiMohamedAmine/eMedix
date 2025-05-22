# Dto/prescriptiondto.py
from pydantic import BaseModel
from typing import List, Optional

class MedicamentItem(BaseModel):
    id: int
    duration: Optional[str] = None
    dosage: Optional[str] = None
    
class PrescriptionBase(BaseModel):
    content: str
    medicaments: List[MedicamentItem]

class PrescriptionCreate(PrescriptionBase):
    pass

class PrescriptionUpdate(BaseModel):
    content: Optional[str] = None
    medicaments: Optional[List[MedicamentItem]]

class PrescriptionOut(BaseModel):
    id: int
    content: str
    appointment_id: int
    medicaments: List[MedicamentItem]

