from pydantic import BaseModel
from datetime import date
from typing import Optional

class UserRequest(BaseModel):
    nom: str
    prenom: str
    telephone: str
    email: str
    password: str
    role: str
    isverified: bool = False  # Automatically set to False
    photo: Optional[str] = None  # Optional for all roles, can be included later
    date_naissance: Optional[str] = None  # Only needed for "patient" role
    adresse: Optional[str] = None
    diplome: Optional[str] = None
    grade: Optional[str] = None
    annee_experience: Optional[int] = None

    class Config:
        # This will allow only fields relevant to the role
        # "role" determines the required fields
        @staticmethod
        def schema_extra(schema, model):
            if model.role == "patient":
                # Adjust schema for "patient" role to only show necessary fields
                schema['properties'].pop('adresse', None)
                schema['properties'].pop('diplome', None)
                schema['properties'].pop('grade', None)
                schema['properties'].pop('annee_experience', None)
