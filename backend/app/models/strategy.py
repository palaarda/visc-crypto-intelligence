from sqlalchemy import Column, String, Float, Boolean, Integer, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
import uuid
from app.core.database import Base


class Strategy(Base):
    __tablename__ = "strategies"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    name = Column(String, nullable=False, unique=True)
    description = Column(String, nullable=True)
    type = Column(String, nullable=False)
    is_active = Column(Boolean, default=False)
    win_rate = Column(Float, default=0.0)
    total_signals = Column(Integer, default=0)
    icon = Column(String, default="Activity")
    config = Column(String, nullable=True)  # JSON config
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
