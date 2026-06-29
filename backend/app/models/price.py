from sqlalchemy import Column, String, Numeric, DateTime, ForeignKey, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import UUID
from app.database import Base
import uuid


class Price(Base):
    __tablename__ = "prices"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    station_id = Column(UUID(as_uuid=True), ForeignKey("stations.id", ondelete="CASCADE"), nullable=False)
    fuel_type = Column(String(20), nullable=False)
    price = Column(Numeric(10, 2), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    updated_by = Column(String(100), default="anonymous")

    __table_args__ = (
        UniqueConstraint("station_id", "fuel_type", name="uq_station_fuel"),
    )
