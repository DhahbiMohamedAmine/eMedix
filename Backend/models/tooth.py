from sqlalchemy import Column, Integer, String, Date, ForeignKey, Text
from sqlalchemy.orm import relationship
from database import Base

class Tooth(Base):
    __tablename__ = "teeth"
    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id", ondelete="CASCADE"))
    tooth_code = Column(String(10))
    tooth_name = Column(String(100))
    note = Column(Text, default="")
    status = Column(String, nullable=False)

    patient = relationship("Patient", back_populates="teeth")