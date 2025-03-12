import asyncio
from fastapi import APIRouter, HTTPException, Depends , BackgroundTasks
from sqlalchemy import Date, cast
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from models.appointments import Appointment as AppointmentModel
from models.patients import Patient as PatientModel
from models.medecins import Medecin
from database import get_db
from Dto.appointment import AppointmentRequest, AppointmentResponse , UpdateAppointmentRequest, AppointmentFilter
from datetime import date, datetime, timedelta
from typing import List
router = APIRouter()

@router.post("/addappointment/{medecin_id}", response_model=AppointmentResponse)
async def add_appointment(
    medecin_id: int,
    appointment: AppointmentRequest,
    db: AsyncSession = Depends(get_db),
):
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
            status=appointment.status or "waiting for medecin confirmation",
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
            raise HTTPException(status_code=400, detail="Appointment is not in 'waiting for medecin confirmation' status")

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
            raise HTTPException(status_code=400, detail="Appointment is not in 'waiting for patient confirmation' status")

        # Change the status to 'confirmed'
        existing_appointment.status = "confirmed"

        db.add(existing_appointment)
        await db.commit()
        await db.refresh(existing_appointment)

        return existing_appointment

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating appointment status: {e}")
