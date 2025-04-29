from sqlalchemy import Column, Integer, String, Text, ForeignKey
from sqlalchemy.orm import relationship
from database import Base
class Prescription(Base):
    __tablename__ = 'prescriptions'

    id = Column(Integer, primary_key=True, index=True)
    appointment_id = Column(Integer, ForeignKey('appointments.id', ondelete='CASCADE'), unique=True)
    content = Column(Text, nullable=False)
    

    # Relationships
    appointment = relationship("Appointment", back_populates="prescriptions")
    medicaments = relationship("Medicament", secondary="prescription_medicament", back_populates="prescriptions")
