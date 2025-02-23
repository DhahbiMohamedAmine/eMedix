from sqlalchemy.ext.declarative import declarative_base # type: ignore
from sqlalchemy import Column, Integer, String, Boolean, Date # type: ignore

Base = declarative_base()

class Medcin(Base):
    __tablename__ = "medcins"

    id = Column(Integer, primary_key=True, index=True)
    cin = Column(String, unique=True, index=True)
    nom = Column(String)
    prenom = Column(String)
    telephone = Column(String)
    email = Column(String, unique=True, index=True)
    password = Column(String)
    isverified = Column(Boolean, default=False)
    degree = Column(String)
    grade = Column(String)
    experience = Column(Integer)
    