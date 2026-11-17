from sqlalchemy import Column, String, Float, Boolean, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
import uuid
from app.core.database import Base


class Coin(Base):
    __tablename__ = "coins"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    symbol = Column(String, nullable=False, unique=True, index=True)
    name = Column(String, nullable=False)
    price = Column(Float, nullable=True)
    change_24h = Column(Float, nullable=True)
    volume_24h = Column(Float, nullable=True)
    market_cap = Column(Float, nullable=True)
    dominance = Column(Float, nullable=True)
    is_tracked = Column(Boolean, default=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
