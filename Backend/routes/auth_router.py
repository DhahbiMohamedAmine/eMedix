from datetime import datetime
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
import os
from Dto.logindto import LoginRequest, ResetPasswordRequest, ResetPassword
from dotenv import load_dotenv
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
import smtplib
import bcrypt
from datetime import datetime, timedelta
import jwt
from sqlalchemy.orm import Session
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Body
from database import get_db
from models.users import User
from models.patients import Patient
from models.medecins import Medecin
from models.admins import Admin
from pydantic import BaseModel
from typing import Optional
from Dto.userdto import UserRequest
from models.users import User
import shutil
from uuid import uuid4
from google.oauth2 import id_token
from google.auth.transport import requests

load_dotenv()
router = APIRouter()

def hash_password(password: str) -> str:
    hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
    return hashed_password.decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

# JWT token generation for email verification
def generate_verification_token(email: str) -> str:
    secret_key = os.getenv("SECRET_KEY")
    expiration_time = datetime.utcnow() + timedelta(hours=1)  # Corrected this line
    token = jwt.encode({"sub": email, "exp": expiration_time}, secret_key, algorithm="HS256")
    return token


from datetime import datetime

@router.post("/register/")
async def register(
    nom: str = Form(...),
    prenom: str = Form(...),
    telephone: str = Form(...),
    email: str = Form(...),
    password: str = Form(...),
    role: str = Form(...),
    isverified: bool = Form(False),
    photo: Optional[UploadFile] = File(None),
    date_naissance: Optional[str] = Form(None),
    adresse: Optional[str] = Form(None),
    diplome: Optional[str] = Form(None),
    grade: Optional[str] = Form(None),
    annee_experience: Optional[int] = Form(None),
    db: AsyncSession = Depends(get_db)
):
    # Handle file upload if photo is provided
    photo_path = None
    if photo:
        # Create uploads directory if it doesn't exist
        upload_dir = os.path.join("static", "uploads")
        os.makedirs(upload_dir, exist_ok=True)
        
        # Generate unique filename
        file_extension = os.path.splitext(photo.filename)[1]
        unique_filename = f"{uuid4()}{file_extension}"
        file_path = os.path.join(upload_dir, unique_filename)
        
        # Save the file
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(photo.file, buffer)
        
        # Store the relative path to be saved in the database
        photo_path = f"/static/uploads/{unique_filename}"
    
    # Hash the password
    hashed_password = hash_password(password)

    # Create the user record in the database
    db_user = User(
        nom=nom,
        prenom=prenom,
        telephone=telephone,
        email=email,
        password=hashed_password,
        role=role,
        isverified=isverified,  # Default is False
        photo=photo_path
    )

    try:
        db.add(db_user)
        await db.commit()  # Use await with async session
        await db.refresh(db_user)  # Refresh the user object after commit
    except Exception as e:
        await db.rollback()  # Rollback if something goes wrong
        raise HTTPException(status_code=500, detail=f"Failed to add user: {str(e)}")

    # Create Role-specific entry based on the user's role
    if role == 'patient':
        if not date_naissance:
            raise HTTPException(status_code=400, detail="Date of birth is required for patients")
        
        # Convert the date_naissance to a datetime.date object
        try:
            date_naissance_obj = datetime.strptime(date_naissance, "%Y-%m-%d").date()
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD.")
        
        # Create patient details
        patient = Patient(user_id=db_user.id, date_naissance=date_naissance_obj)
        try:
            db.add(patient)
            await db.commit()  # Async commit for patient
        except Exception as e:
            await db.rollback()
            raise HTTPException(status_code=500, detail=f"Failed to add patient details: {str(e)}")
    elif role == 'medecin':
        if not (adresse and diplome and grade and annee_experience):
            raise HTTPException(status_code=400, detail="All medical details are required for medecin")
        medecin = Medecin(
            user_id=db_user.id,
            adresse=adresse,
            diplome=diplome,
            grade=grade,
            annee_experience=annee_experience
        )
        try:
            db.add(medecin)
            await db.commit()  # Async commit for medecin
        except Exception as e:
            await db.rollback()
            raise HTTPException(status_code=500, detail=f"Failed to add medecin details: {str(e)}")
    elif role == 'admin':
        admin = Admin(user_id=db_user.id)
        try:
            db.add(admin)
            await db.commit()  # Async commit for admin
        except Exception as e:
            await db.rollback()
            raise HTTPException(status_code=500, detail=f"Failed to add admin details: {str(e)}")
    else:
        raise HTTPException(status_code=400, detail="Invalid role")

    token = generate_verification_token(email)

    # Send verification email
    send_verification_email(email, token)
    return {"message": "User registered successfully"}



