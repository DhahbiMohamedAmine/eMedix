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

# POST - Add items to cart
@router.post("/add/{patient_id}", response_model=CartOut)
async def add_to_cart(patient_id: int, request: AddToCartRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Cart).where(Cart.patient_id == patient_id, Cart.is_paid == False)
    )
    cart = result.scalars().first()

    if not cart:
        cart = Cart(patient_id=patient_id, total_price=0.0, is_paid=False)
        db.add(cart)
        await db.flush()

    total_price = 0.0
    for item in request.items:
        medicament_result = await db.execute(select(Medicament).where(Medicament.id == item.medicament_id))
        medicament = medicament_result.scalar_one_or_none()

        if not medicament:
            raise HTTPException(status_code=404, detail=f"Medicament ID {item.medicament_id} not found")

        total_price += medicament.price * item.quantity

        stmt = insert(cart_medicament).values(
            cart_id=cart.id,
            medicament_id=medicament.id,
            quantity=item.quantity
        )
        await db.execute(stmt)

    cart.total_price += total_price
    await db.commit()

    result = await db.execute(
        select(Medicament).join(cart_medicament).where(cart_medicament.c.cart_id == cart.id)
    )
    medicaments = result.scalars().all()

    return CartOut(
        id=cart.id,
        patient_id=cart.patient_id,
        total_price=cart.total_price,
        medicaments=[MedicamentInCart(id=m.id, name=m.name, price=m.price) for m in medicaments],
        is_paid=cart.is_paid
    )

# GET - Fetch active cart
@router.get("/active/{patient_id}", response_model=CartOut)
async def get_active_cart(patient_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Cart).where(Cart.patient_id == patient_id, Cart.is_paid == False)
    )
    cart = result.scalars().first()

    if not cart:
        raise HTTPException(status_code=404, detail="No active cart found for this patient")

    result = await db.execute(
        select(Medicament).join(cart_medicament).where(cart_medicament.c.cart_id == cart.id)
    )
    medicaments = result.scalars().all()

    return CartOut(
        id=cart.id,
        patient_id=cart.patient_id,
        total_price=cart.total_price,
        medicaments=[MedicamentInCart(id=m.id, name=m.name, price=m.price) for m in medicaments],
        is_paid=cart.is_paid
    )

# GET - Fetch Cart by Cart ID
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
        medicaments=[MedicamentInCart(id=m.id, name=m.name, price=m.price) for m in medicaments],
        is_paid=cart.is_paid
    )

# PUT - Update Cart
@router.put("/update/{cart_id}", response_model=CartOut)
async def update_cart(cart_id: int, request: AddToCartRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Cart).where(Cart.id == cart_id))
    cart = result.scalars().first()

    if not cart:
        raise HTTPException(status_code=404, detail="Cart not found")

    if cart.is_paid:
        raise HTTPException(status_code=400, detail="Cannot update a paid cart")

    cart.total_price = 0.0
    await db.execute(delete(cart_medicament).where(cart_medicament.c.cart_id == cart_id))

    for item in request.items:
        medicament_result = await db.execute(select(Medicament).where(Medicament.id == item.medicament_id))
        medicament = medicament_result.scalar_one_or_none()

        if not medicament:
            raise HTTPException(status_code=404, detail=f"Medicament ID {item.medicament_id} not found")

        cart.total_price += medicament.price * item.quantity

        stmt = insert(cart_medicament).values(
            cart_id=cart.id,
            medicament_id=medicament.id,
            quantity=item.quantity
        )
        await db.execute(stmt)

    await db.commit()

    result = await db.execute(
        select(Medicament).join(cart_medicament).where(cart_medicament.c.cart_id == cart.id)
    )
    medicaments = result.scalars().all()

    return CartOut(
        id=cart.id,
        patient_id=cart.patient_id,
        total_price=cart.total_price,
        medicaments=[MedicamentInCart(id=m.id, name=m.name, price=m.price) for m in medicaments],
        is_paid=cart.is_paid
    )

