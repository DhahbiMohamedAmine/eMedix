import asyncio
import logging
import os
from pydoc import text
import shutil
from typing import Optional
from uuid import uuid4
import bcrypt
from fastapi import APIRouter, File, Form, HTTPException, Depends, UploadFile, logger
from sqlalchemy import distinct
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from models.appointments import Appointment as AppointmentModel
from models.patients import Patient as PatientModel
from models.users import User as UserModel
from models.medecins import Medecin as MedcineModel
from database import get_db
from Dto.userdto import PatientResponse, UserResponse , MedcinResponse,UpdateMedcinProfileRequest,UpdatePatientProfileRequest

router = APIRouter()
def hash_password(password: str) -> str:
    hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
    return hashed_password.decode('utf-8')

@router.get("/patient/{patient_id}", response_model=PatientResponse)
async def get_patient_details(patient_id: int, db: AsyncSession = Depends(get_db)):
    try:
        print(f"Fetching patient with ID: {patient_id}")

        # Query patient and user details in one go using a join
        query = (
            select(PatientModel, UserModel)
            .join(UserModel, UserModel.id == PatientModel.user_id)
            .filter(PatientModel.id == patient_id)
        )

        result = await db.execute(query)
        patient_user = result.first()

        if not patient_user:
            print(f"No patient found with ID {patient_id}")
            raise HTTPException(status_code=404, detail="Patient not found")

        patient, user = patient_user

        print(f"Patient found: {patient}, User: {user}")

        # Return all details
        return PatientResponse(
            id=patient.id,
            user_id=patient.user_id,
            nom=user.nom,
            prenom=user.prenom,
            telephone=user.telephone,
            email=user.email,
            isverified=user.isverified,
            photo=user.photo,
            role=user.role,
            date_naissance=patient.date_naissance
        )

    except Exception as e:
        print(f"Error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error retrieving patient details: {str(e)}")


@router.get("/medecin/{medicine_id}", response_model=MedcinResponse)
async def get_medicine_details(medicine_id: int, db: AsyncSession = Depends(get_db)):
    try:
        print(f"Fetching patient with ID: {medicine_id}")

        # Query patient and user details in one go using a join
        query = (
            select(MedcineModel, UserModel)
            .join(UserModel, UserModel.id == MedcineModel.user_id)
            .filter(MedcineModel.id == medicine_id)
        )

        result = await db.execute(query)
        med_user = result.first()

        if not med_user:
            print(f"No patient found with ID {medicine_id}")
            raise HTTPException(status_code=404, detail="Patient not found")

        medicine, user = med_user

        print(f"Patient found: {medicine}, User: {user}")

        return MedcinResponse(
            id=medicine.id,
            user_id=medicine.user_id,
            nom=user.nom,
            prenom=user.prenom,
            email=user.email,
            password=user.password,
            photo=user.photo,
            telephone=user.telephone,
            adresse=medicine.adresse,
            diplome=medicine.diplome,
            grade=medicine.grade,
            ville=medicine.ville,  )
        
    except Exception as e:
        print(f"Error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error retrieving medicine details: {str(e)}")

