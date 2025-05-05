from sqlalchemy import Column, Integer, Date, ForeignKey
from sqlalchemy.orm import relationship
from database import Base

class Patient(Base):
    __tablename__ = 'patients'

    id = Column(Integer, primary_key=True, index=True,autoincrement=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), unique=True)
    date_naissance = Column(Date)

    user = relationship("User", back_populates="patient")
    appointments = relationship("Appointment", back_populates="patient")
    teeth = relationship("Tooth", back_populates="patient", cascade="all, delete")