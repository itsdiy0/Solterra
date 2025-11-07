from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.utils.security import get_current_admin
from app.database import get_db
from app.models.admin import Admin
from app.models.event import Event
from app.models.booking import Booking
from app.schemas.admin_schemas import AdminResponse
from app.schemas.booking import BookingListResponse

router = APIRouter(prefix="/admin", tags=["Admin"])

# ----------------------------
# Admin Profile
# ----------------------------
@router.get("/profile", response_model=AdminResponse)
def get_admin_profile(current_user: Admin = Depends(get_current_admin)):
    """
    Get current admin's profile.
    """
    return current_user

# ----------------------------
# Admin: Get all bookings for their events
# ----------------------------
@router.get("/bookings", response_model=BookingListResponse)
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
    return BookingListResponse(bookings=bookings, total=len(bookings))
