import sys
import os
from datetime import datetime

from sqlalchemy import text
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import status
from main import app
from models.users import User  
from models.patients import Patient 
from security.hash import hash_password
from database import AsyncSessionLocal

@pytest.mark.asyncio
async def test_login_success(monkeypatch):
    # Create a mock user
    async with AsyncSessionLocal() as db:
        # First create the User record
        user = User(
            nom="yahyaoui",
            prenom="dhia",
            email="dhia@example.com",
            password=hash_password("Dhia1234"),
            telephone="12345678",
            role="patient",
            isverified=True
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)
        date_naissance = datetime.strptime("2024-01-01", "%Y-%m-%d").date()

        patient = Patient(
            user_id=user.id,  
            date_naissance=date_naissance  
        )
        db.add(patient)
        await db.commit()
 
    async with AsyncSessionLocal() as db:
        # Delete in reverse order of creation (child first, then parent)
        await db.execute(text(f"DELETE FROM patients WHERE user_id = {user.id}"))
        await db.execute(text(f"DELETE FROM users WHERE id = {user.id}"))
        await db.commit()