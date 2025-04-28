from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from models.billing import Billing
from database import get_db
from Dto.billingdto import BillingCreate, BillingUpdate, BillingOut  # You'll need these Pydantic schemas
from typing import List
from datetime import timezone
router = APIRouter()

# Create Billing


@router.post("/add", response_model=BillingOut)
async def create_billing(billing: BillingCreate, db: AsyncSession = Depends(get_db)):
    try:
        naive_date = billing.date
        if billing.date.tzinfo is not None:
            naive_date = billing.date.astimezone(timezone.utc).replace(tzinfo=None)

        db_billing = Billing(
            order_id=billing.order_id,
            amount=billing.amount,
            payment_method=billing.payment_method,
            date=naive_date,
        )
        db.add(db_billing)
        await db.commit()
        await db.refresh(db_billing)
        return db_billing
    except Exception as e:
        await db.rollback()
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
    
    billing.order_id = billing_update.order_id
    billing.amount = billing_update.amount
    billing.payment_method = billing_update.payment_method
    billing.date = billing_update.date

    await db.commit()
    await db.refresh(billing)
    return billing

# Delete Billing
@router.delete("/delete/{billing_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_billing(billing_id: int, db: AsyncSession = Depends(get_db)):
    billing = await db.get(Billing, billing_id)
    if not billing:
        raise HTTPException(status_code=404, detail="Billing record not found")
    
    await db.delete(billing)
    await db.commit()
    return
