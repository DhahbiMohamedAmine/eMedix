from typing import List
from sqlalchemy import insert, delete, select
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from Dto.prescriptiondto import PrescriptionCreate, PrescriptionOut, PrescriptionUpdate, MedicamentItem
from models.prescription import Prescription
from models.medicaments import Medicament
from models.prescription_medicament import prescription_medicament
from database import get_db

router = APIRouter()

# Create or update prescription for an appointment
@router.post("/{appointment_id}", response_model=PrescriptionOut)
async def create_or_update_prescription(
    appointment_id: int,
    prescription_data: PrescriptionCreate,
    db: AsyncSession = Depends(get_db)
):
    try:
        medicament_ids = [m.id for m in prescription_data.medicaments]

        result = await db.execute(select(Prescription).filter(Prescription.appointment_id == appointment_id))
        existing_prescription = result.scalars().first()

        medicament_result = await db.execute(select(Medicament).filter(Medicament.id.in_(medicament_ids)))
        medicaments = medicament_result.scalars().all()

        if len(medicaments) != len(medicament_ids):
            raise HTTPException(status_code=400, detail="Some medicaments not found")

        if existing_prescription:
            existing_prescription.content = prescription_data.content

            await db.execute(
                delete(prescription_medicament).where(
                    prescription_medicament.c.prescription_id == existing_prescription.id
                )
            )

            for m in prescription_data.medicaments:
                await db.execute(
                    insert(prescription_medicament).values(
                        prescription_id=existing_prescription.id,
                        medicament_id=m.id,
                        duration=m.duration,
                        dosage=m.dosage
                    )
                )

            await db.commit()

            return PrescriptionOut(
                id=existing_prescription.id,
                content=existing_prescription.content,
                appointment_id=existing_prescription.appointment_id,
                medicaments=prescription_data.medicaments
            )

        else:
            new_prescription = Prescription(
                appointment_id=appointment_id,
                content=prescription_data.content,
            )
            db.add(new_prescription)
            await db.commit()
            await db.refresh(new_prescription)

            for m in prescription_data.medicaments:
                await db.execute(
                    insert(prescription_medicament).values(
                        prescription_id=new_prescription.id,
                        medicament_id=m.id,
                        duration=m.duration,
                        dosage=m.dosage
                    )
                )

            await db.commit()

            return PrescriptionOut(
                id=new_prescription.id,
                content=new_prescription.content,
                appointment_id=new_prescription.appointment_id,
                medicaments=prescription_data.medicaments
            )
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")

# Get all prescriptions
@router.get("/", response_model=List[PrescriptionOut])
async def get_all_prescriptions(db: AsyncSession = Depends(get_db)):
    try:
        result = await db.execute(select(Prescription))
        prescriptions = result.scalars().all()
        prescription_list = []

        for prescription in prescriptions:
            join_query = select(
                prescription_medicament.c.medicament_id,
                prescription_medicament.c.duration,
                prescription_medicament.c.dosage
            ).where(prescription_medicament.c.prescription_id == prescription.id)
            meds_result = await db.execute(join_query)
            medicaments = [
                MedicamentItem(id=mid, duration=duration, dosage=dosage)
                for mid, duration, dosage in meds_result.fetchall()
            ]

            prescription_list.append(
                PrescriptionOut(
                    id=prescription.id,
                    content=prescription.content,
                    appointment_id=prescription.appointment_id,
                    medicaments=medicaments
                )
            )

        return prescription_list
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")

# Get prescription by appointment ID
@router.get("/{appointment_id}", response_model=PrescriptionOut)
async def get_prescription_by_appointment_id(appointment_id: int, db: AsyncSession = Depends(get_db)):
    try:
        result = await db.execute(
            select(Prescription).filter(Prescription.appointment_id == appointment_id)
        )
        prescription = result.scalar_one_or_none()

        if not prescription:
            raise HTTPException(status_code=404, detail="Prescription not found for this appointment")

        join_query = select(
            prescription_medicament.c.medicament_id,
            prescription_medicament.c.duration,
            prescription_medicament.c.dosage
        ).where(prescription_medicament.c.prescription_id == prescription.id)
        meds_result = await db.execute(join_query)
        medicaments = [
            MedicamentItem(id=mid, duration=duration, dosage=dosage)
            for mid, duration, dosage in meds_result.fetchall()
        ]

        return PrescriptionOut(
            id=prescription.id,
            content=prescription.content,
            appointment_id=prescription.appointment_id,
            medicaments=medicaments
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")

# Delete prescription
@router.delete("/{id}")
async def delete_prescription(id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Prescription).filter(Prescription.id == id))
    prescription = result.scalar_one_or_none()

    if not prescription:
        raise HTTPException(status_code=404, detail="Prescription not found")

    await db.delete(prescription)
    await db.commit()
    return {"detail": "Prescription deleted"}