# PUT - Mark cart as paid
@router.put("/mark-paid/{cart_id}", response_model=CartOut)
async def mark_cart_as_paid(cart_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Cart).where(Cart.id == cart_id))
    cart = result.scalars().first()

    if not cart:
        raise HTTPException(status_code=404, detail="Cart not found")

    if cart.is_paid:
        raise HTTPException(status_code=400, detail="Cart is already marked as paid")

    try:
        cart_items_result = await db.execute(
            select(cart_medicament.c.medicament_id, cart_medicament.c.quantity)
            .where(cart_medicament.c.cart_id == cart_id)
        )
        cart_items = cart_items_result.all()

        for item in cart_items:
            medicament_result = await db.execute(
                select(Medicament).where(Medicament.id == item.medicament_id)
            )
            medicament = medicament_result.scalar_one_or_none()

            if medicament and medicament.stock is not None:
                medicament.stock = max(0, medicament.stock - item.quantity)
                db.add(medicament)
    except Exception as stock_error:
        print(f"Error updating medicament stock: {stock_error}")

    cart.is_paid = True
    await db.commit()

    result = await db.execute(
        select(Medicament).join(cart_medicament).where(cart_medicament.c.cart_id == cart.id)
    )
    medicaments = result.scalars().all()

    return CartOut(
        id=cart.id,
        patient_id=cart.patient_id,
        total_price=cart.total_price,
        medicaments=[MedicamentInCart(id=m.id, name=m.name, price=m.price) for m in medicaments],
        is_paid=cart.is_paid
    )

# DELETE - Remove Cart
@router.delete("/deleteCart/{cart_id}", response_model=dict)
async def delete_cart(cart_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Cart).where(Cart.id == cart_id))
    cart = result.scalars().first()

    if not cart:
        raise HTTPException(status_code=404, detail="Cart not found")

    await db.execute(delete(cart_medicament).where(cart_medicament.c.cart_id == cart_id))
    await db.execute(delete(Cart).where(Cart.id == cart_id))
    await db.commit()

    return {"message": f"Cart with ID {cart_id} deleted successfully"}

# DELETE - Remove Item from Cart
@router.delete("/delete/{cart_id}/item/{medicament_id}", response_model=dict)
async def delete_cart_item(cart_id: int, medicament_id: int, db: AsyncSession = Depends(get_db)):
    stmt = select(cart_medicament).where(
        cart_medicament.c.cart_id == cart_id,
        cart_medicament.c.medicament_id == medicament_id
    )
    result = await db.execute(stmt)
    cart_item = result.first()

    if not cart_item:
        raise HTTPException(status_code=404, detail="Item not found in cart")

    cart_result = await db.execute(select(Cart).where(Cart.id == cart_id))
    cart = cart_result.scalar_one_or_none()

    if cart and cart.is_paid:
        raise HTTPException(status_code=400, detail="Cannot modify a paid cart")

    quantity = cart_item._mapping['quantity']

    medicament_result = await db.execute(select(Medicament).where(Medicament.id == medicament_id))
    medicament = medicament_result.scalar_one_or_none()

    if not medicament:
        raise HTTPException(status_code=404, detail="Medicament not found")

    item_total = medicament.price * quantity
    if cart:
        cart.total_price = max(cart.total_price - item_total, 0.0)

    await db.execute(
        delete(cart_medicament).where(
            cart_medicament.c.cart_id == cart_id,
            cart_medicament.c.medicament_id == medicament_id
        )
    )
    await db.commit()

    return {"message": f"Item with Medicament ID {medicament_id} removed from cart {cart_id}"}

# GET - Get cart items with quantities
@router.get("/{cart_id}/items")
async def get_cart_items(cart_id: int, db: AsyncSession = Depends(get_db)):
    cart_result = await db.execute(select(Cart).where(Cart.id == cart_id))
    cart = cart_result.scalar_one_or_none()

    if not cart:
        raise HTTPException(status_code=404, detail="Cart not found")

    query = select(cart_medicament.c.medicament_id, cart_medicament.c.quantity).where(cart_medicament.c.cart_id == cart_id)
    result = await db.execute(query)
    items = result.all()

    return [{"medicament_id": item.medicament_id, "quantity": item.quantity} for item in items]

