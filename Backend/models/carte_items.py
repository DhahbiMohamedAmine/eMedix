from sqlalchemy import Table, Column, Integer, ForeignKey

from database import Base

cart_medicament = Table(
    "cart_items",
    Base.metadata,
    Column("cart_id", Integer, ForeignKey("carts.id", ondelete="CASCADE"), primary_key=True),
    Column("medicament_id", Integer, ForeignKey("medicaments.id", ondelete="CASCADE"), primary_key=True),
    Column("quantity", Integer, nullable=False, default=1)
)
