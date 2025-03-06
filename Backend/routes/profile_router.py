import asyncio
import bcrypt
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
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


@router.get("/medcine/{medicine_id}", response_model=MedcinResponse)
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
            annee_experience=medicine.annee_experience,  )
        
    except Exception as e:
        print(f"Error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error retrieving medicine details: {str(e)}")

@router.put("/updatemedecin/{medecin_id}")
async def update_medecin_details(medecin_id: int, update_data: UpdateMedcinProfileRequest, db: AsyncSession = Depends(get_db)):
    try:
        # Fetch Medecin details
        medecin_query = select(MedcineModel).filter(MedcineModel.id == medecin_id)
        medecin_result = await db.execute(medecin_query)
        medecin = medecin_result.scalar_one_or_none()

        if not medecin:
            raise HTTPException(status_code=404, detail="Medecin not found")

        # Fetch associated User details
        user_query = select(UserModel).filter(UserModel.id == medecin.user_id)
        user_result = await db.execute(user_query)
        user = user_result.scalar_one_or_none()

        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Update only provided fields
        if update_data.adresse is not None:
            medecin.adresse = update_data.adresse
        if update_data.telephone is not None:
            user.telephone = update_data.telephone
        if update_data.photo is not None:
            user.photo = update_data.photo
        if update_data.password is not None:
            user.password = hash_password(update_data.password)  

        # Commit changes
        await db.commit()
        await db.refresh(medecin)
        await db.refresh(user)

        return {
            "message": "Medecin details updated successfully",
            "medecin": {
                "id": medecin.id,
                "user_id": medecin.user_id,
                "adresse": medecin.adresse
            },
            "user": {
                "nom": user.nom,
                "prenom": user.prenom,
                "telephone": user.telephone,
                "email": user.email,
                "password":user.password,
                "photo": user.photo,
                "role": user.role
            }
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating medecin details: {str(e)}")

@router.put("/updatepatient/{patient_id}")
async def update_patient_details(patient_id: int, update_data: UpdatePatientProfileRequest, db: AsyncSession = Depends(get_db)):
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

        # Update only provided fields
        if update_data.telephone is not None:
            user.telephone = update_data.telephone
        if update_data.photo is not None:
            user.photo = update_data.photo
        if update_data.password is not None:
            user.password = hash_password(update_data.password)

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
                "password":user.password,
                "telephone": user.telephone,
                "email": user.email,
                "photo": user.photo,
                "role": user.role
            }
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating patient details: {str(e)}")    