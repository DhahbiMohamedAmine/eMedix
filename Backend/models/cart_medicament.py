# models/cart_medicament.py or wherever it is

from sqlalchemy import Table, Column, Integer, ForeignKey
from database import Base

cart_medicament = Table(
    "cart_medicament",
    Base.metadata,
    Column("cart_id", Integer, ForeignKey("carts.id", ondelete="CASCADE")),
    Column("medicament_id", Integer, ForeignKey("medicaments.id", ondelete="CASCADE")),
)
