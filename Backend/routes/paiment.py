import os
from fastapi import APIRouter, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import stripe

router=APIRouter()
# Stripe secret key (get it from your dashboard)
stripe.api_key = os.getenv("stripe.api_key")

class PaymentRequest(BaseModel):
    amount: int  # amount in cents

@router.post("/createPayment")
async def create_payment_intent(payment: PaymentRequest):
    intent = stripe.PaymentIntent.create(
        amount=payment.amount,
        currency="usd",
        automatic_payment_methods={"enabled": True},
    )
    return {"clientSecret": intent.client_secret}


