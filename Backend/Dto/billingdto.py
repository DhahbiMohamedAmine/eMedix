from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class BillingBase(BaseModel):
    order_id: str
    amount: float
    payment_method: str
    date: datetime

class BillingCreate(BillingBase):
    cart_id: Optional[int] = None

class BillingUpdate(BillingBase):
    cart_id: Optional[int] = None

class BillingOut(BillingBase):
    id: int
    cart_id: Optional[int]

    class Config:
<<<<<<< HEAD
        orm_mode = True
=======
        orm_mode = True
>>>>>>> 0274cc52ef154bb84005a7696dceebc6730baa57
