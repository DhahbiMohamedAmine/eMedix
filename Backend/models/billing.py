from datetime import datetime
from sqlalchemy import Column, DateTime, Float, Integer, String, ForeignKey, Date, Text
from sqlalchemy.orm import relationship
from database import Base  # Assuming Base is from your database setup

class Billing(Base):
    __tablename__ = "billing"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(String, unique=True, index=True)
    amount = Column(Float)
    payment_method = Column(String)
    date = Column(DateTime, default=datetime.utcnow)
