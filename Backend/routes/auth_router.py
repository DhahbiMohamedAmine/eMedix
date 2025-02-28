import bcrypt
import jwt
import datetime
import smtplib
from models.patientModel import patientcreate
from models.patients import Patient
from fastapi import APIRouter, HTTPException, Depends
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from pydantic import BaseModel
from datetime import date
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from database import get_db
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

router = APIRouter()

class LoginRequest(BaseModel):
    email: str
    password: str

class ResetPasswordRequest(BaseModel):
    email: str

class ResetPassword(BaseModel):
    new_password: str

# Hashing and password verification functions
def hash_password(password: str) -> str:
    hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
    return hashed_password.decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

# JWT token generation for email verification
def generate_verification_token(email: str) -> str:
    secret_key = os.getenv("SECRET_KEY")
    expiration_time = datetime.datetime.utcnow() + datetime.timedelta(hours=1)
    token = jwt.encode({"sub": email, "exp": expiration_time}, secret_key, algorithm="HS256")
    return token

# JWT token generation for password reset
def generate_reset_token(email: str) -> str:
    secret_key = os.getenv("SECRET_KEY")
    expiration_time = datetime.datetime.utcnow() + datetime.timedelta(hours=1)
    token = jwt.encode({"sub": email, "exp": expiration_time}, secret_key, algorithm="HS256")
    return token

# Function to send password reset email
def send_reset_email(to_email: str, token: str):
    sender_email = os.getenv("EMAIL_SENDER")
    sender_password = os.getenv("EMAIL_PASSWORD")
    smtp_server = os.getenv("SMTP_SERVER")
    smtp_port = int(os.getenv("SMTP_PORT"))

    if not sender_email or not sender_password:
        raise HTTPException(status_code=500, detail="Email credentials are not set in .env")

    subject = "Password Reset Request"
    body = f"Click on the following link to reset your password: http://localhost:3000/reset-password/{token}"

    msg = MIMEMultipart()
    msg["From"] = sender_email
    msg["To"] = to_email
    msg["Subject"] = subject
    msg.attach(MIMEText(body, "plain"))

    try:
        with smtplib.SMTP(smtp_server, smtp_port) as server:
            server.starttls()
            server.login(sender_email, sender_password)
            server.sendmail(sender_email, to_email, msg.as_string())
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to send email: {e}")

# Route to handle signup
@router.post("/signup")
async def signup(user: patientcreate, db: AsyncSession = Depends(get_db)):
    try:
        # Check if email already exists
        query_email = select(Patient).filter(Patient.email == user.email)  # Use Patient here
        result_email = await db.execute(query_email)
        db_user_email = result_email.scalar_one_or_none()

        if db_user_email:
            raise HTTPException(status_code=400, detail="Email is already registered")

        # Create a new user entry based on the Pydantic model data
        hashed_password = hash_password(user.password)
        new_user = Patient(  # Create an instance of the Patient SQLAlchemy model
            nom=user.nom,
            prenom=user.prenom,
            telephone=user.telephone,
            email=user.email,
            password=hashed_password,
            date_de_naissance=user.date_de_naissance,
            photo=user.photo
        )

        db.add(new_user)  # Add the Patient model object to the session
        await db.commit()

        # Generate the verification token
        verification_token = generate_verification_token(user.email)

        # Send the verification email
        send_verification_email(user.email, verification_token)

        return {"message": "User created successfully. Please check your email for verification."}

    except Exception as e:
        # Log the full exception for debugging
        print(f"Error during sign-up: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")

# Route to verify email
@router.get("/verify/{token}")
async def verify_email(token: str, db: AsyncSession = Depends(get_db)):
    try:
        secret_key = os.getenv("SECRET_KEY")
        decoded_token = jwt.decode(token, secret_key, algorithms=["HS256"])
        email = decoded_token["sub"]

        # Find the user by email using the SQLAlchemy model
        query = select(Patient).filter(Patient.email == email)  # Use Patient here
        result = await db.execute(query)
        db_user = result.scalar_one_or_none()

        if not db_user:
            raise HTTPException(status_code=404, detail="User not found")

        # Mark the user as verified
        db_user.isverified = True
        await db.commit()

        return {"message": "Email verified successfully"}

    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=400, detail="Verification token has expired")
    except Exception as e:
        print(f"Error during email verification: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")

# Login Route
@router.post("/login")
async def login(user: LoginRequest, db: AsyncSession = Depends(get_db)):
    try:
        # Find the user by email
        query = select(Patient).filter(Patient.email == user.email)  # Use Patient here
        result = await db.execute(query)
        db_user = result.scalar_one_or_none()

        if not db_user:
            raise HTTPException(status_code=400, detail="Invalid email or password")

        # Check if the user is verified (you'll need to add this field to UserCreate)
        if not getattr(db_user, 'isverified', False):
            raise HTTPException(status_code=400, detail="Email is not verified")

        # Verify the password
        if not verify_password(user.password, db_user.password):
            raise HTTPException(status_code=400, detail="Invalid email or password")

        # Generate JWT token
        access_token = create_access_token(data={"sub": user.email})

        return {"access_token": access_token, "token_type": "bearer"}

    except Exception as e:
        print(f"Error during login: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")

def create_access_token(data: dict, secret_key: str = None, expiration_minutes: int = 30):
    if not secret_key:
        secret_key = os.getenv("SECRET_KEY")
    
    expiration = datetime.datetime.utcnow() + datetime.timedelta(minutes=expiration_minutes)
    to_encode = {"exp": expiration, **data}
    encoded_jwt = jwt.encode(to_encode, secret_key, algorithm="HS256")
    return encoded_jwt

# Function to send verification email
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
            server.starttls()
            server.login(sender_email, sender_password)
            server.sendmail(sender_email, to_email, msg.as_string())
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to send email: {e}")



@router.post("/request-reset-password")
async def request_reset_password(request: ResetPasswordRequest, db: AsyncSession = Depends(get_db)):
    try:
        email = request.email
        
        # Find the user by email
        query = select(Patient).filter(Patient.email == email)
        result = await db.execute(query)
        db_user = result.scalar_one_or_none()

        if not db_user:
            raise HTTPException(status_code=400, detail="Email not found")

        # Generate the reset token
        reset_token = generate_reset_token(email)

        # Send the reset email
        send_reset_email(email, reset_token)

        return {"message": "Password reset email has been sent. Please check your inbox."}

    except Exception as e:
        print(f"Error during reset password request: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")


    except Exception as e:
        print(f"Error during password reset request: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")
@router.post("/reset-password/{token}")
async def reset_password(
    token: str, 
    reset_data: ResetPassword,  # Receive the new password in the request body
    db: AsyncSession = Depends(get_db)
):
    try:
        # Decode the token to get the email
        secret_key = os.getenv("SECRET_KEY")
        decoded_token = jwt.decode(token, secret_key, algorithms=["HS256"])
        email = decoded_token["sub"]

        # Find the user by email
        query = select(Patient).filter(Patient.email == email)
        result = await db.execute(query)
        db_user = result.scalar_one_or_none()

        if not db_user:
            raise HTTPException(status_code=404, detail="User not found")

        # Hash the new password
        hashed_password = hash_password(reset_data.new_password)

        # Update the user's password
        db_user.password = hashed_password
        await db.commit()

        return {"message": "Password reset successfully."}

    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=400, detail="Password reset token has expired")
    except jwt.JWTError:
        raise HTTPException(status_code=400, detail="Invalid token")
    except Exception as e:
        print(f"Error during password reset: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")