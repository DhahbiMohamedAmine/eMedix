import sys
import os
from datetime import datetime
from unittest.mock import Mock

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import pytest
from httpx import ASGITransport, AsyncClient
from fastapi import status
from main import app
from security.hash import hash_password

@pytest.mark.asyncio
async def test_login_existing_user():
    email = "dhahbimohamedamine01@gmail.com"
    password = "hama1234"

    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test"
    ) as ac:
        response = await ac.post("/auth/login", json={
            "email": email,
            "password": password
        })

    assert response.status_code == status.HTTP_200_OK


    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert "access_token" in data
    assert data["email"] == email
    assert data["role"] == "patient"  