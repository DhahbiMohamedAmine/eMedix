from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from models.prescription import Prescription
from models.patients import Patient as PatientModel
from models.medecins import Medecin
from database import get_db
from typing import List
from Dto.prescriptiondto import PrescriptionRequest, PrescriptionResponse, PrescriptionUpdate

router = APIRouter()

# Create prescription
@router.post("/addPrescription", response_model=PrescriptionResponse)
async def add_prescription(prescription: PrescriptionRequest, db: AsyncSession = Depends(get_db)):
    try:
        # Check if the patient exists
        patient_query = select(PatientModel).filter(PatientModel.id == prescription.patient_id)
        patient_result = await db.execute(patient_query)
        patient_record = patient_result.scalar_one_or_none()

        if not patient_record:
            raise HTTPException(status_code=404, detail="Patient not found")
        
        # Check if the patient exists
        medic_query = select(Medecin).filter(PatientModel.id == prescription.patient_id)
        medic_result = await db.execute(medic_query)
        medic_record = medic_result.scalar_one_or_none()

        if not medic_record:
            raise HTTPException(status_code=404, detail="doctor not found")

      

        
        # Create a new appointment with status "en attente"
        new_prescription = Prescription(
            patient_id=prescription.patient_id,
            medecin_id=prescription.medecin_id,
            date=prescription.date,
            content=prescription.content,
            medicament_id=prescription.medicament_id,
            dosage=prescription.dosage,
            duration=prescription.duration,
            
        )

        db.add(new_prescription)
        await db.commit()
        await db.refresh(new_prescription)

        return new_prescription

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating prescription: {e}")
    
# Get all prescriptions
@router.get("/all", response_model=List[PrescriptionResponse])
async def get_all_prescriptions(db: AsyncSession = Depends(get_db)):
    try:
        # Query the database to get all appointments
        prescription_query = select(Prescription)
        prescription_result = await db.execute(prescription_query)
        prescriptions = prescription_result.scalars().all()

        # If no appointments found, raise an exception
        if not prescriptions:
            raise HTTPException(status_code=404, detail="No prescriptions found")

        return prescriptions

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving prescriptions: {e}")

# Get prescription by ID
@router.get("/{prescription_id}", response_model=PrescriptionResponse)
async def get_prescription_by_id(prescription_id: int, db: AsyncSession = Depends(get_db)):
    try:
        query = select(Prescription).where(Prescription.id == prescription_id)
        result = await db.execute(query)
        prescription = result.scalar_one_or_none()

        if not prescription:
            raise HTTPException(status_code=404, detail="Prescription not found")

        return prescription

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving prescription: {e}")

# Update prescription
@router.put("/update/{prescription_id}", response_model=PrescriptionResponse)
async def update_prescription(prescription_id: int, updated_data: PrescriptionUpdate, db: AsyncSession = Depends(get_db)):
    try:
        query = select(Prescription).where(Prescription.id == prescription_id)
        result = await db.execute(query)
        prescription = result.scalar_one_or_none()

        if not prescription:
            raise HTTPException(status_code=404, detail="Prescription not found")

        # Update fields
        for field, value in updated_data.dict(exclude_unset=True).items():
            setattr(prescription, field, value)

        await db.commit()
        await db.refresh(prescription)

        return prescription

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating prescription: {e}")

# Delete prescription
@router.delete("/delete/{prescription_id}")
async def delete_prescription(prescription_id: int, db: AsyncSession = Depends(get_db)):
    try:
        query = select(Prescription).where(Prescription.id == prescription_id)
        result = await db.execute(query)
        prescription = result.scalar_one_or_none()

        if not prescription:
            raise HTTPException(status_code=404, detail="Prescription not found")

        await db.delete(prescription)
        await db.commit()

        return {"message": "Prescription deleted successfully"}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting prescription: {e}")

@router.get("/doctor/{medecin_id}", response_model=List[PrescriptionResponse])
async def get_prescriptions_by_medecin(medecin_id: int, db: AsyncSession = Depends(get_db)):
    try:
        query = select(Prescription).where(Prescription.medecin_id == medecin_id)
        result = await db.execute(query)
        prescriptions = result.scalars().all()

        if not prescriptions:
            raise HTTPException(status_code=404, detail="No prescriptions found for this doctor")

        return prescriptions

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving prescriptions: {e}")

@router.get("/patient/{patient_id}", response_model=List[PrescriptionResponse])
async def get_prescriptions_by_patient(patient_id: int, db: AsyncSession = Depends(get_db)):
    try:
        query = select(Prescription).where(Prescription.patient_id == patient_id)
        result = await db.execute(query)
        prescriptions = result.scalars().all()

        if not prescriptions:
            raise HTTPException(status_code=404, detail="No prescriptions found for this patient")

        return prescriptions

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving prescriptions: {e}")
