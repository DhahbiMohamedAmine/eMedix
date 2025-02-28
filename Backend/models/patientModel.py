from pydantic import BaseModel
from datetime import date
from typing import Optional

class patientcreate(BaseModel):
    nom: str
    prenom: str
    telephone: str
    email: str
    password: str
    isverified: Optional[bool] = False  # Set default to False
    date_de_naissance: date
    photo: Optional[str] = None

    class Config:
        orm_mode = True  # For compatibility with SQLAlchemy models
