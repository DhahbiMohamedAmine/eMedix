from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
<<<<<<< HEAD
from sqlalchemy import insert, update, delete, Boolean
=======
from sqlalchemy import insert, update, delete
>>>>>>> 0274cc52ef154bb84005a7696dceebc6730baa57
from typing import List

from database import get_db
from models.Carts import Cart
from models.medicaments import Medicament
from models.carte_items import cart_medicament
<<<<<<< HEAD
from Dto.carte import AddToCartRequest, CartOut, MedicamentInCart, MedicamentItem

router = APIRouter()

# POST - Add items to cart (Modified to handle paid/unpaid carts)
@router.post("/add/{patient_id}", response_model=CartOut)
async def add_to_cart(patient_id: int, request: AddToCartRequest, db: AsyncSession = Depends(get_db)):
    # Check if an unpaid cart already exists for this patient
    result = await db.execute(
        select(Cart).where(
            Cart.patient_id == patient_id,
            Cart.is_paid == False
        )
    )
    cart = result.scalars().first()

    if not cart:
        # Create a new cart if no unpaid cart exists
        cart = Cart(patient_id=patient_id, total_price=0.0, is_paid=False)
=======
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
>>>>>>> 0274cc52ef154bb84005a7696dceebc6730baa57
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
<<<<<<< HEAD
        ],
        is_paid=cart.is_paid
    )

# GET - Fetch Cart by Patient ID (get active cart)
@router.get("/active/{patient_id}", response_model=CartOut)
async def get_active_cart(patient_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Cart).where(
            Cart.patient_id == patient_id,
            Cart.is_paid == False
        )
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
        medicaments=[
            MedicamentInCart(id=m.id, name=m.name, price=m.price) for m in medicaments
        ],
        is_paid=cart.is_paid
    )

# GET - Fetch Cart by Cart ID
=======
        ]
    )

# GET - Fetch Cart by Patient ID
>>>>>>> 0274cc52ef154bb84005a7696dceebc6730baa57
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
<<<<<<< HEAD
        ],
        is_paid=cart.is_paid
=======
        ]
>>>>>>> 0274cc52ef154bb84005a7696dceebc6730baa57
    )

# PUT - Update Cart (for example, updating quantity of items)
@router.put("/update/{cart_id}", response_model=CartOut)
async def update_cart(cart_id: int, request: AddToCartRequest, db: AsyncSession = Depends(get_db)):
    # Check if cart exists
    result = await db.execute(select(Cart).where(Cart.id == cart_id))
    cart = result.scalars().first()

    if not cart:
        raise HTTPException(status_code=404, detail="Cart not found")
<<<<<<< HEAD
        
    if cart.is_paid:
        raise HTTPException(status_code=400, detail="Cannot update a paid cart")
=======
>>>>>>> 0274cc52ef154bb84005a7696dceebc6730baa57

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
<<<<<<< HEAD
        ],
        is_paid=cart.is_paid
    )

# Mark cart as paid
@router.put("/mark-paid/{cart_id}", response_model=CartOut)
async def mark_cart_as_paid(cart_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Cart).where(Cart.id == cart_id))
    cart = result.scalars().first()

    if not cart:
        raise HTTPException(status_code=404, detail="Cart not found")
        
    if cart.is_paid:
        raise HTTPException(status_code=400, detail="Cart is already marked as paid")
    
    # Update medicament stock based on cart items
    try:
        # Get all items in the cart with their quantities
        cart_items_result = await db.execute(
            select(cart_medicament.c.medicament_id, cart_medicament.c.quantity)
            .where(cart_medicament.c.cart_id == cart_id)
        )
        cart_items = cart_items_result.all()
        
        # Update stock for each medicament
        for item in cart_items:
            medicament_id = item.medicament_id
            quantity = item.quantity
            
            # Get the medicament
            medicament_result = await db.execute(
                select(Medicament).where(Medicament.id == medicament_id)
            )
            medicament = medicament_result.scalar_one_or_none()
            
            if medicament and medicament.stock is not None:
                # Decrease the stock
                medicament.stock = max(0, medicament.stock - quantity)
                db.add(medicament)
    except Exception as stock_error:
        print(f"Error updating medicament stock: {stock_error}")
        # Continue with marking cart as paid even if stock update fails
        
    cart.is_paid = True
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
        ],
        is_paid=cart.is_paid
