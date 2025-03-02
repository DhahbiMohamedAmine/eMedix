from pydantic import BaseModel
from typing import Optional

class LoginRequest(BaseModel):
    email: str
    password: str

class ResetPasswordRequest(BaseModel):
    email : str

class ResetPassword(BaseModel):
    token: str
    new_password: str