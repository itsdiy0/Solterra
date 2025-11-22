from fastapi import APIRouter, Depends, HTTPException, status, Path
from sqlalchemy.orm import Session
from app.database import get_db
from app.utils.security import get_current_admin
from app.models.admin import Admin
from app.schemas.event import EventCreateRequest, EventResponse
from app.services.event_service import EventService
from app.models.event import Event  


router = APIRouter(prefix="/events", tags=["Events"])

# ---------------- CREATE EVENT ----------------
@router.post("/", response_model=EventResponse, status_code=status.HTTP_201_CREATED)
def create_event(
    event_data: EventCreateRequest,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin)
):
    """Create a new event (Draft or Published)."""
    service = EventService(db)
    return service.create_event(event_data, current_admin.id)


# ---------------- LIST EVENTS ----------------
@router.get("/", response_model=list[EventResponse])
def list_events(db: Session = Depends(get_db), published_only: bool = True):
    """List all published events (or all if `published_only=False`)."""
    service = EventService(db)
    return service.list_events(published_only=published_only)


# ---------------- GET EVENT BY ID ----------------
@router.get("/{event_id}", response_model=EventResponse)
def get_event_by_id(event_id: str, db: Session = Depends(get_db)):
    """Get details for a specific event."""
    service = EventService(db)
    return service.get_event_by_id(event_id)


# ---------------- EDIT / UPDATE EVENT ----------------
@router.put("/{event_id}", response_model=EventResponse)
def edit_event(
    event_id: str = Path(..., description="ID of the event to edit"),
    event_data: EventCreateRequest = ...,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin)
):
    """Edit an existing event (admin only)."""
    service = EventService(db)
    return service.update_event(event_id, event_data, current_admin.id)


# ---------------- DELETE EVENT ----------------
@router.delete("/{event_id}", status_code=status.HTTP_200_OK)
def delete_event(
    event_id: str = Path(..., description="ID of the event to delete"),
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin)
):
    """Delete an event (admin only)."""
    service = EventService(db)
    return service.delete_event(event_id, current_admin.id)


# ---------------- GET EVENT PARTICIPANTS (ADMIN ONLY) ----------------
@router.get("/{event_id}/participants")
def get_event_participants(
    event_id: str,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin)
):
    """Get an event with participants and their bookings."""
    from app.models.booking import Booking
    
    # Get event
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    # Get bookings for this event
    bookings = db.query(Booking).filter(Booking.event_id == event_id).all()
    
    # Format participant data with booking info
    participants = [
        {
            "id": str(booking.id),  # ✅ This is the booking ID (what we need!)
            "booking_id": str(booking.id),  # ✅ Explicit booking_id field
            "booking_reference": booking.booking_reference,
            "booking_status": booking.booking_status,
            "booked_at": booking.booked_at.isoformat(),
            "name": booking.participant.name,
            "phone_number": booking.participant.phone_number,
            "mykad_id": booking.participant.mykad_id,
        }
        for booking in bookings
    ]
    
    return {
        "event": {
            "id": str(event.id),
            "name": event.name,
            "event_date": str(event.event_date),
            "event_time": str(event.event_time),
            "address": event.address,
            "total_slots": event.total_slots,
            "available_slots": event.available_slots,
        },
        "participants": participants
    }


# ---------------- EXPORT EVENT PARTICIPANTS (ADMIN ONLY) ----------------
@router.get("/{event_id}/participants/export")
def export_event_participants(
    event_id: str,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin)
):
    """Export event participants as CSV."""
    from app.models.booking import Booking
    from fastapi.responses import StreamingResponse
    import csv
    import io

    # Get event
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    # Get bookings for this event
    bookings = db.query(Booking).filter(Booking.event_id == event_id).all()

    # Create CSV in memory
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Write header
    writer.writerow([
        "Booking Reference", 
        "Booking Status", 
        "Booked At", 
        "Name", 
        "Phone Number", 
        "MyKad ID"
    ])

    # Write data
    for booking in bookings:
        writer.writerow([
            booking.booking_reference,
            booking.booking_status,
            booking.booked_at.strftime("%Y-%m-%d %H:%M:%S"),
            booking.participant.name,
            booking.participant.phone_number,
            booking.participant.mykad_id,
        ])
    
    output.seek(0)
    
    response = StreamingResponse(
        iter([output.getvalue()]), 
        media_type="text/csv"
    )
    response.headers["Content-Disposition"] = f"attachment; filename=participants_{event_id}.csv"
    return response