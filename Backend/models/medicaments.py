from sqlalchemy import Column, Integer, String, Text
from database import Base

class Medicament(Base):
    __tablename__ = 'medicaments'

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, unique=True)
    description = Column(Text, nullable=True)
    dosage = Column(String(255), nullable=True)