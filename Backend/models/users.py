from sqlalchemy import Column, Integer, String, Boolean, Date, ForeignKey
from sqlalchemy.orm import relationship
from database import Base

class User(Base):
    __tablename__ = 'users'

    id = Column(Integer, primary_key=True, index=True)
    nom = Column(String(50), nullable=False)
    prenom = Column(String(50), nullable=False)
    telephone = Column(String(20), nullable=False)
    email = Column(String(100), unique=True, nullable=False)
    password = Column(String(255), nullable=False)
    isverified = Column(Boolean, default=False)
    photo = Column(String(1000))
    role = Column(String(20), nullable=False)

    # Use string literals for relationship definitions
    patient = relationship("Patient", back_populates="user", uselist=False)
    medecin = relationship("Medecin", back_populates="user", uselist=False)
    admin = relationship("Admin", back_populates="user", uselist=False)
