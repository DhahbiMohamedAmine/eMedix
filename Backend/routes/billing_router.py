from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from models.billing import Billing
from models.Carts import Cart
from database import get_db
from Dto.billingdto import BillingCreate, BillingUpdate, BillingOut
from typing import List
from datetime import timezone
from models.medicaments import Medicament
from models.carte_items import cart_medicament

router = APIRouter()


@router.post("/add", response_model=BillingOut)
async def create_billing(billing: BillingCreate, db: AsyncSession = Depends(get_db)):
    try:
        naive_date = billing.date
        if billing.date.tzinfo is not None:
            naive_date = billing.date.astimezone(timezone.utc).replace(tzinfo=None)

        # Check if cart exists and is not already paid
        if billing.cart_id:
            cart_result = await db.execute(select(Cart).where(Cart.id == billing.cart_id))
            cart = cart_result.scalar_one_or_none()
            
            if not cart:
                raise HTTPException(status_code=404, detail=f"Cart with ID {billing.cart_id} not found")
                
            if cart.is_paid:
                # Log more details about the cart
                print(f"Cart {billing.cart_id} is already marked as paid. Patient ID: {cart.patient_id}, Total: {cart.total_price}")
                
                # Check if there's already a billing record for this cart
                billing_result = await db.execute(
                    select(Billing).where(Billing.cart_id == billing.cart_id)
                )
                existing_billing = billing_result.scalar_one_or_none()
                
                if existing_billing:
                    print(f"Existing billing found: ID {existing_billing.id}, Order ID: {existing_billing.order_id}")
                    raise HTTPException(
                        status_code=400, 
                        detail=f"Cart is already paid. Billing record exists with ID {existing_billing.id}"
                    )
                else:
                    raise HTTPException(status_code=400, detail="Cart is already paid but no billing record found")
                
            # Mark the cart as paid
            cart.is_paid = True
            print(f"Marking cart {billing.cart_id} as paid")
            
            # Update medicament stock based on cart items
            try:
                # Get all items in the cart with their quantities
                cart_items_result = await db.execute(
                    select(cart_medicament.c.medicament_id, cart_medicament.c.quantity)
                    .where(cart_medicament.c.cart_id == billing.cart_id)
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
                        print(f"Updated stock for medicament {medicament_id}: new stock = {medicament.stock}")
                
                # Commit the stock updates
                await db.flush()
            except Exception as stock_error:
                print(f"Error updating medicament stock: {stock_error}")
                # Continue with billing creation even if stock update fails
                # We don't want to prevent the billing from being created if stock update fails

        db_billing = Billing(
            order_id=billing.order_id,
            amount=billing.amount,
            payment_method=billing.payment_method,
            date=naive_date,
            cart_id=billing.cart_id
        )
        db.add(db_billing)
        await db.commit()
        await db.refresh(db_billing)
        return db_billing
    except HTTPException as e:
        await db.rollback()
        raise e
    except Exception as e:
        await db.rollback()
        print(f"Error in create_billing: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# Add an endpoint to get billings by cart ID
@router.get("/by-cart/{cart_id}", response_model=List[BillingOut])
async def get_billings_by_cart(cart_id: int, db: AsyncSession = Depends(get_db)):
    try:
        result = await db.execute(
            select(Billing).where(Billing.cart_id == cart_id)
        )
        billings = result.scalars().all()
        return billings
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Get All Billings
@router.get("/all", response_model=List[BillingOut])
async def get_all_billings(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Billing))
    billings = result.scalars().all()
    return billings


# Get Billing by ID
@router.get("/{billing_id}", response_model=BillingOut)
async def get_billing_by_id(billing_id: int, db: AsyncSession = Depends(get_db)):
    billing = await db.get(Billing, billing_id)
    if not billing:
        raise HTTPException(status_code=404, detail="Billing record not found")
    return billing


# Update Billing
@router.put("/update/{billing_id}", response_model=BillingOut)
async def update_billing(billing_id: int, billing_update: BillingUpdate, db: AsyncSession = Depends(get_db)):
    billing = await db.get(Billing, billing_id)
    if not billing:
        raise HTTPException(status_code=404, detail="Billing record not found")

    naive_date = billing_update.date
    if billing_update.date.tzinfo is not None:
        naive_date = billing_update.date.astimezone(timezone.utc).replace(tzinfo=None)

    # If cart_id is changing, handle the cart status changes
    if billing.cart_id != billing_update.cart_id:
        # If there was a previous cart, check if we need to revert its paid status
        if billing.cart_id:
            old_cart_result = await db.execute(select(Cart).where(Cart.id == billing.cart_id))
            old_cart = old_cart_result.scalar_one_or_none()
            if old_cart:
                old_cart.is_paid = False
        
        # If there's a new cart, mark it as paid
        if billing_update.cart_id:
            new_cart_result = await db.execute(select(Cart).where(Cart.id == billing_update.cart_id))
            new_cart = new_cart_result.scalar_one_or_none()
            if new_cart:
                if new_cart.is_paid:
                    raise HTTPException(status_code=400, detail="New cart is already paid")
                new_cart.is_paid = True

    billing.order_id = billing_update.order_id
    billing.amount = billing_update.amount
    billing.payment_method = billing_update.payment_method
    billing.date = naive_date
    billing.cart_id = billing_update.cart_id

    await db.commit()
    await db.refresh(billing)
    return billing


# Delete Billing
@router.delete("/delete/{billing_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_billing(billing_id: int, db: AsyncSession = Depends(get_db)):
    billing = await db.get(Billing, billing_id)
    if not billing:
        raise HTTPException(status_code=404, detail="Billing record not found")
    
    # If there's an associated cart, revert its paid status
    if billing.cart_id:
        cart_result = await db.execute(select(Cart).where(Cart.id == billing.cart_id))
        cart = cart_result.scalar_one_or_none()
        if cart:
            cart.is_paid = False

    await db.delete(billing)
    await db.commit()
