import random
import string
from sqlalchemy.orm import Session
from sqlalchemy import func
from fastapi import HTTPException
from app.models import Booking, Event


def generate_booking_reference(length: int = 6) -> str:
    """Generate a unique booking reference like ROSE-XXXXXX"""
    code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=length))
    return f"ROSE-{code}"


def create_booking(db: Session, participant_id: str, event_id: str) -> Booking:
    """
    Create a booking atomically.
    
    Raises HTTPException if:
    - Event not found
    - Participant already booked this event
    - No slots available
    """
    try:
        # Lock the event row to prevent race conditions
        event = db.query(Event).filter(Event.id == event_id).with_for_update().first()
        if not event:
            raise HTTPException(status_code=404, detail="Event not found")

        # Check duplicate booking
        existing = db.query(Booking).filter_by(
            participant_id=participant_id,
            event_id=event_id
        ).first()
        if existing:
            raise HTTPException(status_code=400, detail="Participant already booked this event")

        # Check slot availability
        if event.available_slots <= 0:
            raise HTTPException(status_code=400, detail="No slots available")

        # Decrement available slots
        event.available_slots -= 1

        # Generate unique booking reference with retry logic
        booking_ref = None
        for _ in range(5):
            ref = generate_booking_reference()
            if not db.query(Booking).filter_by(booking_reference=ref).first():
                booking_ref = ref
                break

        if not booking_ref:
            raise HTTPException(status_code=500, detail="Failed to generate unique booking reference")

        # Create booking
        booking = Booking(
            participant_id=participant_id,
            event_id=event_id,
            booking_reference=booking_ref,
            booking_status="confirmed"
        )
        db.add(booking)
        db.commit()
        db.refresh(booking)
        return booking

    except Exception as e:
        db.rollback()
        raise e


def cancel_booking(db: Session, booking_id: str) -> Booking:
    """
    Cancel a booking atomically and release the slot.
    """
    try:
        booking = db.query(Booking).filter(Booking.id == booking_id).first()
        if not booking:
            raise HTTPException(status_code=404, detail="Booking not found")

        if booking.booking_status == "cancelled":
            raise HTTPException(status_code=400, detail="Booking already cancelled")

        event = db.query(Event).filter(Event.id == booking.event_id).with_for_update().first()
        if not event:
            raise HTTPException(status_code=404, detail="Event not found")

        # Update booking and release slot
        booking.booking_status = "cancelled"
        booking.cancelled_at = func.now()
        event.available_slots += 1

        db.commit()
        db.refresh(booking)
        return booking

    except Exception as e:
        db.rollback()
        raise e


def get_user_bookings(db: Session, participant_id: str):
    """
    Get all bookings for a participant, ordered by status and date.
    """
    bookings = (
        db.query(Booking)
        .filter(Booking.participant_id == participant_id)
        .order_by(
            Booking.booking_status.desc(),  # confirmed first
            Booking.booked_at.desc()
        )
        .all()
    )

    active_bookings = [b for b in bookings if b.booking_status == "confirmed"]
    cancelled_bookings = [b for b in bookings if b.booking_status == "cancelled"]

    return {
        "message": f"{len(active_bookings)} active booking(s) found." if active_bookings else "No active bookings found.",
        "active_bookings": active_bookings,
        "cancelled_bookings": cancelled_bookings
    }
