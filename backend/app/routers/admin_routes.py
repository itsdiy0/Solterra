from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime
from uuid import UUID

from app.utils.security import get_current_admin
from app.database import get_db
from app.models.admin import Admin
from app.models.event import Event
from app.models.booking import Booking
from app.schemas.admin_schemas import AdminResponse
from app.schemas.booking import AdminBookingListResponse, AdminBookingResponse

router = APIRouter(prefix="/admin", tags=["Admin"])

@router.get("/profile", response_model=AdminResponse)
def get_admin_profile(current_user: Admin = Depends(get_current_admin)):
    """
    Get current admin's profile.
    """
    return current_user

@router.get("/bookings", response_model=AdminBookingListResponse)
def get_admin_event_bookings(
    db: Session = Depends(get_db),
    current_user: Admin = Depends(get_current_admin)
):
    """
    Get all bookings for events created by this admin.
    """
    bookings = (
        db.query(Booking)
        .join(Event)
        .filter(Event.created_by == current_user.id)
        .order_by(Booking.booking_status.desc(), Booking.booked_at.desc())
        .all()
    )
    
    # Convert SQLAlchemy objects with participant info
    booking_responses = []
    for booking in bookings:
        booking_responses.append(
            AdminBookingResponse(
                id=booking.id,
                booking_reference=booking.booking_reference,
                booking_status=booking.booking_status,
                booked_at=booking.booked_at,
                cancelled_at=booking.cancelled_at,
                participant={
                    "id": str(booking.participant.id),
                    "name": booking.participant.name,
                    "phone_number": booking.participant.phone_number,
                    "mykad_id": booking.participant.mykad_id
                },
                event={
                    "id": str(booking.event.id),
                    "name": booking.event.name,
                    "event_date": str(booking.event.event_date),
                    "event_time": str(booking.event.event_time),
                    "address": booking.event.address
                }
            )
        )
    
    return AdminBookingListResponse(bookings=booking_responses, total=len(booking_responses))


@router.post("/bookings/{booking_id}/check-in", status_code=status.HTTP_200_OK)
def check_in_participant(
    booking_id: UUID,
    db: Session = Depends(get_db),
    current_user: Admin = Depends(get_current_admin)
):
    """
    Check in a participant for their booking.
    Only admins who created the event can check in participants.
    """
    # Get booking with event
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    
    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Booking not found"
        )
    
    # Verify admin created this event
    event = booking.event
    if event.created_by != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to check in participants for this event"
        )
    
    # Check if already checked in
    if booking.booking_status == "checked_in":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Participant already checked in"
        )
    
    # Check if cancelled
    if booking.booking_status == "cancelled":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot check in cancelled booking"
        )
    
    # Update booking status
    booking.booking_status = "checked_in"
    
    try:
        db.commit()
        db.refresh(booking)
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to check in participant: {str(e)}"
        )
    
    return {
        "message": "Participant checked in successfully",
        "booking_id": str(booking.id),
        "booking_reference": booking.booking_reference,
        "participant_name": booking.participant.name,
        "booking_status": booking.booking_status
    }