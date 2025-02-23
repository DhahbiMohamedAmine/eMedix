from pydantic import BaseModel
from datetime import date

class UserCreate(BaseModel):
    cin: str
    nom: str
    prenom: str
    telephone: str
    email: str
    password: str
    date_de_naissance: date
