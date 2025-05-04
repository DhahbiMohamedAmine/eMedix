from sqlalchemy import Column, DateTime, Float, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime

from database import Base

class Billing(Base):
    __tablename__ = "billing"

    id = Column(Integer, primary_key=True, index=True)
    cart_id = Column(Integer, ForeignKey("carts.id", ondelete="SET NULL"), nullable=True)
    amount = Column(Float)
    payment_method = Column(String)
    date = Column(DateTime, default=datetime.utcnow)

    cart = relationship("Cart")