# GET - Debug: Get cart payment status
@router.get("/{cart_id}/status")
async def get_cart_status(cart_id: int, db: AsyncSession = Depends(get_db)):
    cart_result = await db.execute(select(Cart).where(Cart.id == cart_id))
    cart = cart_result.scalar_one_or_none()

    if not cart:
        raise HTTPException(status_code=404, detail="Cart not found")

    return {
        "cart_id": cart.id,
        "patient_id": cart.patient_id,
        "total_price": cart.total_price,
        "is_paid": cart.is_paid
    }

# POST - Debug: Reset payment status
@router.post("/{cart_id}/reset-payment")
async def reset_cart_payment(cart_id: int, db: AsyncSession = Depends(get_db)):
    cart_result = await db.execute(select(Cart).where(Cart.id == cart_id))
    cart = cart_result.scalar_one_or_none()

    if not cart:
        raise HTTPException(status_code=404, detail="Cart not found")

    cart.is_paid = False
    await db.commit()

    return {
        "message": f"Cart {cart_id} payment status reset to unpaid",
        "cart_id": cart.id,
        "is_paid": cart.is_paid
    }
# POST - Add multiple items to cart at once
@router.post("/addMany", response_model=CartOut)
async def add_many_to_cart(request: dict, db: AsyncSession = Depends(get_db)):
    """
    Add multiple medications to a cart at once.
    
    Request format:
    {
        "patient_id": int,
        "items": [
            {"medicament_id": int, "quantity": int},
            {"medicament_id": int, "quantity": int},
            ...
        ]
    }
    """
    patient_id = request.get("patient_id")
    items = request.get("items", [])
    
    if not patient_id:
        raise HTTPException(status_code=400, detail="Patient ID is required")
    
    if not items:
        raise HTTPException(status_code=400, detail="No items provided")
    
    # Find or create an active cart for this patient
    result = await db.execute(
        select(Cart).where(Cart.patient_id == patient_id, Cart.is_paid == False)
    )
    cart = result.scalars().first()

    if not cart:
        cart = Cart(patient_id=patient_id, total_price=0.0, is_paid=False)
        db.add(cart)
        await db.flush()

    total_price = 0.0
    
    # Process each medication
    for item in items:
        medicament_id = item.get("medicament_id")
        quantity = item.get("quantity", 1)
        
        if not medicament_id:
            continue
            
        # Check if medication exists
        medicament_result = await db.execute(select(Medicament).where(Medicament.id == medicament_id))
        medicament = medicament_result.scalar_one_or_none()

        if not medicament:
            continue  # Skip items that don't exist

        # Check if item already exists in cart
        existing_item = await db.execute(
            select(cart_medicament).where(
                cart_medicament.c.cart_id == cart.id,
                cart_medicament.c.medicament_id == medicament_id
            )
        )
        existing = existing_item.first()
        
        if existing:
            # Update quantity if item already exists
            new_quantity = existing._mapping['quantity'] + quantity
            await db.execute(
                update(cart_medicament).where(
                    cart_medicament.c.cart_id == cart.id,
                    cart_medicament.c.medicament_id == medicament_id
                ).values(quantity=new_quantity)
            )
        else:
            # Add new item to cart
            stmt = insert(cart_medicament).values(
                cart_id=cart.id,
                medicament_id=medicament_id,
                quantity=quantity
            )
            await db.execute(stmt)

        # Update total price
        total_price += medicament.price * quantity

    # Update cart total price
    cart.total_price += total_price
    await db.commit()

    # Get updated medications in cart
    result = await db.execute(
        select(Medicament).join(cart_medicament).where(cart_medicament.c.cart_id == cart.id)
    )
    medicaments = result.scalars().all()

    return CartOut(
        id=cart.id,
        patient_id=cart.patient_id,
        total_price=cart.total_price,
        medicaments=[MedicamentInCart(id=m.id, name=m.name, price=m.price) for m in medicaments],
        is_paid=cart.is_paid
    )