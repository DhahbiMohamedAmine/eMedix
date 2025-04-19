from pydantic import BaseModel
from typing import List, Optional

class PrescriptionBase(BaseModel):
    content: str
    medicament_ids: List[int]

class PrescriptionCreate(PrescriptionBase):
    pass

class PrescriptionUpdate(BaseModel):
    content: Optional[str] = None
    medicament_ids: Optional[List[int]] = None

class PrescriptionOut(BaseModel):
    id: int
    content: str
    appointment_id: int
    medicament_ids: List[int]

    class Config:
        orm_mode = True
