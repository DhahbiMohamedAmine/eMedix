from typing import List
from sqlalchemy import insert, delete
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from Dto.prescriptiondto import PrescriptionCreate, PrescriptionOut, PrescriptionUpdate
from models.prescription import Prescription
from models.medicaments import Medicament
from models.prescription_medicament import prescription_medicament
from database import get_db

router = APIRouter()

@router.post("/{appointment_id}", response_model=PrescriptionOut)
async def create_or_update_prescription(
    appointment_id: int, 
    prescription_data: PrescriptionCreate,
    db: AsyncSession = Depends(get_db)
):
    # First, validate medicament IDs before any database operations
    # This will catch invalid IDs early and return a 400 error
    if not prescription_data.medicament_ids:
        raise HTTPException(status_code=400, detail="No medicaments provided")
    
    try:
        # Check if the prescription already exists for the appointment
        result = await db.execute(select(Prescription).filter(Prescription.appointment_id == appointment_id))
        existing_prescription = result.scalars().first()
        
        # Query for medicaments one by one to identify which ones don't exist
        found_medicaments = []
        missing_ids = []
        
        for med_id in prescription_data.medicament_ids:
            try:
                med_result = await db.execute(select(Medicament).filter(Medicament.id == med_id))
                medicament = med_result.scalars().first()
                if medicament:
                    found_medicaments.append(medicament)
                else:
                    missing_ids.append(med_id)
            except Exception:
                missing_ids.append(med_id)
        
        # If any medicaments are missing, return a 400 error
        if missing_ids:
            raise HTTPException(
                status_code=400, 
                detail=f"Medicaments not found: {', '.join(map(str, missing_ids))}"
            )
        
        if existing_prescription:
            # If a prescription exists, update it
            existing_prescription.content = prescription_data.content
            
            # Clear existing medicaments and add new ones using the association table
            await db.execute(
                delete(prescription_medicament).where(
                    prescription_medicament.c.prescription_id == existing_prescription.id
                )
            )
            
            # Add new associations
            for medicament in found_medicaments:
                await db.execute(
                    insert(prescription_medicament).values(
                        prescription_id=existing_prescription.id,
                        medicament_id=medicament.id
                    )
                )
                
            await db.commit()
            
            # Get updated medicament IDs
            med_result = await db.execute(
                select(Medicament.id)
                .join(prescription_medicament)
                .where(prescription_medicament.c.prescription_id == existing_prescription.id)
            )
            medicament_ids = [id for id, in med_result.all()]
            
            return PrescriptionOut(
                id=existing_prescription.id,
                content=existing_prescription.content,
                appointment_id=existing_prescription.appointment_id,
                medicament_ids=medicament_ids
            )
        else:
            # If no existing prescription, create a new one
            new_prescription = Prescription(
                appointment_id=appointment_id,
                content=prescription_data.content,
            )
            db.add(new_prescription)
            await db.commit()
            await db.refresh(new_prescription)
            
            # Add medicaments using the association table
            for medicament in found_medicaments:
                await db.execute(
                    insert(prescription_medicament).values(
                        prescription_id=new_prescription.id,
                        medicament_id=medicament.id
                    )
                )
            
            await db.commit()
            
            return PrescriptionOut(
                id=new_prescription.id,
                content=new_prescription.content,
                appointment_id=new_prescription.appointment_id,
                medicament_ids=[m.id for m in found_medicaments]
            )
    except HTTPException:
        # Re-raise HTTP exceptions to preserve their status codes
        raise
    except Exception as e:
        # For debugging, print the actual error
        print(f"ERROR: {str(e)}")
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")
# Get all prescriptions
@router.get("/", response_model=List[PrescriptionOut])
async def get_all_prescriptions(db: AsyncSession = Depends(get_db)):
    try:
        # Get all prescriptions
        result = await db.execute(select(Prescription))
        prescriptions = result.scalars().all()
        
        # Prepare the response
        prescription_list = []
        for prescription in prescriptions:
            # Get medicament IDs for this prescription
            med_result = await db.execute(
                select(Medicament.id)
                .join(prescription_medicament)
                .where(prescription_medicament.c.prescription_id == prescription.id)
            )
            medicament_ids = [id for id, in med_result.all()]
            
            # Add to response list
            prescription_list.append(
                PrescriptionOut(
                    id=prescription.id,
                    content=prescription.content,
                    appointment_id=prescription.appointment_id,
                    medicament_ids=medicament_ids
                )
            )
        
        return prescription_list
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")

# Get prescription by ID
@router.get("/{appointment_id}", response_model=PrescriptionOut)
async def get_prescription_by_appointment_id(appointment_id: int, db: AsyncSession = Depends(get_db)):
    try:
        # Get prescription by appointment_id
        result = await db.execute(
            select(Prescription).filter(Prescription.appointment_id == appointment_id)
        )
        prescription = result.scalar_one_or_none()
        
        if not prescription:
            raise HTTPException(status_code=404, detail="Prescription not found for this appointment")
        
        # Get medicament IDs for this prescription
        med_result = await db.execute(
            select(Medicament.id)
            .join(prescription_medicament)
            .where(prescription_medicament.c.prescription_id == prescription.id)
        )
        medicament_ids = [id for id, in med_result.all()]
        
        # Return the prescription
        return PrescriptionOut(
            id=prescription.id,
            content=prescription.content,
            appointment_id=prescription.appointment_id,
            medicament_ids=medicament_ids
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")


# Delete prescription
@router.delete("/{id}")
async def delete_prescription(id: int, db: AsyncSession = Depends(get_db)):
    query = select(Prescription).filter(Prescription.id == id)
    result = await db.execute(query)
    prescription = result.scalar_one_or_none()

    if not prescription:
        raise HTTPException(status_code=404, detail="Prescription not found")

    await db.delete(prescription)
    await db.commit()
    return {"detail": "Prescription deleted"}
