from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from typing import List
from app.database import get_db
from app.models.booking import Booking
from app.models.participant import Participant
from app.schemas.event import EventResponse
from app.utils.security import get_current_participant
from app.schemas.booking import (
    CreateBookingRequest,
    BookingWithEventResponse,
    CancelBookingResponse,
    BookingResponse
)
from app.schemas.participant_schemas import ParticipantResponse
from app.services.booking_service import create_booking, cancel_booking
from app.schemas.settings_schemas import UpdateProfileRequest

router = APIRouter(prefix="/participant", tags=["Participant"])


@router.get("/profile", response_model=ParticipantResponse)
def get_profile(current_user: Participant = Depends(get_current_participant)):
    return current_user


@router.get("/bookings", response_model=List[BookingResponse])
def get_my_bookings(
    db: Session = Depends(get_db),
    current_user: Participant = Depends(get_current_participant)
):
    bookings = db.query(Booking).options(joinedload(Booking.event)).filter(
        Booking.participant_id == current_user.id
    ).all()

    return [
        BookingResponse(
            id=str(b.id),
            booking_reference=b.booking_reference,
            booking_status=b.booking_status,
            booked_at=b.booked_at,
            cancelled_at=b.cancelled_at,
            event=EventResponse.from_orm(b.event).model_dump()
        )
        for b in bookings
    ]


# ----------------------------
# Create a new booking
# ----------------------------
@router.post("/bookings", response_model=BookingWithEventResponse)
def book_event(
    request: CreateBookingRequest,
    db: Session = Depends(get_db),
    current_user: Participant = Depends(get_current_participant)
):
    # Pass time slot information
    booking = create_booking(
        db,
        participant_id=current_user.id,
        participant_phone=current_user.phone_number,
        event_id=request.event_id,
        time_slot_start=request.time_slot_start,
        time_slot_end=request.time_slot_end
    )
    
    # Load event relationship
    booking = db.query(Booking).options(joinedload(Booking.event)).filter_by(id=booking.id).first()
    
    booking_data = BookingResponse(
        id=booking.id,
        booking_reference=booking.booking_reference,
        booking_status=booking.booking_status,
        booked_at=booking.booked_at,
        cancelled_at=booking.cancelled_at,
        time_slot_start=booking.time_slot_start,
        time_slot_end=booking.time_slot_end,
        event=EventResponse.from_orm(booking.event).model_dump()
    )
    
    return BookingWithEventResponse(booking=booking_data, message="Booking confirmed.")


# ----------------------------
# Cancel a booking
# ----------------------------
@router.post("/bookings/{booking_id}/cancel", response_model=CancelBookingResponse)
def cancel_my_booking(
    booking_id: str,
    db: Session = Depends(get_db),
    current_user: Participant = Depends(get_current_participant)
):
    # Pass participant phone to service for SMS
    booking = cancel_booking(
        db,
        booking_id,
        participant_phone=current_user.phone_number  # <-- Add phone number here
    )

    if booking.participant_id != current_user.id:
        raise HTTPException(status_code=403, detail="Cannot cancel a booking that is not yours")

    return CancelBookingResponse(
        message="Booking cancelled successfully.",
        booking_reference=booking.booking_reference,
        slots_released=1
    )

@router.put("/profile", response_model=ParticipantResponse)
def update_participant_profile(
    request: UpdateProfileRequest,
    db: Session = Depends(get_db),
    current_user: Participant = Depends(get_current_participant)
):
    """Update participant profile (name only)"""
    current_user.name = request.name
    db.commit()
    db.refresh(current_user)
    return current_user