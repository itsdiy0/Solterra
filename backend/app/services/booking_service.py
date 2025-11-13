import random
import string
from sqlalchemy.orm import Session
from sqlalchemy import func
from fastapi import HTTPException
from app.models import Booking, Event
from app.services.sms_service import (
    send_booking_confirmation_sms,
    send_booking_cancellation_sms,
)


def generate_booking_reference(length: int = 6) -> str:
    """Generate a unique booking reference like ROSE-XXXXXX"""
    code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=length))
    return f"ROSE-{code}"


def create_booking(db: Session, participant_id: str, participant_phone: str, event_id: str) -> Booking:
    """
    Create a booking atomically and send mock SMS confirmation.
    """
    try:
        # Lock event row to prevent race conditions
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

        # Generate unique booking reference
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

        # Send booking confirmation (mock mode)
        send_booking_confirmation_sms(
            phone=participant_phone,
            booking_details={
                "event_name": event.name,
                "date": str(event.event_date),
                "time": str(event.event_time),
                "ref": booking_ref,
            },
            mock=True  # 👈 if true SMS will only log to console, not send for real
        )

        return booking

    except Exception as e:
        db.rollback()
        raise e


def cancel_booking(db: Session, booking_id: str, participant_phone: str) -> Booking:
    """
    Cancel a booking atomically and send mock cancellation SMS.
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

        # Update booking + release slot
        booking.booking_status = "cancelled"
        booking.cancelled_at = func.now()
        event.available_slots += 1

        db.commit()
        db.refresh(booking)

        # Send cancellation SMS (mock mode)
        send_booking_cancellation_sms(
            phone=participant_phone,
            booking_ref=booking.booking_reference,
            mock=True  # 👈 if true its still mock mode
        )

        return booking

    except Exception as e:
        db.rollback()
        raise e
