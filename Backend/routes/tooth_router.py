from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from models.tooth import Tooth
from models.patients import Patient
from database import get_db
from .teeth_constants import TEETH_LIST
from Dto.toothdto import ToothOut

router = APIRouter()





class ToothNoteUpdate(BaseModel):
    note: str




@router.get("/patients/{patient_id}/teeth", response_model=list[ToothOut], status_code=status.HTTP_200_OK)
async def get_patient_teeth(patient_id: int, db: AsyncSession = Depends(get_db)):
    # Query to get all teeth for the patient
    result = await db.execute(select(Tooth).filter(Tooth.patient_id == patient_id))
    teeth = result.scalars().all()

    if not teeth:
        raise HTTPException(status_code=404, detail="No teeth found for this patient")

    # Prepare the response
    return teeth



@router.put("/teeth/{tooth_id}/note", status_code=status.HTTP_200_OK)
async def update_tooth_note(
    tooth_id: int,
    tooth_note: ToothNoteUpdate,  # Use the Pydantic model to parse the request body
    db: AsyncSession = Depends(get_db)
):
    # Asynchronously check if the tooth exists
    result = await db.execute(select(Tooth).filter(Tooth.id == tooth_id))
    tooth = result.scalar_one_or_none()

    if not tooth:
        raise HTTPException(status_code=404, detail="Tooth not found")

    # Update the note for the specific tooth
    tooth.note = tooth_note.note

    # Commit the changes asynchronously
    await db.commit()

    return {"message": "Note updated successfully", "tooth_id": tooth.id, "note": tooth.note}


@router.post("/patients/{patient_id}/teeth", status_code=status.HTTP_201_CREATED)
async def create_teeth_for_patient(patient_id: int, db: AsyncSession = Depends(get_db)):
    # Asynchronously check if the patient exists
    result = await db.execute(select(Patient).filter(Patient.id == patient_id))
    patient = result.scalar_one_or_none()

    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    # Create the 32 teeth entries for this patient
    teeth_entries = []
    for tooth in TEETH_LIST:
        new_tooth = Tooth(
            patient_id=patient.id,
            tooth_code=tooth["tooth_code"],
            tooth_name=tooth["tooth_name"],
            note="",
            status="Healthy" 
        )
        teeth_entries.append(new_tooth)

    # Add the new teeth to the session and commit asynchronously
    db.add_all(teeth_entries)
    await db.commit()

    return {"message": "Teeth created for the patient successfully"}


@router.put("/status/{patient_id}/teeth/{tooth_id}", status_code=status.HTTP_200_OK)
async def update_tooth_status(
    patient_id: int,
    tooth_id: int,
    status: str,  # The status we want to set for the tooth
    db: AsyncSession = Depends(get_db)
):
    try:
        # Validate if the status is one of the allowed values
        allowed_statuses = ['Healthy', 'Needs Attention', 'Requires Treatment', 'Treatment Completed']
        if status not in allowed_statuses:
            raise HTTPException(status_code=400, detail=f"Invalid status. Allowed values are: {', '.join(allowed_statuses)}")

        # Query to get the tooth
        tooth_query = select(Tooth).filter(Tooth.id == tooth_id, Tooth.patient_id == patient_id)
        result = await db.execute(tooth_query)
        tooth = result.scalar_one_or_none()

        if not tooth:
            raise HTTPException(status_code=404, detail="Tooth not found for the patient")

        # Update the status
        tooth.status = status

        # Commit the changes
        await db.commit()
        await db.refresh(tooth)

        return {"message": f"Tooth status updated to '{status}' successfully", "tooth": tooth}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating tooth status: {e}")