@router.put("/updatemedecin/{medecin_id}")
async def update_medecin_details(
    medecin_id: int,
    telephone: Optional[str] = Form(None),
    photo: Optional[UploadFile] = File(None),
    adress:  Optional[str] = Form(None),
    ville:  Optional[str] = Form(None),
    db: AsyncSession = Depends(get_db)
):
    try:
        # Fetch Patient details
        medecin_query = select(MedcineModel).filter(MedcineModel.id == medecin_id)
        medecin_result = await db.execute(medecin_query)
        medecin = medecin_result.scalar_one_or_none()

        if not medecin:
            raise HTTPException(status_code=404, detail="Patient not found")

        # Fetch associated User details
        user_query = select(UserModel).filter(UserModel.id == medecin.user_id)
        user_result = await db.execute(user_query)
        user = user_result.scalar_one_or_none()

        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        # Update telephone if provided
        if telephone is not None:
            user.telephone = telephone

        if adress is not None:
            medecin.adresse = adress
        
        if ville is not None:
            medecin.ville = ville
        

        # Handle photo upload like register function
        if photo is not None:
            upload_dir = os.path.join("static", "uploads")
            os.makedirs(upload_dir, exist_ok=True)
            file_extension = os.path.splitext(photo.filename)[1]
            unique_filename = f"{uuid4()}{file_extension}"
            file_path = os.path.join(upload_dir, unique_filename)
            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(photo.file, buffer)
            user.photo = f"/static/uploads/{unique_filename}"

        # Commit changes
        await db.commit()
        await db.refresh(medecin)
        await db.refresh(user)

        return {
            "message": "medecin details updated successfully",
            "medecin": {
                "id": medecin.id,
                "user_id": medecin.user_id,
                "adress": medecin.adresse,
                "ville": medecin.ville
            },
            "user": {
                "nom": user.nom,
                "prenom": user.prenom,
                "telephone": user.telephone,
                "email": user.email,
                "photo": user.photo,
                "role": user.role
            }
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating patient details: {str(e)}")
    

@router.put("/updatepatient/{patient_id}")
async def update_patient_details(
    patient_id: int,
    telephone: Optional[str] = Form(None),
    photo: Optional[UploadFile] = File(None),
    db: AsyncSession = Depends(get_db)
):
    try:
        # Fetch Patient details
        patient_query = select(PatientModel).filter(PatientModel.id == patient_id)
        patient_result = await db.execute(patient_query)
        patient = patient_result.scalar_one_or_none()

        if not patient:
            raise HTTPException(status_code=404, detail="Patient not found")

        # Fetch associated User details
        user_query = select(UserModel).filter(UserModel.id == patient.user_id)
        user_result = await db.execute(user_query)
        user = user_result.scalar_one_or_none()

        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        # Update telephone if provided
        if telephone is not None:
            user.telephone = telephone

        # Handle photo upload like register function
        if photo is not None:
            upload_dir = os.path.join("static", "uploads")
            os.makedirs(upload_dir, exist_ok=True)
            file_extension = os.path.splitext(photo.filename)[1]
            unique_filename = f"{uuid4()}{file_extension}"
            file_path = os.path.join(upload_dir, unique_filename)
            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(photo.file, buffer)
            user.photo = f"/static/uploads/{unique_filename}"

        # Commit changes
        await db.commit()
        await db.refresh(patient)
        await db.refresh(user)

        return {
            "message": "Patient details updated successfully",
            "patient": {
                "id": patient.id,
                "user_id": patient.user_id,
                "date_naissance": patient.date_naissance
            },
            "user": {
                "nom": user.nom,
                "prenom": user.prenom,
                "telephone": user.telephone,
                "email": user.email,
                "photo": user.photo,
                "role": user.role
            }
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating patient details: {str(e)}")


@router.get("/medecins", response_model=list[MedcinResponse])
async def get_all_medecins(db: AsyncSession = Depends(get_db)):
    try:
        print("Fetching all medecins...")

        query = (
            select(MedcineModel, UserModel)
            .join(UserModel, UserModel.id == MedcineModel.user_id)
            .order_by(MedcineModel.id.asc())  # <-- Order by ID ascending
        )

        result = await db.execute(query)
        medecins = result.all()

        if not medecins:
            print("No medecins found")
            raise HTTPException(status_code=404, detail="No medecins found")

        medecin_list = [
            MedcinResponse(
                id=med.id,
                user_id=med.user_id,
                nom=user.nom,
                prenom=user.prenom,
                email=user.email,
                password=user.password,
                photo=user.photo,
                telephone=user.telephone,
                adresse=med.adresse,
                diplome=med.diplome,
                grade=med.grade,
                ville=med.ville,
            )
            for med, user in medecins
        ]

        return medecin_list

    except Exception as e:
        print(f"Error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error retrieving medecins: {str(e)}")

from sqlalchemy.orm import joinedload
@router.get("/doctors/patient/{patient_id}")
async def get_doctors_by_patient(
    patient_id: int,
    db: AsyncSession = Depends(get_db)
):
    try:
        # Obtenir les identifiants uniques des médecins
        query = (
            select(AppointmentModel.medecin_id)
            .where(AppointmentModel.patient_id == patient_id)
            .distinct()
        )
        result = await db.execute(query)
        doctor_ids = [row[0] for row in result.fetchall()]

        if not doctor_ids:
            raise HTTPException(status_code=404, detail="No doctors found for this patient")

        # Rechercher les médecins avec les infos de leur compte utilisateur
        doctors_query = (
            select(MedcineModel)
            .where(MedcineModel.id.in_(doctor_ids))
            .options(joinedload(MedcineModel.user))
        )
        doctors_result = await db.execute(doctors_query)
        doctors = doctors_result.scalars().all()

        return {"doctors": [
            {
                "id": doc.id,
                "nom": doc.user.nom,
                "prenom": doc.user.prenom,
                "email": doc.user.email,
                "photo": doc.user.photo,
                "ville": doc.ville,
                "grade": doc.grade,
            }
            for doc in doctors
        ]}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving doctors: {e}")
    


@router.get("/patients/doctor/{medecin_id}")
async def get_patients_by_doctor(
    medecin_id: int,
    db: AsyncSession = Depends(get_db)
):
    try:
        # Get unique patient IDs for appointments with this doctor
        query = (
            select(AppointmentModel.patient_id)
            .where(AppointmentModel.medecin_id == medecin_id)
            .distinct()
        )
        result = await db.execute(query)
        patient_ids = [row[0] for row in result.fetchall()]

        if not patient_ids:
            raise HTTPException(status_code=404, detail="No patients found for this doctor")

        # Fetch patients with their user info
        patients_query = (
            select(PatientModel)
            .where(PatientModel.id.in_(patient_ids))
            .options(joinedload(PatientModel.user))
        )
        patients_result = await db.execute(patients_query)
        patients = patients_result.scalars().all()

        return {"patients": [
            {
                "id": patient.id,
                "nom": patient.user.nom,
                "prenom": patient.user.prenom,
                "email": patient.user.email,
                "photo": patient.user.photo,
                "telephone": patient.user.telephone,
            }
            for patient in patients
        ]}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving patients: {e}")