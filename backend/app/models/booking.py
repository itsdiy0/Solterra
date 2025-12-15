from sqlalchemy import Column, String, DateTime, Time, Index
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy import ForeignKey
import uuid
from datetime import datetime

from app.database import Base


class Booking(Base):
    __tablename__ = "bookings"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    participant_id = Column(UUID(as_uuid=True), ForeignKey("participants.id", ondelete="CASCADE"), nullable=False, index=True)
    event_id = Column(UUID(as_uuid=True), ForeignKey("events.id", ondelete="CASCADE"), nullable=False, index=True)
    booking_reference = Column(String(20), unique=True, nullable=False, index=True)
    booking_status = Column(String(50), default="confirmed", index=True)
    booked_at = Column(DateTime, default=datetime.utcnow)
    cancelled_at = Column(DateTime, nullable=True)
    test_result = relationship("TestResult", back_populates="booking", uselist=False)
    time_slot_start = Column(Time, nullable=True)
    time_slot_end = Column(Time, nullable=True)
    
    # Relationships
    participant = relationship("Participant", back_populates="bookings")
    event = relationship("Event", back_populates="bookings")

    # Partial unique constraint: One participant can only have ONE ACTIVE booking per event
    __table_args__ = (
        Index(
            'unique_active_participant_event',
            'participant_id',
            'event_id',
            unique=True,
            postgresql_where=(booking_status != 'cancelled')
        ),
    )

    def __repr__(self):
        return f"<Booking {self.booking_reference} - {self.booking_status}>"