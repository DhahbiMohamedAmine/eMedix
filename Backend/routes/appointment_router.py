import asyncio
from fastapi import APIRouter, HTTPException, Depends , BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from models.appointments import Appointment as AppointmentModel
from models.patients import Patient as PatientModel
from models.medecins import Medecin
from database import get_db
from Dto.appointment import AppointmentRequest, AppointmentResponse , UpdateAppointmentRequest
from datetime import date, datetime, timedelta
from typing import List
router = APIRouter()

@router.post("/addappointment", response_model=AppointmentResponse)
async def add_appointment(appointment: AppointmentRequest, db: AsyncSession = Depends(get_db)):
    try:
        # Check if the patient exists
        patient_query = select(PatientModel).filter(PatientModel.id == appointment.patient_id)
        patient_result = await db.execute(patient_query)
        patient_record = patient_result.scalar_one_or_none()

        if not patient_record:
            raise HTTPException(status_code=404, detail="Patient not found")

        # Check if the medic exists
        medic_query = select(Medecin).filter(Medecin.id == appointment.medecin_id)
        medic_result = await db.execute(medic_query)
        medic = medic_result.scalar_one_or_none()

        if not medic:
            raise HTTPException(status_code=404, detail="Medcin (doctor) not found")

        # Create a new appointment with status "en attente"
        new_appointment = AppointmentModel(
            patient_id=appointment.patient_id,
            medecin_id=appointment.medecin_id,
            date=appointment.date,
            status=appointment.status or "pending",
            note=""
        )

        db.add(new_appointment)
        await db.commit()
        await db.refresh(new_appointment)

        return new_appointment

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating appointment: {e}")
    


@router.put("/updateappointment/{appointment_id}", response_model=AppointmentResponse)
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
            existing_appointment.status = "pending"

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
    
@router.get("/bydate/{appointment_date}", response_model=List[AppointmentResponse])
async def get_appointments_by_date(appointment_date: date, db: AsyncSession = Depends(get_db)):
    try:
        # Convert the date into the start and end of that day to filter all appointments on that day
        start_date = appointment_date
        end_date = appointment_date

        # Filter appointments by the given date
        appointment_query = select(AppointmentModel).filter(
            AppointmentModel.date >= start_date,
            AppointmentModel.date <= end_date
        )

        appointment_result = await db.execute(appointment_query)
        appointments = appointment_result.scalars().all()

        if not appointments:
            raise HTTPException(status_code=404, detail="No appointments found for the given date")

        return appointments

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving appointments by date: {e}")
    

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

@router.put("/confirm/{appointment_id}", response_model=AppointmentResponse)
async def confirm_appointment(appointment_id: int, db: AsyncSession = Depends(get_db)):
    try:
        # Query to get the appointment by id
        appointment_query = select(AppointmentModel).filter(AppointmentModel.id == appointment_id)
        appointment_result = await db.execute(appointment_query)
        existing_appointment = appointment_result.scalar_one_or_none()

        if not existing_appointment:
            raise HTTPException(status_code=404, detail="Appointment not found")

        # Check if the status is 'pending', and update to 'confirmed'
        if existing_appointment.status != "pending":
            raise HTTPException(status_code=400, detail="Appointment is not in 'pending' status")

        # Change the status to 'confirmed'
        existing_appointment.status = "confirmed"

        db.add(existing_appointment)
        await db.commit()
        await db.refresh(existing_appointment)

        return existing_appointment

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating appointment status: {e}")
