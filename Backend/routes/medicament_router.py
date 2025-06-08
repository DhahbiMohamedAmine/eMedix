
# routers/medicament_router.py
import os
import shutil
from uuid import uuid4
from fastapi import APIRouter, File, HTTPException, Depends, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from models.medicaments import Medicament
from database import get_db
from Dto.medicamentdto import MedicamentCreate, MedicamentUpdate, MedicamentResponse
from typing import List

router = APIRouter()

@router.post("/", response_model=MedicamentResponse)
async def create_medicament(medicament: MedicamentCreate, db: AsyncSession = Depends(get_db)):
    try:
        new_medicament = Medicament(**medicament.model_dump())
        db.add(new_medicament)
        await db.commit()
        await db.refresh(new_medicament)
        return new_medicament
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating medicament: {e}")

@router.get("/", response_model=List[MedicamentResponse])
async def get_all_medicaments(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Medicament))
    return result.scalars().all()

@router.get("/{medicament_id}", response_model=MedicamentResponse)
async def get_medicament(medicament_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Medicament).where(Medicament.id == medicament_id))
    medicament = result.scalar_one_or_none()
    if not medicament:
        raise HTTPException(status_code=404, detail="Medicament not found")
    return medicament

@router.put("/{medicament_id}", response_model=MedicamentResponse)
async def update_medicament_price(
    medicament_id: int,
    medicament_data: MedicamentUpdate,
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Medicament).where(Medicament.id == medicament_id))
    medicament = result.scalar_one_or_none()
    if not medicament:
        raise HTTPException(status_code=404, detail="Medicament not found")

    medicament.price = medicament_data.price
    medicament.dosage = medicament_data.dosage
    medicament.duration = medicament_data.duration
    medicament.stock = medicament_data.stock
    medicament.legal = medicament_data.legal
    
    if medicament_data.image is not None:
        medicament.image = medicament_data.image

    db.add(medicament)
    await db.commit()
    await db.refresh(medicament)
    return medicament



@router.delete("/{medicament_id}")
async def delete_medicament(medicament_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Medicament).where(Medicament.id == medicament_id))
    medicament = result.scalar_one_or_none()
    if not medicament:
        raise HTTPException(status_code=404, detail="Medicament not found")

    await db.delete(medicament)
    await db.commit()
    return {"message": "Medicament deleted successfully"}


@router.post("/upload-medicament-image")
async def upload_medicament_image(file: UploadFile = File(...)):
    """
    Upload an image for a medicament and return the file path
    """
    try:
        # Create uploads directory if it doesn't exist
        upload_dir = os.path.join("static", "uploads", "medicaments")
        os.makedirs(upload_dir, exist_ok=True)
        
        # Generate unique filename
        file_extension = os.path.splitext(file.filename)[1]
        unique_filename = f"{uuid4()}{file_extension}"
        file_path = os.path.join(upload_dir, unique_filename)
        
        # Save the file
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Return the relative path to be saved in the database
        relative_path = f"/static/uploads/medicaments/{unique_filename}"
        
        return {"image_path": relative_path}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error uploading image: {str(e)}")