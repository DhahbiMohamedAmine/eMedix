from sqlalchemy.ext.declarative import declarative_base # type: ignore
from sqlalchemy import Column, Integer, String, Boolean, Date # type: ignore

Base = declarative_base()

# Admin Model
class Admin(Base):
    __tablename__ = "admins"

    id = Column(Integer, primary_key=True, index=True)
    cin = Column(String, unique=True, index=True)
    nom = Column(String)
    prenom = Column(String)
    telephone = Column(String)
    email = Column(String, unique=True, index=True)
    password = Column(String)
    isverified = Column(Boolean, default=False)