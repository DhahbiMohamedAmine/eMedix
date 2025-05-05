from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from database import Base


class Medecin(Base):
    __tablename__ = 'medecins'

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), unique=True)
    adresse = Column(String(255))
    diplome = Column(String(100))
    grade = Column(String(50))
    ville = Column(String(100))

    user = relationship("User", back_populates="medecin")
    appointments = relationship("Appointment", back_populates="medecin")