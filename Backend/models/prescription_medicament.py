from sqlalchemy import Table, Column, Integer, ForeignKey
from database import Base

prescription_medicament = Table(
    'prescription_medicament',
    Base.metadata,
    Column('prescription_id', Integer, ForeignKey('prescriptions.id', ondelete='CASCADE')),
    Column('medicament_id', Integer, ForeignKey('medicaments.id', ondelete='CASCADE'))
)
