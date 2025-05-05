from sqlalchemy import Column, Integer, Float, ForeignKey
from sqlalchemy.orm import relationship

from database import Base

class Cart(Base):
    __tablename__ = "carts"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id", ondelete="CASCADE"))
    total_price = Column(Float, default=0.0)

    patient = relationship("Patient", backref="carts")
from models.cart_medicament import cart_medicament  # 👈 This must be before the relationship is used

medicaments = relationship("Medicament", secondary=cart_medicament, backref="carts")
