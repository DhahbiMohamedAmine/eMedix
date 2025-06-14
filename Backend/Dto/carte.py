# cart_schema.py
from pydantic import BaseModel
from typing import List

class CartItemInput(BaseModel):
    medicament_id: int
    quantity: int = 1

class AddToCartRequest(BaseModel):
    items: List[CartItemInput]


class MedicamentInCart(BaseModel):
    id: int
    name: str
    price: float

    


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
    
    
