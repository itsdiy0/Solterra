from sqlalchemy import Column, String, Integer, Date, Time, Text, DateTime, Numeric
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy import ForeignKey
import uuid
from datetime import datetime

from app.database import Base


class Event(Base):
    __tablename__ = "events"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    event_date = Column(Date, nullable=False, index=True)
    event_time = Column(Time, nullable=False)
    address = Column(Text, nullable=False)
    latitude = Column(Numeric(10, 8))
    longitude = Column(Numeric(11, 8))
    total_slots = Column(Integer, nullable=False)
    available_slots = Column(Integer, nullable=False)
    additional_info = Column(Text)
    status = Column(String(50), default="published", index=True)
    created_by = Column(UUID(as_uuid=True), ForeignKey("admins.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    creator = relationship("Admin", back_populates="events", foreign_keys=[created_by])
    bookings = relationship("Booking", back_populates="event", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Event {self.name} on {self.event_date}>"