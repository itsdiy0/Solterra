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
    BookingListResponse,
    CancelBookingResponse,
    BookingResponse
)
from app.schemas.participant_schemas import ParticipantResponse
from app.services.booking_service import create_booking, cancel_booking

router = APIRouter(prefix="/participant", tags=["Participant"])

# ----------------------------
# Participant Profile
# ----------------------------
@router.get("/profile", response_model=ParticipantResponse)
def get_profile(current_user: Participant = Depends(get_current_participant)):
    return current_user


# ----------------------------
# Get participant bookings
# ----------------------------
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
    # Pass participant phone to service for SMS
    booking = create_booking(
        db,
        participant_id=current_user.id,
        participant_phone=current_user.phone_number,  # <-- Add phone number here
        event_id=request.event_id
    )
    
    # Ensure event relationship is loaded
    booking = db.query(Booking).options(joinedload(Booking.event)).filter_by(id=booking.id).first()
    
    booking_data = BookingResponse(
        id=str(booking.id),
        booking_reference=booking.booking_reference,
        booking_status=booking.booking_status,
        booked_at=booking.booked_at,
        cancelled_at=booking.cancelled_at,
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
