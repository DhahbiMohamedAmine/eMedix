
from pydantic import BaseModel
from datetime import date
from typing import List, Optional

class PatientCreate(BaseModel):
    user_id: int
    date_naissance: date

class ToothOut(BaseModel):
    id: int
    tooth_code: str
    tooth_name: str
    note: Optional[str]
    status: str 
    
    class Config:
        orm_mode = True

class PatientOut(BaseModel):
    id: int
    user_id: int
    date_naissance: date
    teeth: List[ToothOut] = []

    class Config:
        orm_mode = True