=======
        ]
>>>>>>> 0274cc52ef154bb84005a7696dceebc6730baa57
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
<<<<<<< HEAD

=======
>>>>>>> 0274cc52ef154bb84005a7696dceebc6730baa57
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
<<<<<<< HEAD
        
    # Check if cart is paid
    cart_result = await db.execute(select(Cart).where(Cart.id == cart_id))
    cart = cart_result.scalar_one_or_none()
    if cart and cart.is_paid:
        raise HTTPException(status_code=400, detail="Cannot modify a paid cart")
=======
>>>>>>> 0274cc52ef154bb84005a7696dceebc6730baa57

    # Properly access quantity from the result mapping
    quantity = cart_item._mapping['quantity']

    # Fetch medicament to calculate total deduction
    medicament_result = await db.execute(select(Medicament).where(Medicament.id == medicament_id))
    medicament = medicament_result.scalar_one_or_none()
    if not medicament:
        raise HTTPException(status_code=404, detail="Medicament not found")

    item_total = medicament.price * quantity

    # Update cart total price
<<<<<<< HEAD
=======
    cart_result = await db.execute(select(Cart).where(Cart.id == cart_id))
    cart = cart_result.scalar_one_or_none()
>>>>>>> 0274cc52ef154bb84005a7696dceebc6730baa57
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
<<<<<<< HEAD

# Add this endpoint to get cart items with quantities
@router.get("/{cart_id}/items")
async def get_cart_items(cart_id: int, db: AsyncSession = Depends(get_db)):
    try:
        # Check if cart exists
        cart_result = await db.execute(select(Cart).where(Cart.id == cart_id))
        cart = cart_result.scalar_one_or_none()
        
        if not cart:
            raise HTTPException(status_code=404, detail="Cart not found")
        
        # Get cart items with quantities
        query = select(
            cart_medicament.c.medicament_id,
            cart_medicament.c.quantity
        ).where(cart_medicament.c.cart_id == cart_id)
        
        result = await db.execute(query)
        items = result.all()
        
        # Convert to list of dictionaries
        return [{"medicament_id": item.medicament_id, "quantity": item.quantity} for item in items]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Add a debug endpoint to check cart payment status
@router.get("/{cart_id}/status")
async def get_cart_status(cart_id: int, db: AsyncSession = Depends(get_db)):
    try:
        # Check if cart exists
        cart_result = await db.execute(select(Cart).where(Cart.id == cart_id))
        cart = cart_result.scalar_one_or_none()
        
        if not cart:
            raise HTTPException(status_code=404, detail="Cart not found")
        
        # Return cart status
        return {
            "cart_id": cart.id,
            "patient_id": cart.patient_id,
            "total_price": cart.total_price,
            "is_paid": cart.is_paid
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Add an endpoint to reset cart payment status (for debugging)
@router.post("/{cart_id}/reset-payment")
async def reset_cart_payment(cart_id: int, db: AsyncSession = Depends(get_db)):
    try:
        # Check if cart exists
        cart_result = await db.execute(select(Cart).where(Cart.id == cart_id))
        cart = cart_result.scalar_one_or_none()
        
        if not cart:
            raise HTTPException(status_code=404, detail="Cart not found")
        
        # Reset payment status
        cart.is_paid = False
        await db.commit()
        
        return {
            "message": f"Cart {cart_id} payment status reset to unpaid",
            "cart_id": cart.id,
            "is_paid": cart.is_paid
        }
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
=======
>>>>>>> 0274cc52ef154bb84005a7696dceebc6730baa57
