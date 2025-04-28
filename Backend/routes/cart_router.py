# routers/cart_router.py
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from database import get_db
from models.medicaments import Medicament
from pydantic import BaseModel
from typing import List

router = APIRouter()

# In-memory cart (later can be per user)
cart = []

class CartItem(BaseModel):
    medicament_id: int
    quantity: int = 1

class CartResponse(BaseModel):
    medicament_id: int
    name: str
    description: str | None
    dosage: str | None
    price: float
    quantity: int

@router.post("/add", response_model=dict)
async def add_to_cart(item: CartItem, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Medicament).where(Medicament.id == item.medicament_id))
    medicament = result.scalar_one_or_none()
    if not medicament:
        raise HTTPException(status_code=404, detail="Medicament not found")
    
    # Check if already in cart
    for entry in cart:
        if entry["medicament"]["id"] == medicament.id:
            entry["quantity"] += item.quantity
            return {"message": "Quantity updated"}

    cart.append({
        "medicament": {
            "id": medicament.id,
            "name": medicament.name,
            "description": medicament.description,
            "dosage": medicament.dosage,
            "price": medicament.price,
        },
        "quantity": item.quantity
    })
    return {"message": "Medicament added to cart"}

@router.get("/", response_model=List[CartResponse])
async def get_cart():
    return [
        CartResponse(
            medicament_id=item["medicament"]["id"],
            name=item["medicament"]["name"],
            description=item["medicament"]["description"],
            dosage=item["medicament"]["dosage"],
            price=item["medicament"]["price"],
            quantity=item["quantity"]
        )
        for item in cart
    ]

@router.post("/remove", response_model=dict)
async def remove_from_cart(item: CartItem):
    for i, entry in enumerate(cart):
        if entry["medicament"]["id"] == item.medicament_id:
            cart.pop(i)
            return {"message": "Medicament removed from cart"}
    raise HTTPException(status_code=404, detail="Medicament not in cart")

@router.post("/update", response_model=dict)
async def update_cart_quantity(item: CartItem):
    for entry in cart:
        if entry["medicament"]["id"] == item.medicament_id:
            if item.quantity <= 0:
                cart.remove(entry)
                return {"message": "Medicament removed from cart due to quantity 0"}
            entry["quantity"] = item.quantity
            return {"message": "Quantity updated"}
    raise HTTPException(status_code=404, detail="Medicament not found in cart")
