from typing import List
from pydantic import BaseModel


class MedicamentInCart(BaseModel):
    id: int
    name: str
    price: float

    class Config:
        orm_mode = True


class MedicamentItem(BaseModel):
    medicament_id: int
    quantity: int


class AddToCartRequest(BaseModel):
    items: List[MedicamentItem]


class CartIn(BaseModel):
    patient_id: int
    medicaments: List[MedicamentInCart]


class CartOut(BaseModel):
    id: int
    patient_id: int
    total_price: float
    medicaments: List[MedicamentInCart]
    is_paid: bool = False
    
    class Config:
        orm_mode = True
