import asyncio
from fastapi import APIRouter, HTTPException, Depends , BackgroundTasks
from sqlalchemy import Date, cast, desc, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from models.appointments import Appointment as AppointmentModel
from models.patients import Patient as PatientModel
from models.medecins import Medecin
from database import get_db
from Dto.appointment import AppointmentRequest,AppointmentMedecinRequest, AppointmentResponse, UpdateAppointmentNoteRequest , UpdateAppointmentRequest, AppointmentFilter
from datetime import date, datetime, timedelta
from typing import List
from Dto.userdto import PatientResponse, UserResponse
from models.users import User as UserModel
router = APIRouter()

@router.post("/addappointment/{medecin_id}", response_model=AppointmentResponse)
async def add_appointment(medecin_id: int, appointment: AppointmentRequest, db: AsyncSession = Depends(get_db)):
    try:
        # Check if the patient exists
        patient_query = select(PatientModel).filter(PatientModel.id == appointment.patient_id)
        patient_result = await db.execute(patient_query)
        patient_record = patient_result.scalar_one_or_none()

        if not patient_record:
            raise HTTPException(status_code=404, detail="Patient not found")

        # Check if the medic exists
        medic_query = select(Medecin).filter(Medecin.id == medecin_id)
        medic_result = await db.execute(medic_query)
        medic = medic_result.scalar_one_or_none()

        if not medic:
            raise HTTPException(status_code=404, detail="Medcin (doctor) not found")

        # Create a new appointment with status "en attente"
        new_appointment = AppointmentModel(
            patient_id=appointment.patient_id,
            medecin_id=medecin_id,
            date=appointment.date,
            status="waiting for medecin confirmation",
            note=""
        )

        db.add(new_appointment)
        await db.commit()
        await db.refresh(new_appointment)

        return new_appointment

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating appointment: {e}")
    


@router.put("/pupdateappointment/{appointment_id}", response_model=AppointmentResponse)
async def update_appointment(appointment_id: int, appointment: UpdateAppointmentRequest, db: AsyncSession = Depends(get_db)):
    try:
        # Check if the appointment exists
        appointment_query = select(AppointmentModel).filter(AppointmentModel.id == appointment_id)
        appointment_result = await db.execute(appointment_query)
        existing_appointment = appointment_result.scalar_one_or_none()

        if not existing_appointment:
            raise HTTPException(status_code=404, detail="Appointment not found")

        # Update the date (and time if needed)
        if appointment.date:
            existing_appointment.date = appointment.date  # Full datetime is accepted
            existing_appointment.status = "waiting for medecin confirmation"

        db.add(existing_appointment)
        await db.commit()
        await db.refresh(existing_appointment)

        return existing_appointment

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating appointment: {e}")
    

@router.put("/mupdateappointment/{appointment_id}", response_model=AppointmentResponse)
async def update_appointment(appointment_id: int, appointment: UpdateAppointmentRequest, db: AsyncSession = Depends(get_db)):
    try:
        # Check if the appointment exists
        appointment_query = select(AppointmentModel).filter(AppointmentModel.id == appointment_id)
        appointment_result = await db.execute(appointment_query)
        existing_appointment = appointment_result.scalar_one_or_none()

        if not existing_appointment:
            raise HTTPException(status_code=404, detail="Appointment not found")

        # Update the date (and time if needed)
        if appointment.date:
            existing_appointment.date = appointment.date  # Full datetime is accepted
            existing_appointment.status = "waiting for patient confirmation"

        db.add(existing_appointment)
        await db.commit()
        await db.refresh(existing_appointment)

        return existing_appointment

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating appointment: {e}")
    


@router.put("/cancelappointment/{appointment_id}", response_model=AppointmentResponse)
async def cancel_appointment(appointment_id: int, background_tasks: BackgroundTasks, db: AsyncSession = Depends(get_db)):
    try:
        # Check if the appointment exists
        appointment_query = select(AppointmentModel).filter(AppointmentModel.id == appointment_id)
        appointment_result = await db.execute(appointment_query)
        existing_appointment = appointment_result.scalar_one_or_none()

        if not existing_appointment:
            raise HTTPException(status_code=404, detail="Appointment not found")

        # Change status to 'annulé'
        existing_appointment.status = "cancelled"
        existing_appointment.date_annulé = datetime.utcnow()  # You can optionally store the cancellation time
        db.add(existing_appointment)
        await db.commit()
        await db.refresh(existing_appointment)

        # Schedule background task to delete the appointment after 24 hours
        background_tasks.add_task(delete_appointment_after_delay, appointment_id, db)

        return existing_appointment

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error cancelling appointment: {e}")

async def delete_appointment_after_delay(appointment_id: int, db: AsyncSession):
    # Wait for 24 hours (86,400 seconds)
    await asyncio.sleep(20)  # 24 hours = 86400 seconds

    try:
        # Find the canceled appointment
        appointment_query = select(AppointmentModel).filter(AppointmentModel.id == appointment_id)
        appointment_result = await db.execute(appointment_query)
        existing_appointment = appointment_result.scalar_one_or_none()

        if not existing_appointment:
            print("Appointment already deleted or not found.")
            return

        # Delete the appointment
        await db.delete(existing_appointment)
        await db.commit()

        print(f"Appointment {appointment_id} has been deleted after 24 hours.")
    
    except Exception as e:
        print(f"Error deleting appointment {appointment_id}: {e}")