@router.get("/verify/{token}")
async def verify_email(token: str, db: AsyncSession = Depends(get_db)):
    try:
        # Decode the JWT token
        secret_key = os.getenv("SECRET_KEY")
        payload = jwt.decode(token, secret_key, algorithms=["HS256"])

        # Get the email from the payload
        email = payload["sub"]

        # Query the User table
        result = await db.execute(select(User).filter(User.email == email))
        user = result.scalars().first()

        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        # Update user's status to verified
        user.isverified = True
        
        # Add the updated user to the session and commit
        db.add(user)
        await db.commit()

        return {"message": "Email verified successfully"}

    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=400, detail="Verification token has expired")
    except jwt.exceptions.DecodeError:
        raise HTTPException(status_code=400, detail="Invalid verification token")
    except Exception as e:
        await db.rollback()  # Rollback in case of any error
        print(f"Error: {e}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")



def send_verification_email(to_email: str, token: str):
    sender_email = os.getenv("EMAIL_SENDER")
    sender_password = os.getenv("EMAIL_PASSWORD")
    smtp_server = os.getenv("SMTP_SERVER")
    smtp_port = int(os.getenv("SMTP_PORT"))

    if not sender_email or not sender_password:
        raise HTTPException(status_code=500, detail="Email credentials are not set in .env")

    subject = "Email Verification"
    body = f"Click on the following link to verify your email: http://localhost:8000/auth/verify/{token}"

    msg = MIMEMultipart()
    msg["From"] = sender_email
    msg["To"] = to_email
    msg["Subject"] = subject
    msg.attach(MIMEText(body, "plain"))

    try:
        with smtplib.SMTP(smtp_server, smtp_port) as server:
            server.starttls()  # Secure the connection
            server.login(sender_email, sender_password)
            server.sendmail(sender_email, to_email, msg.as_string())
        print(f"Verification email sent to {to_email}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to send email: {e}")


def generate_jwt_token(email: str) -> str:
    secret_key = os.getenv("SECRET_KEY")
    expiration_time = datetime.utcnow() + timedelta(hours=1)  # Token will expire in 1 hour
    token = jwt.encode({"sub": email, "exp": expiration_time}, secret_key, algorithm="HS256")
    return token

from sqlalchemy.orm import joinedload

@router.post("/login")
async def login(user: LoginRequest, db: AsyncSession = Depends(get_db)):
    try:
        result = await db.execute(select(User).filter(User.email == user.email).options(joinedload(User.patient), joinedload(User.medecin), joinedload(User.admin)))
        db_user = result.scalars().first()

        if not db_user:
            raise HTTPException(status_code=404, detail="User not found")

        if not verify_password(user.password, db_user.password):
            raise HTTPException(status_code=401, detail="Invalid credentials")

        if not db_user.isverified:
            raise HTTPException(status_code=400, detail="Email not verified")

        token = generate_jwt_token(user.email)

        # Common user fields
        user_data = {
            "id": db_user.id,
            "nom": db_user.nom,
            "prenom": db_user.prenom,
            "email": db_user.email,
            "telephone": db_user.telephone,
            "role": db_user.role,
            "photo": db_user.photo,
            "access_token": token
        }

        # Role-specific data
        if db_user.role == "patient" and db_user.patient:
            user_data.update({
                "patient_id": db_user.patient.id,  # Add patient ID
                "date_naissance": db_user.patient.date_naissance
    })


        elif db_user.role == "medecin" and db_user.medecin:
            user_data.update({
                "medecin_id": db_user.medecin.id,  # Add medecin
                "adresse": db_user.medecin.adresse,
                "diplome": db_user.medecin.diplome,
                "grade": db_user.medecin.grade,
                "annee_experience": db_user.medecin.annee_experience
            })

        elif db_user.role == "admin" and db_user.admin:
            user_data.update({
                "admin_id": db_user.admin.id
            })

        return user_data

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Veuillez vérifier vos identifiants")

    

