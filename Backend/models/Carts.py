from sqlalchemy import Boolean, Column, Integer, Float, ForeignKey
from sqlalchemy.orm import relationship

from database import Base

class Cart(Base):
    __tablename__ = "carts"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id", ondelete="CASCADE"))
    total_price = Column(Float, default=0.0)
    is_paid = Column(Boolean, default=False)  # Add this column
    patient = relationship("Patient", backref="carts")
from models.carte_items import cart_medicament  # 👈 This must be before the relationship is used
medicaments = relationship("Medicament", secondary=cart_medicament, backref="carts")

