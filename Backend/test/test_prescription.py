import sys
import os
import pytest
from httpx import AsyncClient, ASGITransport
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from main import app

@pytest.mark.asyncio
async def test_create_and_update_prescription():
    # Test data
    appointment_id = 384
    medicament_ids = [10, 11]  # appointment id exist and medicament ids exist 
    # 1. Create a new prescription
    create_payload = {
        "content": "Take medication twice daily after meals",
        "medicament_ids": medicament_ids
    } 
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        create_response = await client.post(f"/prescriptions/{appointment_id}", json=create_payload)
        assert create_response.status_code == 200
        create_data = create_response.json()
        assert create_data["content"] == create_payload["content"]
        assert create_data["appointment_id"] == appointment_id
        assert sorted(create_data["medicament_ids"]) == sorted(medicament_ids)
        prescription_id = create_data["id"]

        updated_medicament_ids = [10, 11]  
        update_payload = {
            "content": "Updated: Take medication three times daily with water",
            "medicament_ids": updated_medicament_ids
        }
        update_response = await client.post(f"/prescriptions/{appointment_id}", json=update_payload)

        assert update_response.status_code == 200
        update_data = update_response.json()
        assert update_data["id"] == prescription_id  # Same prescription ID
        assert update_data["content"] == update_payload["content"]  # Updated content
        assert update_data["appointment_id"] == appointment_id
        assert sorted(update_data["medicament_ids"]) == sorted(updated_medicament_ids)  # Updated medicaments

@pytest.mark.asyncio
async def test_create_prescription_invalid_medicaments():
    # Test with non-existent medicament IDs
    appointment_id = 384
    invalid_payload = {
        "content": "Test prescription",
        "medicament_ids": [999, 1000]  # IDs that don't exist
    }
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.post(f"/prescriptions/{appointment_id}", json=invalid_payload)
        assert response.status_code == 400
        assert "Some medicaments not found" in response.json()["detail"]

@pytest.mark.asyncio
async def test_create_prescription_nonexistent_appointment():
    # Test with a non-existent appointment ID
    non_existent_appointment_id = 9999
    payload = {
        "content": "Test prescription",
        "medicament_ids": [10, 11]
    }  
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.post(f"/prescriptions/{non_existent_appointment_id}", json=payload)
        assert response.status_code == 500
        assert "An error occurred" in response.json()["detail"]