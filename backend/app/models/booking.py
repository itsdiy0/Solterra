from sqlalchemy import Column, String, DateTime, UniqueConstraint
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

    # Relationships
    participant = relationship("Participant", back_populates="bookings")
    event = relationship("Event", back_populates="bookings")

    # Constraint: One participant can only book one slot per event
    __table_args__ = (
        UniqueConstraint('participant_id', 'event_id', name='unique_participant_event'),
    )

    def __repr__(self):
        return f"<Booking {self.booking_reference} - {self.booking_status}>"