import random
import string
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from sqlalchemy import func
from fastapi import HTTPException, status
from app.models import Booking, Event, Participant


def generate_booking_reference(length: int = 6) -> str:
    """Generate a unique booking reference like ROSE-XXXXXX"""
    code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=length))
    return f"ROSE-{code}"

#print(generate_booking_reference())


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


def cancel_booking(db: Session, booking_id: str) -> Booking:
    """
    Cancel a booking and release the slot
    """
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    if booking.booking_status == "cancelled":
        raise HTTPException(status_code=400, detail="Booking already cancelled")

    # Lock the event row to safely increment slot
    event = db.query(Event).filter(Event.id == booking.event_id).with_for_update().first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    booking.booking_status = "cancelled"
    booking.cancelled_at = func.now() 
    event.available_slots += 1

    db.commit()
    db.refresh(booking)
    return booking