def generate_reset_token(email: str) -> str:
    secret_key = os.getenv("SECRET_KEY")
    expiration_time = datetime.utcnow() + timedelta(hours=1)  # Token expires in 1 hour
    token = jwt.encode({"sub": email, "exp": expiration_time}, secret_key, algorithm="HS256")
    return token


def send_reset_email(to_email: str, token: str):
    sender_email = os.getenv("EMAIL_SENDER")
    sender_password = os.getenv("EMAIL_PASSWORD")
    smtp_server = os.getenv("SMTP_SERVER")
    smtp_port = int(os.getenv("SMTP_PORT"))

    subject = "Password Reset Request"
    body = f"Click on the following link to reset your password: http://localhost:3000/reset-password/{token}"

    msg = MIMEMultipart()
    msg["From"] = sender_email
    msg["To"] = to_email
    msg["Subject"] = subject
    msg.attach(MIMEText(body, "plain"))

    try:
        with smtplib.SMTP(smtp_server, smtp_port) as server:
            server.starttls()  # Secure the connection
            server.login(sender_email, sender_password)
            server.sendmail(sender_email, to_email, msg.as_string())
        print(f"Password reset email sent to {to_email}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to send email: {e}")

# Request reset password
@router.post("/request-reset-password")
async def request_reset_password(data: ResetPasswordRequest, db: AsyncSession = Depends(get_db)):
    # Get the user from the database by email
    try:
        result = await db.execute(select(User).filter(User.email == data.email))
        db_user = result.scalars().first()

        if not db_user:
            raise HTTPException(status_code=404, detail="User not found")

        # Generate reset token
        token = generate_reset_token(data.email)

        # Send reset email
        send_reset_email(data.email, token)

        return {"message": "Password reset email sent"}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to request password reset: {str(e)}")




@router.post("/reset-password")
async def reset_password(data: ResetPassword, db: AsyncSession = Depends(get_db)):
    try:
        # Decode the token to get the email
        secret_key = os.getenv("SECRET_KEY")
        payload = jwt.decode(data.token, secret_key, algorithms=["HS256"])

        # Get the email from the token
        email = payload["sub"]

        # Check if the token has expired
        expiration_time = payload["exp"]
        if datetime.utcnow() > datetime.utcfromtimestamp(expiration_time):
            raise HTTPException(status_code=400, detail="Password reset token has expired")

        # Get the user by email
        result = await db.execute(select(User).filter(User.email == email))
        db_user = result.scalars().first()

        if not db_user:
            raise HTTPException(status_code=404, detail="User not found")

        # Hash the new password
        hashed_password = hash_password(data.new_password)

        # Update the password
        db_user.password = hashed_password
        db.add(db_user)
        await db.commit()

        return {"message": "Password reset successfully"}

    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=400, detail="Password reset token has expired")
    except jwt.exceptions.DecodeError:
        raise HTTPException(status_code=400, detail="Invalid reset token")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to reset password: {str(e)}")

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")

@router.post("/google")
async def google_auth(token: str = Body(...), db: AsyncSession = Depends(get_db)):
    try:
        # Verify the Google token
        idinfo = id_token.verify_oauth2_token(token, requests.Request(), GOOGLE_CLIENT_ID)

        if idinfo['iss'] not in ['accounts.google.com', 'https://accounts.google.com']:
            raise ValueError('Wrong issuer.')

        # Extract user info from the token
        user_email = idinfo['email']
        user_name = idinfo['name']
        
        # Check if user exists
        result = await db.execute(select(User).filter(User.email == user_email))
        user = result.scalars().first()

        if not user:
            # Create new user
            user = User(
                email=user_email,
                nom=user_name.split()[0] if len(user_name.split()) > 1 else user_name,
                prenom=user_name.split()[1] if len(user_name.split()) > 1 else "",
                role='patient',
                isverified=True ,
                telephone = 23117094, # Google accounts are considered verified
                date_naissance = "2003-06-24"
            )
            db.add(user)
            await db.commit()
            await db.refresh(user)

            # Create patient record
            patient = Patient(user_id=user.id)
            db.add(patient)
            await db.commit()

        # Generate JWT token for the user
        access_token = generate_jwt_token(user_email)

        return {"access_token": access_token, "token_type": "bearer"}

    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid token")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

