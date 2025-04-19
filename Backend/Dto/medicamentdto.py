from pydantic import BaseModel
from typing import Optional

class MedicamentBase(BaseModel):
    name: str
    description: Optional[str] = None
    price: Optional[float] = None
    dosage: str
    duration: str

class MedicamentCreate(MedicamentBase):
    pass

# Dto/medicament.py
class MedicamentUpdate(BaseModel):
    price: float
    dosage: str
    duration: str

class MedicamentResponse(MedicamentBase):
    id: int

    class Config:
        orm_mode = True
