from typing import List, Dict, Optional, Tuple
from datetime import date
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from fastapi import APIRouter, HTTPException, Depends
from models.patients import Patient as PatientModel
from models.medecins import Medecin as MedecinModel
from models.users import User as UserModel
from Dto.userdto import MedcinResponse, PatientResponse
from models.appointments import Appointment as AppointmentModel
from database import get_db
router = APIRouter()
@router.get("/patients", response_model=list[PatientResponse])
async def get_all_patients(db: AsyncSession = Depends(get_db)):
    try:
        # Perform an asynchronous join between Patient and User models
        query = (
            select(PatientModel, UserModel)
            .join(UserModel, UserModel.id == PatientModel.user_id)
        )

        result = await db.execute(query)
        patient_users = result.all()

        if not patient_users:
            raise HTTPException(status_code=404, detail="No patients found")

        # Construct a list of PatientResponse objects
        patients = [
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
        return patients

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving patients: {str(e)}")



@router.get("/doctors", response_model=list[MedcinResponse])
async def get_all_medecins(db: AsyncSession = Depends(get_db)):
    try:
        # join Medecin and User
        query = (
            select(MedecinModel, UserModel)
            .join(UserModel, UserModel.id == MedecinModel.user_id)
        )
        result = await db.execute(query)
        medecin_users = result.all()

        if not medecin_users:
            raise HTTPException(status_code=404, detail="No medecins found")

        # build response list
        medecins = [
            MedcinResponse(
                id=medecin.id,
                user_id=medecin.user_id,
                nom=user.nom,
                prenom=user.prenom,
                telephone=user.telephone,
                email=user.email,
                isverified=user.isverified,
                photo=user.photo,
                role=user.role,
                # now include any Medecin-specific fields; adjust these to match your model/DTO:
                ville=medecin.ville,
                adresse=medecin.adresse,
                diplome=medecin.diplome,
                grade=medecin.grade,
            )
            for medecin, user in medecin_users
        ]
        return medecins

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving medecins: {e}")
    



def _years_ago(years: int) -> date:
    """
    Return the date exactly `years` ago from today.
    Clamps Feb 29 → Feb 28 on non-leap years.
    """
    today = date.today()
    try:
        return today.replace(year=today.year - years)
    except ValueError:
        return today.replace(month=2, day=28, year=today.year - years)

class AgeCategoryCount(BaseModel):
    category: str
    count: int

    class Config:
        orm_mode = True

def _years_ago(years: int) -> date:
    today = date.today()
    try:
        return today.replace(year=today.year - years)
    except ValueError:
        # Handle Feb 29 → Feb 28
        return today.replace(month=2, day=28, year=today.year - years)

@router.get(
    "/patients/count-by-age-category",
    response_model=List[AgeCategoryCount],
)
async def count_patients_by_age_category(
    db: AsyncSession = Depends(get_db),
):
    """
    Returns a list of { category: str, count: int } for these age buckets:
     - "0-18"
     - "19-35"
     - "36-50"
     - "51-65"
     - "65+"
    """
    buckets: List[Tuple[str, int, Optional[int]]] = [
        ("0-18",   0,  18),
        ("19-35", 19,  35),
        ("36-50", 36,  50),
        ("51-65", 51,  65),
        ("65+",    65, None),
    ]

    results: List[AgeCategoryCount] = []
    for label, min_age, max_age in buckets:
        if max_age is None:
            cutoff = _years_ago(min_age)
            stmt = (
                select(func.count(PatientModel.id))
                .filter(PatientModel.date_naissance <= cutoff)
            )
        else:
            born_after  = _years_ago(max_age)   # age ≤ max_age
            born_before = _years_ago(min_age)   # age ≥ min_age
            stmt = (
                select(func.count(PatientModel.id))
                .filter(PatientModel.date_naissance >= born_after)
                .filter(PatientModel.date_naissance <= born_before)
            )

        count = (await db.execute(stmt)).scalar_one()
        results.append(AgeCategoryCount(category=label, count=count))

    return results
async def count_all_appointments(db: AsyncSession) -> int:
    """
    Returns the total count of Appointment records.
    """
    stmt = select(func.count(AppointmentModel.id))
    result = await db.execute(stmt)
    # scalar_one() will return the integer count
    return result.scalar_one()

@router.get("/appointments/count")
async def get_appointments_count(db: AsyncSession = Depends(get_db)):
    """
    Endpoint: GET /appointments/count
    Returns:
      {
        "count": <total number of appointments>
      }
    """
    total = await count_all_appointments(db)
    return {"count": total}


async def count_all_patients(db: AsyncSession) -> int:
    """
    Returns the total count of Patient records.
    """
    stmt = select(func.count(PatientModel.id))
    result = await db.execute(stmt)
    return result.scalar_one()

async def count_all_medecins(db: AsyncSession) -> int:
    """
    Returns the total count of Medecin records.
    """
    stmt = select(func.count(MedecinModel.id))
    result = await db.execute(stmt)
    return result.scalar_one()

@router.get("/patients/count")
async def get_patients_count(db: AsyncSession = Depends(get_db)):
    """
    GET /patients/count
    Returns:
      { "count": <total number of patients> }
    """
    total = await count_all_patients(db)
    return {"count": total}

@router.get("/medecins/count")
async def get_medecins_count(db: AsyncSession = Depends(get_db)):
    """
    GET /medecins/count
    Returns:
      { "count": <total number of doctors> }
    """
    total = await count_all_medecins(db)
    return {"count": total}

from sqlalchemy import extract

class AppointmentCountByWeekDay(BaseModel):
    day: str
    count: int

    class Config:
        orm_mode = True

DAY_NAMES = {
    0: "Sunday",
    1: "Monday",
    2: "Tuesday",
    3: "Wednesday",
    4: "Thursday",
    5: "Friday",
    6: "Saturday",
}

from sqlalchemy import extract

class AppointmentCountByWeekDay(BaseModel):
    day: str
    count: int

    class Config:
        orm_mode = True

async def count_appointments_per_weekday(db: AsyncSession) -> List[AppointmentCountByWeekDay]:
    """
    Counts appointments grouped by weekday.
    """
    stmt = (
        select(
            extract('dow', AppointmentModel.date).label("weekday"),  # Extract day of week (0=Sunday)
            func.count(AppointmentModel.id).label("count")
        )
        .group_by("weekday")
        .order_by("weekday")
    )

    result = await db.execute(stmt)
    counts = result.all()

    return [
        AppointmentCountByWeekDay(
            day=DAY_NAMES[int(row.weekday)],  # No +1 needed
            count=row.count
        )
        for row in counts
    ]

@router.get("/appointments/count-by-weekday", response_model=List[AppointmentCountByWeekDay])
async def get_appointments_count_by_weekday(db: AsyncSession = Depends(get_db)):
    """
    GET /appointments/count-by-weekday
    Returns:
      [
        { "day": "Monday", "count": 10 },
        { "day": "Tuesday", "count": 5 },
        ...
      ]
    """
    return await count_appointments_per_weekday(db)



@router.get("/appointments/count-by-doctors")
async def count_appointments_per_doctor(db: AsyncSession = Depends(get_db)):
    stmt = (
        select(
            UserModel.nom,
            func.count(AppointmentModel.id).label("appointment_count")
        )
        .join(MedecinModel, MedecinModel.id == AppointmentModel.medecin_id)
        .join(UserModel, UserModel.id == MedecinModel.user_id)
        .group_by(UserModel.nom)
    )

    result = await db.execute(stmt)
    rows = result.all()

    return [
        {"doctor": doctor_name, "count": appointment_count}
        for doctor_name, appointment_count in rows
    ]


@router.get("/appointments/per-doctor-yearly")
async def get_appointments_per_doctor_yearly(
    db: AsyncSession = Depends(get_db),
    year: int = 2024,  # default year = 2024
):
    """
    GET /appointments/per-doctor-yearly?year=2024
    Returns:
    [
        {
            "doctor": "John Doe",
            "monthly_counts": [5, 3, 7, 0, 2, 4, 6, 8, 2, 1, 0, 0]  # counts for Jan-Dec
        },
        ...
    ]
    """
    stmt = (
        select(
            UserModel.nom.label("doctor_name"),
            extract('month', AppointmentModel.date).label("month"),
            func.count(AppointmentModel.id).label("appointment_count")
        )
        .join(MedecinModel, MedecinModel.id == AppointmentModel.medecin_id)
        .join(UserModel, UserModel.id == MedecinModel.user_id)
        .where(extract('year', AppointmentModel.date) == year)
        .group_by(UserModel.nom, "month")
        .order_by(UserModel.nom, "month")
    )

    result = await db.execute(stmt)
    rows = result.all()

    # Organize results
    doctor_monthly_counts: Dict[str, List[int]] = {}

    for doctor_name, month, appointment_count in rows:
        if doctor_name not in doctor_monthly_counts:
            doctor_monthly_counts[doctor_name] = [0] * 12  # 12 months initialized to 0
        doctor_monthly_counts[doctor_name][int(month) - 1] = appointment_count  # month 1 => index 0

    return [
        {
            "doctor": doctor_name,
            "monthly_counts": monthly_counts
        }
        for doctor_name, monthly_counts in doctor_monthly_counts.items()
    ]