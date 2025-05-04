from pydantic import BaseModel
from datetime import datetime

class BillingBase(BaseModel):
    order_id: str
    amount: float
    payment_method: str
    date: datetime

class BillingCreate(BillingBase):
    pass

class BillingUpdate(BillingBase):
    pass

class BillingOut(BillingBase):
    id: int

