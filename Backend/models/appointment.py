from sqlalchemy import Column, Integer, String, Date, ForeignKey
from sqlalchemy.orm import relationship
from database import Base

class Appointment(Base):
    __tablename__ = 'appointments'

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey('patients.id'))
    medcin_id = Column(Integer, ForeignKey('medcins.id'))
    date = Column(Date)
    status = Column(String, default="en attente")
    note = Column(String, nullable=True)

    # Fix the relationship definitions using strings to avoid circular imports
    patient = relationship("Patient", back_populates="appointments")
    medicin = relationship("Medcin", back_populates="appointments")