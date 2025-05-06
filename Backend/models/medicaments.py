from sqlalchemy import Column, Integer, String, Text, Float
from sqlalchemy.orm import relationship
from database import Base


class Medicament(Base):
    __tablename__ = 'medicaments'

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, unique=True)
    description = Column(Text, nullable=True)
    price = Column(Float, nullable=True)
    dosage = Column(String(100), nullable=False)
    duration = Column(String(100), nullable=False)
    stock= Column(Integer, nullable=False)
    # Relationships
    prescriptions = relationship("Prescription", secondary="prescription_medicament", back_populates="medicaments")