@router.get("/appointment/{appointment_id}", response_model=AppointmentResponse)
async def get_appointment_details(appointment_id: int, db: AsyncSession = Depends(get_db)):
    try:
        # Query the database for the appointment by ID
        appointment_query = select(AppointmentModel).filter(AppointmentModel.id == appointment_id)
        appointment_result = await db.execute(appointment_query)
        appointment = appointment_result.scalar_one_or_none()

        # If no appointment found, raise an exception
        if not appointment:
            raise HTTPException(status_code=404, detail="Appointment not found")

        return appointment

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving appointment details: {e}")
    
@router.get("/all", response_model=List[AppointmentResponse])
async def get_all_appointments(db: AsyncSession = Depends(get_db)):
    try:
        # Query the database to get all appointments
        appointment_query = select(AppointmentModel)
        appointment_result = await db.execute(appointment_query)
        appointments = appointment_result.scalars().all()

        # If no appointments found, raise an exception
        if not appointments:
            raise HTTPException(status_code=404, detail="No appointments found")

        return appointments

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving appointments: {e}")


@router.post("/bydate", response_model=List[AppointmentResponse])
async def get_appointments_by_date_and_medecin(
    filter: AppointmentFilter, 
    db: AsyncSession = Depends(get_db)
):
    try:
        # Filter by medecin_id and cast DateTime to Date
        appointment_query = select(AppointmentModel).filter(
            AppointmentModel.medecin_id == filter.medecin_id,
            cast(AppointmentModel.date, Date) == filter.date
        )

        appointment_result = await db.execute(appointment_query)
        appointments = appointment_result.scalars().all()

        if not appointments:
            raise HTTPException(status_code=404, detail="No appointments found for the given doctor and date")

        return appointments

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving appointments: {e}")




    

@router.get("/patient/{patient_id}", response_model=List[AppointmentResponse])
async def get_appointments_by_patient(patient_id: int, db: AsyncSession = Depends(get_db)):
    try:
        # Query to get all appointments for a specific patient
        appointments_query = select(AppointmentModel).filter(AppointmentModel.patient_id == patient_id)
        appointments_result = await db.execute(appointments_query)
        appointments = appointments_result.scalars().all()

        if not appointments:
            raise HTTPException(status_code=404, detail="No appointments found for this patient")

        return appointments

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving appointments: {e}")

@router.get("/medecin/{medecin_id}", response_model=List[AppointmentResponse])
async def get_appointments_by_medecin(medecin_id: int, db: AsyncSession = Depends(get_db)):
    try:
        # Query to get all appointments for a specific medecin (doctor)
        appointments_query = select(AppointmentModel).filter(AppointmentModel.medecin_id == medecin_id)
        appointments_result = await db.execute(appointments_query)
        appointments = appointments_result.scalars().all()

        if not appointments:
            raise HTTPException(status_code=404, detail="No appointments found for this medecin")

        return appointments

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving appointments: {e}")

@router.put("/mconfirm/{appointment_id}", response_model=AppointmentResponse)
async def confirm_appointment(appointment_id: int, db: AsyncSession = Depends(get_db)):
    try:
        # Query to get the appointment by id
        appointment_query = select(AppointmentModel).filter(AppointmentModel.id == appointment_id)
        appointment_result = await db.execute(appointment_query)
        existing_appointment = appointment_result.scalar_one_or_none()

        if not existing_appointment:
            raise HTTPException(status_code=404, detail="Appointment not found")

        # Check if the status is 'pending', and update to 'confirmed'
        if existing_appointment.status != "waiting for medecin confirmation":
            raise HTTPException(status_code=400, detail="Appointment is not in 'pending' status")

        # Change the status to 'confirmed'
        existing_appointment.status = "confirmed"

        db.add(existing_appointment)
        await db.commit()
        await db.refresh(existing_appointment)

        return existing_appointment

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating appointment status: {e}")
    

