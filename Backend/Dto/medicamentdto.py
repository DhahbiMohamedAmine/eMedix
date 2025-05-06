# Dto/medicamentdto.py
from pydantic import BaseModel
from typing import Optional

class MedicamentBase(BaseModel):
    name: str
    description: Optional[str] = None
    price: Optional[float] = None
    dosage: str
    duration: str
    stock: int  # Added stock here

class MedicamentCreate(MedicamentBase):
    pass

class MedicamentUpdate(BaseModel):
    price: float
    dosage: str
    duration: str
    stock: int  # Include stock in update too

class MedicamentResponse(MedicamentBase):
    id: int

    class Config:
<<<<<<< HEAD
        orm_mode = True
=======
        orm_mode = True
>>>>>>> 0274cc52ef154bb84005a7696dceebc6730baa57
