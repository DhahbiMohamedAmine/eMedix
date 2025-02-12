from pydantic import BaseModel
from typing import Optional

class Medicament(BaseModel):
    libelle: str
    description: str
    prix: float
    dosage: str
    manufacturer: str