@router.put("/pconfirm/{appointment_id}", response_model=AppointmentResponse)
async def confirm_appointment(appointment_id: int, db: AsyncSession = Depends(get_db)):
    try:
        # Query to get the appointment by id
        appointment_query = select(AppointmentModel).filter(AppointmentModel.id == appointment_id)
        appointment_result = await db.execute(appointment_query)
        existing_appointment = appointment_result.scalar_one_or_none()

        if not existing_appointment:
            raise HTTPException(status_code=404, detail="Appointment not found")

        # Check if the status is 'pending', and update to 'confirmed'
        if existing_appointment.status != "waiting for patient confirmation":
            raise HTTPException(status_code=400, detail="Appointment is not in 'pending' status")

        # Change the status to 'confirmed'
        existing_appointment.status = "confirmed"

        db.add(existing_appointment)
        await db.commit()
        await db.refresh(existing_appointment)

        return existing_appointment

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating appointment status: {e}")
    
    
@router.put("/updatenote/{appointment_id}", response_model=AppointmentResponse)
async def update_appointment_note(
    appointment_id: int, 
    appointment: UpdateAppointmentNoteRequest, 
    db: AsyncSession = Depends(get_db)
):
    try:
        # Vérifier si le rendez-vous existe
        appointment_query = select(AppointmentModel).filter(AppointmentModel.id == appointment_id)
        appointment_result = await db.execute(appointment_query)
        existing_appointment = appointment_result.scalar_one_or_none()

        if not existing_appointment:
            raise HTTPException(status_code=404, detail="Appointment not found")

        # Mise à jour de la note uniquement
        if appointment.note is not None:
            existing_appointment.note = appointment.note

        db.add(existing_appointment)
        await db.commit()
        await db.refresh(existing_appointment)

        return existing_appointment

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating appointment note: {e}")
    

@router.get("/medecin/patients/{medecin_id}", response_model=List[PatientResponse])
async def get_patients_by_medecin(medecin_id: int, db: AsyncSession = Depends(get_db)):
    try:
        print(f"Fetching patients for medecin ID: {medecin_id}")

        # Query patients and their associated users using a join
        query = (
            select(PatientModel, UserModel)
            .join(UserModel, UserModel.id == PatientModel.user_id)
            .join(AppointmentModel, AppointmentModel.patient_id == PatientModel.id)
            .filter(AppointmentModel.medecin_id == medecin_id)
            .distinct()
        )

        result = await db.execute(query)
        patient_users = result.all()

        if not patient_users:
            print(f"No patients found for medecin ID {medecin_id}")
            raise HTTPException(status_code=404, detail="No patients found for this medecin")

        print(f"Found {len(patient_users)} patients")

        # Convert ORM objects to Pydantic models
        return [
            PatientResponse(
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
            for patient, user in patient_users
        ]

    except Exception as e:
        print(f"Error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error retrieving patients: {str(e)}")


@router.post("/addappointment/patient/{patient_id}", response_model=AppointmentResponse)
async def add_appointment_with_patient_url(
    patient_id: int,
    appointment: AppointmentMedecinRequest,
    db: AsyncSession = Depends(get_db)
):
    try:
        # Check if the patient exists
        patient_query = select(PatientModel).filter(PatientModel.id == patient_id)
        patient_result = await db.execute(patient_query)
        patient_record = patient_result.scalar_one_or_none()

        if not patient_record:
            raise HTTPException(status_code=404, detail="Patient not found")

        # Check if the medic exists
        medic_query = select(Medecin).filter(Medecin.id == appointment.medecin_id)
        medic_result = await db.execute(medic_query)
        medic = medic_result.scalar_one_or_none()

        if not medic:
            raise HTTPException(status_code=404, detail="Medecin (doctor) not found")

        # Create a new appointment with status "en attente"
        new_appointment = AppointmentModel(
            patient_id=patient_id,
            medecin_id=appointment.medecin_id,
            date=appointment.date,
            status="waiting for patient confirmation",
            note=""
        )

        db.add(new_appointment)
        await db.commit()
        await db.refresh(new_appointment)

        return new_appointment

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating appointment: {e}")



@router.get("/count/confirmed/{patient_id}/{medecin_id}")
async def count_confirmed_appointments(
    patient_id: int,
    medecin_id: int,
    db: AsyncSession = Depends(get_db)
):
    try:
        now = datetime.now()

        query = select(func.count()).select_from(AppointmentModel).where(
            AppointmentModel.patient_id == patient_id,
            AppointmentModel.medecin_id == medecin_id,
            AppointmentModel.status == "confirmed",
            AppointmentModel.date < now  # Only appointments that already passed
        )

        result = await db.execute(query)
        count = result.scalar()

        return {"past_confirmed_appointments_count": count}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error counting appointments: {e}")




@router.get("/last-confirmed-past/{patient_id}/{medecin_id}")
async def get_last_confirmed_past_appointment(
    patient_id: int,
    medecin_id: int,
    db: AsyncSession = Depends(get_db)
):
    try:
        now = datetime.now()

        query = (
            select(AppointmentModel)
            .where(
                AppointmentModel.patient_id == patient_id,
                AppointmentModel.medecin_id == medecin_id,
                AppointmentModel.status == "confirmed",
                AppointmentModel.date < now  # Only past appointments
            )
            .order_by(desc(AppointmentModel.date))
            .limit(1)
        )

        result = await db.execute(query)
        last_appointment = result.scalar_one_or_none()

        if not last_appointment:
            raise HTTPException(status_code=404, detail="No past confirmed appointments found")

        return {
            "last_confirmed_past_appointment": {
                "id": last_appointment.id,
                "date": last_appointment.date,
                "note": last_appointment.note,
                "status": last_appointment.status
            }
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving appointment: {e}")

