<<<<<<< HEAD
from typing import List
from pydantic import BaseModel

=======
# cart_schema.py
from pydantic import BaseModel
from typing import List

class CartItemInput(BaseModel):
    medicament_id: int
    quantity: int = 1

class AddToCartRequest(BaseModel):
    items: List[CartItemInput]
>>>>>>> 0274cc52ef154bb84005a7696dceebc6730baa57

class MedicamentInCart(BaseModel):
    id: int
    name: str
    price: float

    class Config:
        orm_mode = True

<<<<<<< HEAD

class MedicamentItem(BaseModel):
    medicament_id: int
    quantity: int


class AddToCartRequest(BaseModel):
    items: List[MedicamentItem]


class CartIn(BaseModel):
    patient_id: int
    medicaments: List[MedicamentInCart]


=======
>>>>>>> 0274cc52ef154bb84005a7696dceebc6730baa57
class CartOut(BaseModel):
    id: int
    patient_id: int
    total_price: float
    medicaments: List[MedicamentInCart]
<<<<<<< HEAD
    is_paid: bool = False
    
=======

>>>>>>> 0274cc52ef154bb84005a7696dceebc6730baa57
    class Config:
        orm_mode = True
