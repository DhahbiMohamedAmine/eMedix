# models/prescriptions.py
from sqlalchemy import Column, Integer, ForeignKey, Text, DateTime
from sqlalchemy.orm import relationship
from database import Base

class Prescription(Base):
    __tablename__ = "prescriptions"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"))
    medecin_id = Column(Integer, ForeignKey("medecins.id"))
    date = Column(DateTime, nullable=False)
    content = Column(Text, nullable=True)
    medicament_id = Column(Integer, ForeignKey("medicaments.id"))
    dosage = Column(Text, nullable=True)
    duration = Column(Text, nullable=True)

    # Relationships
    patient = relationship("Patient", back_populates="prescriptions")
    medecin = relationship("Medecin", back_populates="prescriptions")
    medicament = relationship("Medicament")  # <- this line links to Medicament
