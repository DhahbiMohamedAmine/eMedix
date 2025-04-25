from fastapi import UploadFile
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
    ville: Optional[str] = None



class UserResponse(BaseModel):
    id: int
    nom: str
    prenom: str
    telephone: str
    email: str
    role: str
    photo: Optional[str]


class UpdatePatientProfileRequest(BaseModel):
    telephone: Optional[str] = None
    photo: Optional[UploadFile] = None

class UpdateMedcinProfileRequest(BaseModel):
    adresse: Optional[str]
    ville: Optional[str]
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
    ville: Optional[str]  

class PatientResponse(BaseModel):
    id: int
    user_id: int
    nom: str
    prenom: str
    telephone: str
    email: str
    photo: Optional[str]
    date_naissance: date
