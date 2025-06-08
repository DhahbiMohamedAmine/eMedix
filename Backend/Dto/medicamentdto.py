from pydantic import BaseModel
from typing import Optional

class MedicamentBase(BaseModel):
    name: str
    description: Optional[str] = None
    price: Optional[float] = None
    image: Optional[str] = None
    dosage: str
    duration: str
    stock: int
    legal: bool = True  # ✅ Add legal field to base

class MedicamentCreate(MedicamentBase):
    pass

class MedicamentUpdate(BaseModel):
    price: float
    dosage: str
    duration: str
    stock: int
    image: Optional[str] = None
    legal: bool  # ✅ Make it required for update

class MedicamentResponse(MedicamentBase):
    id: int

    class Config:
        orm_mode = True