from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import insert, update, delete
from typing import List

from database import get_db
from models.Carts import Cart
from models.medicaments import Medicament
from models.carte_items import cart_medicament
from Dto.carte import AddToCartRequest, CartOut, MedicamentInCart

router = APIRouter()

# POST - Add items to cart (This is the one you've already implemented)
@router.post("/add/{patient_id}", response_model=CartOut)
async def add_to_cart(patient_id: int, request: AddToCartRequest, db: AsyncSession = Depends(get_db)):
    # Check if a cart already exists for this patient
    result = await db.execute(select(Cart).where(Cart.patient_id == patient_id))
    cart = result.scalars().first()

    if not cart:
        cart = Cart(patient_id=patient_id, total_price=0.0)
        db.add(cart)
        await db.flush()  # ensures cart.id is generated

    total_price = 0.0
    for item in request.items:
        # Check if medicament exists
        medicament_result = await db.execute(select(Medicament).where(Medicament.id == item.medicament_id))
        medicament = medicament_result.scalar_one_or_none()

        if not medicament:
            raise HTTPException(status_code=404, detail=f"Medicament ID {item.medicament_id} not found")

        total_price += medicament.price * item.quantity

        # Insert into cart_items with quantity
        stmt = insert(cart_medicament).values(
            cart_id=cart.id,
            medicament_id=medicament.id,
            quantity=item.quantity
        )
        await db.execute(stmt)

    cart.total_price += total_price
    await db.commit()

    # Fetch medicaments for response
    result = await db.execute(
        select(Medicament).join(cart_medicament).where(cart_medicament.c.cart_id == cart.id)
    )
    medicaments = result.scalars().all()

    return CartOut(
        id=cart.id,
        patient_id=cart.patient_id,
        total_price=cart.total_price,
        medicaments=[
            MedicamentInCart(id=m.id, name=m.name, price=m.price) for m in medicaments
        ]
    )

# GET - Fetch Cart by Patient ID
@router.get("/{cart_id}", response_model=CartOut)
async def get_cart(cart_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Cart).where(Cart.id == cart_id))
    cart = result.scalars().first()

    if not cart:
        raise HTTPException(status_code=404, detail="Cart not found")

    result = await db.execute(
        select(Medicament).join(cart_medicament).where(cart_medicament.c.cart_id == cart.id)
    )
    medicaments = result.scalars().all()

    return CartOut(
        id=cart.id,
        patient_id=cart.patient_id,
        total_price=cart.total_price,
        medicaments=[
            MedicamentInCart(id=m.id, name=m.name, price=m.price) for m in medicaments
        ]
    )

# PUT - Update Cart (for example, updating quantity of items)
@router.put("/update/{cart_id}", response_model=CartOut)
async def update_cart(cart_id: int, request: AddToCartRequest, db: AsyncSession = Depends(get_db)):
    # Check if cart exists
    result = await db.execute(select(Cart).where(Cart.id == cart_id))
    cart = result.scalars().first()

    if not cart:
        raise HTTPException(status_code=404, detail="Cart not found")

    # Recalculate total price and update cart items
    cart.total_price = 0.0
    await db.execute(delete(cart_medicament).where(cart_medicament.c.cart_id == cart_id))  # Remove all old items

    for item in request.items:
        medicament_result = await db.execute(select(Medicament).where(Medicament.id == item.medicament_id))
        medicament = medicament_result.scalar_one_or_none()

        if not medicament:
            raise HTTPException(status_code=404, detail=f"Medicament ID {item.medicament_id} not found")

        cart.total_price += medicament.price * item.quantity

        # Re-insert new items into cart_items
        stmt = insert(cart_medicament).values(
            cart_id=cart.id,
            medicament_id=medicament.id,
            quantity=item.quantity
        )
        await db.execute(stmt)

    await db.commit()

    # Fetch medicaments for response
    result = await db.execute(
        select(Medicament).join(cart_medicament).where(cart_medicament.c.cart_id == cart.id)
    )
    medicaments = result.scalars().all()

    return CartOut(
        id=cart.id,
        patient_id=cart.patient_id,
        total_price=cart.total_price,
        medicaments=[
            MedicamentInCart(id=m.id, name=m.name, price=m.price) for m in medicaments
        ]
    )

# DELETE - Remove Cart by Cart ID
@router.delete("/deleteCart/{cart_id}", response_model=dict)
async def delete_cart(cart_id: int, db: AsyncSession = Depends(get_db)):
    # Check if cart exists
    result = await db.execute(select(Cart).where(Cart.id == cart_id))
    cart = result.scalars().first()

    if not cart:
        raise HTTPException(status_code=404, detail="Cart not found")

    # Delete cart items first
    await db.execute(delete(cart_medicament).where(cart_medicament.c.cart_id == cart_id))
    
    # Then delete the cart
    await db.execute(delete(Cart).where(Cart.id == cart_id))
    await db.commit()

    return {"message": f"Cart with ID {cart_id} deleted successfully"}
@router.delete("/delete/{cart_id}/item/{medicament_id}", response_model=dict)
async def delete_cart_item(cart_id: int, medicament_id: int, db: AsyncSession = Depends(get_db)):
    # Check if the item exists in the cart
    stmt = select(cart_medicament).where(
        cart_medicament.c.cart_id == cart_id,
        cart_medicament.c.medicament_id == medicament_id
    )
    result = await db.execute(stmt)
    cart_item = result.first()

    if not cart_item:
        raise HTTPException(status_code=404, detail="Item not found in cart")

    # Properly access quantity from the result mapping
    quantity = cart_item._mapping['quantity']

    # Fetch medicament to calculate total deduction
    medicament_result = await db.execute(select(Medicament).where(Medicament.id == medicament_id))
    medicament = medicament_result.scalar_one_or_none()
    if not medicament:
        raise HTTPException(status_code=404, detail="Medicament not found")

    item_total = medicament.price * quantity

    # Update cart total price
    cart_result = await db.execute(select(Cart).where(Cart.id == cart_id))
    cart = cart_result.scalar_one_or_none()
    if cart:
        cart.total_price = max(cart.total_price - item_total, 0.0)

    # Delete the item from the cart
    await db.execute(
        delete(cart_medicament).where(
            cart_medicament.c.cart_id == cart_id,
            cart_medicament.c.medicament_id == medicament_id
        )
    )
    await db.commit()

    return {"message": f"Item with Medicament ID {medicament_id} removed from cart {cart_id}"}
