# Dto/medicament.py
from pydantic import BaseModel
from typing import Optional

class MedicamentBase(BaseModel):
    name: str
    description: Optional[str] = None
    dosage: Optional[str] = None

class MedicamentCreate(MedicamentBase):
    pass

class MedicamentUpdate(MedicamentBase):
    pass

class MedicamentResponse(MedicamentBase):
    id: int

    class Config:
        orm_mode = True
