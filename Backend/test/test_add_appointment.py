import sys
import os
import pytest
from httpx import AsyncClient, ASGITransport
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from main import app

@pytest.mark.asyncio
async def test_add_appointment_existing_ids():
    patient_id = 16
    medecin_id = 3

    payload = {
        "patient_id": patient_id,
        "date": "2025-05-06T12:00:00"
    }
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.post(f"/appointments/addappointment/{medecin_id}", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["patient_id"] == patient_id
    assert data["medecin_id"] == medecin_id
    assert data["status"] == "waiting for medecin confirmation"
