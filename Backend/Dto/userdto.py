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
        def json_schema_extra(schema, model):
            if model.role == "patient":
                # Adjust schema for "patient" role to only show necessary fields
                schema['properties'].pop('adresse', None)
                schema['properties'].pop('diplome', None)
                schema['properties'].pop('grade', None)
                schema['properties'].pop('annee_experience', None)

class UserResponse(BaseModel):
    id: int
    nom: str
    prenom: str
    telephone: str
    email: str
    role: str
    photo: Optional[str]


class UpdatePatientProfileRequest(BaseModel):
    telephone: str
    password: str
    photo: Optional[str] = None 

class UpdateMedcinProfileRequest(BaseModel):
    adresse: Optional[str]
    telephone: Optional[str]
    photo: Optional[str]
    password:str


class PatientRequest(BaseModel):
    id: int
    user_id:int 
    user: Optional[UserResponse]

class MedcinResponse(BaseModel):
    id: int
    nom: str
    user_id: int
    prenom: str
    telephone: str
    email: str
    password: str
    photo: Optional[str] 
    adresse: Optional[str]
    diplome: Optional[str] 
    grade: Optional[str] 
    annee_experience: Optional[int]  

class PatientResponse(BaseModel):
    id: int
    user_id: int
    nom: str
    prenom: str
    telephone: str
    email: str
    photo: Optional[str]
    date_naissance: date

    class Config:
        from_attributes = True  