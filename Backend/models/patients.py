from sqlalchemy import Column, Integer, String, Date, Boolean
from sqlalchemy.orm import relationship
from database import Base

class Patient(Base):
    __tablename__ = 'patients'

    id = Column(Integer, primary_key=True, index=True)
    nom = Column(String, index=True)
    prenom = Column(String, index=True)
    telephone = Column(String)
    email = Column(String, unique=True, index=True)
    password = Column(String)
    isverified = Column(Boolean, default=False)
    date_de_naissance = Column(Date)
    photo = Column(String, nullable=True)

    # Add the back reference to appointments
    appointments = relationship("Appointment", back_populates="patient")
