from sqlalchemy import Column, DateTime, Integer, String, ForeignKey, Date, Text
from sqlalchemy.orm import relationship
from database import Base  # Assuming Base is from your database setup

class Appointment(Base):
    __tablename__ = 'appointments'

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey('patients.id'), nullable=False)
    medecin_id = Column(Integer, ForeignKey('medecins.id'), nullable=False)
    date = Column(DateTime, nullable=False)
    status = Column(String, nullable=False)
    note = Column(Text, nullable=True)

    # Relationships
    patient = relationship("Patient", back_populates="appointments")
    medecin = relationship("Medecin", back_populates="appointments")
