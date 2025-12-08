from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.booking import Booking
from app.models.event import Event
from app.models.participant import Participant
from datetime import datetime, time as dt_time
import random
import string
from app.services.sms_service import send_booking_confirmation_sms, send_booking_cancellation_sms


def generate_booking_reference() -> str:
    """Generate unique booking reference"""
    prefix = "ROSE"
    suffix = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
    return f"{prefix}-{suffix}"


def create_booking(
    db: Session,
    participant_id: str,
    participant_phone: str,
    event_id: str,
    time_slot_start: str = None,
    time_slot_end: str = None
) -> Booking:
    """Create a new booking with time slot support"""
    
    # Check if event exists - query by event_code instead of id
    event = db.query(Event).filter(Event.event_code == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    # Check if already booked - use event.id (the actual UUID)
    existing = db.query(Booking).filter(
        Booking.participant_id == participant_id,
        Booking.event_id == event.id,
        Booking.booking_status != "cancelled"
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=400,
            detail="You have already booked this event"
        )
    
    # Handle time slots
    slot_start_time = None
    slot_end_time = None
    
    if event.time_slots:
        # Event has time slots
        if not time_slot_start or not time_slot_end:
            raise HTTPException(
                status_code=400,
                detail="Please select a time slot for this event"
            )
        
        # Find the selected slot
        selected_slot = None
        for slot in event.time_slots:
            if slot['start'] == time_slot_start and slot['end'] == time_slot_end:
                selected_slot = slot
                break
        
        if not selected_slot:
            raise HTTPException(status_code=400, detail="Invalid time slot selected")
        
        if selected_slot['available'] <= 0:
            raise HTTPException(status_code=400, detail="Selected time slot is full")
        
        # Update slot availability
        selected_slot['available'] -= 1
        event.time_slots = event.time_slots  # Trigger SQLAlchemy update
        
        # Convert time strings to time objects
        slot_start_time = datetime.strptime(time_slot_start, "%H:%M").time()
        slot_end_time = datetime.strptime(time_slot_end, "%H:%M").time()
    else:
        # No time slots, check overall capacity
        if event.available_slots <= 0:
            raise HTTPException(status_code=400, detail="Event is fully booked")
        
        event.available_slots -= 1
    
    # Create booking - use event.id (the actual UUID)
    booking = Booking(
        participant_id=participant_id,
        event_id=event.id,
        booking_reference=generate_booking_reference(),
        booking_status="confirmed",
        time_slot_start=slot_start_time,
        time_slot_end=slot_end_time
    )
    
    db.add(booking)
    db.commit()
    db.refresh(booking)
    
    # Send SMS confirmation
    booking_details = {
        "event_name": event.name,
        "date": str(event.event_date),
        "time": f"{time_slot_start}-{time_slot_end}" if time_slot_start else str(event.event_time),
        "ref": booking.booking_reference
    }
    send_booking_confirmation_sms(participant_phone, booking_details, mock=True)
    
    return booking


def cancel_booking(db: Session, booking_id: str, participant_phone: str) -> Booking:
    """Cancel an existing booking"""
    
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    if booking.booking_status == "cancelled":
        raise HTTPException(status_code=400, detail="Booking already cancelled")
    
    # Update booking
    booking.booking_status = "cancelled"
    booking.cancelled_at = datetime.utcnow()
    
    # Release slot
    event = booking.event
    if event.time_slots and booking.time_slot_start and booking.time_slot_end:
        # Release time slot
        for slot in event.time_slots:
            start_str = booking.time_slot_start.strftime("%H:%M")
            end_str = booking.time_slot_end.strftime("%H:%M")
            if slot['start'] == start_str and slot['end'] == end_str:
                slot['available'] += 1
                break
        event.time_slots = event.time_slots
    else:
        # Release general slot
        event.available_slots += 1
    
    db.commit()
    db.refresh(booking)
    
    # Send cancellation SMS
    send_booking_cancellation_sms(participant_phone, booking.booking_reference, mock=True)
    
    return booking