import random
import string
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from fastapi import HTTPException, status
from app.models import Booking, Event, Participant


def generate_booking_reference(length: int = 6) -> str:
    """Generate a unique booking reference like ROSE-XXXXXX"""
    code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=length))
    return f"ROSE-{code}"
print(generate_booking_reference())


def create_booking(db: Session, participant_id: str, event_id: str) -> Booking:
    """
    Create a booking atomically with row-level locking.
    
    Raises HTTPException if:
    - Participant already booked this event
    - No slots available
    """
    # Lock the event row to prevent race conditions
    event = db.query(Event).filter(Event.id == event_id).with_for_update().first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    # Check duplicate booking
    existing = db.query(Booking).filter_by(participant_id=participant_id, event_id=event_id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Participant already booked this event")

    # Check slot availability
    if event.available_slots <= 0:
        raise HTTPException(status_code=400, detail="No slots available")

    # Decrement available slots atomically
    event.available_slots -= 1

    # Generate booking
    booking = Booking(
        participant_id=participant_id,
        event_id=event_id,
        booking_reference=generate_booking_reference(),
        booking_status="confirmed"
    )

    db.add(booking)
    try:
        db.commit()
        db.refresh(booking)
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to create booking")

    return booking


