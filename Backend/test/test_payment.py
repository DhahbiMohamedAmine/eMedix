import sys
import os
from unittest.mock import patch, MagicMock

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import pytest
from httpx import ASGITransport, AsyncClient
from fastapi import status
from main import app

@pytest.mark.asyncio
async def test_create_payment_intent_success():
    with patch('stripe.PaymentIntent.create') as mock_stripe_create:
        mock_intent = MagicMock()
        mock_intent.client_secret = "pi_test_1234567890_secret_abcdef"
        mock_stripe_create.return_value = mock_intent    
        payment_data = {"amount": 2000}  
        async with AsyncClient(
            transport=ASGITransport(app=app),
            base_url="http://test"
        ) as ac:
            response = await ac.post("/payment/createPayment", json=payment_data)
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "clientSecret" in data
        assert data["clientSecret"] == "pi_test_1234567890_secret_abcdef"
        mock_stripe_create.assert_called_once_with(
            amount=2000,
            currency="usd",
            automatic_payment_methods={"enabled": True}
        )

@pytest.mark.asyncio
async def test_create_payment_intent_missing_amount():
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test"
    ) as ac:
        response = await ac.post("/payment/createPayment", json={})
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
    data = response.json()
    assert "detail" in data

@pytest.mark.asyncio
async def test_create_payment_intent_invalid_amount_type():
    payment_data = {"amount": "invalid"}
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test"
    ) as ac:
        response = await ac.post("/payment/createPayment", json=payment_data)
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

@pytest.mark.asyncio
async def test_create_payment_intent_large_amount():
    with patch('stripe.PaymentIntent.create') as mock_stripe_create:
        mock_intent = MagicMock()
        mock_intent.client_secret = "pi_test_large_amount_secret"
        mock_stripe_create.return_value = mock_intent
        payment_data = {"amount": 100000}  
        async with AsyncClient(
            transport=ASGITransport(app=app),
            base_url="http://test"
        ) as ac:
            response = await ac.post("/payment/createPayment", json=payment_data) 
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "clientSecret" in data
        assert data["clientSecret"] == "pi_test_large_amount_secret"