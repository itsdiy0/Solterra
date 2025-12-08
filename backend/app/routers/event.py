from fastapi import APIRouter, Depends, HTTPException, status, Path
from sqlalchemy.orm import Session
from typing import Union
from uuid import UUID
from app.database import get_db
from app.utils.security import get_current_admin
from app.models.admin import Admin
from app.schemas.event import EventCreateRequest, EventResponse
from app.services.event_service import EventService
from app.models.event import Event
from app.models.booking import Booking

router = APIRouter(prefix="/events", tags=["Events"])


# ---------------- HELPER FUNCTION ----------------
def get_event_by_identifier(db: Session, identifier: str) -> Event:
    """Get event by UUID or event_code"""
    
    # First, try as event_code
    event = db.query(Event).filter(Event.event_code == identifier).first()
    if event:
        return event
    
    # Then try as UUID
    try:
        from uuid import UUID
        uuid_obj = UUID(identifier)
        event = db.query(Event).filter(Event.id == uuid_obj).first()
        if event:
            return event
    except (ValueError, TypeError):
        # Not a valid UUID, that's fine
        pass
    
    raise HTTPException(status_code=404, detail=f"Event not found: {identifier}")


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


# ---------------- GET EVENT BY ID OR CODE ----------------
@router.get("/{event_id}", response_model=EventResponse)
def get_event_by_id(event_id: str, db: Session = Depends(get_db)):
    """Get details for a specific event by UUID or event code (e.g., TAN-0284)"""
    return get_event_by_identifier(db, event_id)


# ---------------- EDIT / UPDATE EVENT ----------------
@router.put("/{event_id}", response_model=EventResponse)
def edit_event(
    event_id: str = Path(..., description="UUID or event code of the event to edit"),
    event_data: EventCreateRequest = ...,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin)
):
    """Edit an existing event (admin only)."""
    event = get_event_by_identifier(db, event_id)
    service = EventService(db)
    return service.update_event(str(event.id), event_data, current_admin.id)


# ---------------- DELETE EVENT ----------------
@router.delete("/{event_id}", status_code=status.HTTP_200_OK)
def delete_event(
    event_id: str = Path(..., description="UUID or event code of the event to delete"),
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin)
):
    """Delete an event (admin only)."""
    event = get_event_by_identifier(db, event_id)
    service = EventService(db)
    return service.delete_event(str(event.id), current_admin.id)


# ---------------- GET EVENT PARTICIPANTS (ADMIN ONLY) ----------------
@router.get("/{event_id}/participants")
def get_event_participants(
    event_id: str,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin)
):
    """Get an event with participants and their bookings."""
    
    # Get event by ID or code
    event = get_event_by_identifier(db, event_id)
    
    # Get bookings for this event
    bookings = db.query(Booking).filter(Booking.event_id == event.id).all()
    
    # Format participant data with booking info
    participants = [
        {
            "id": str(booking.id),
            "booking_id": str(booking.id),
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
            "event_code": event.event_code,
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
    from fastapi.responses import StreamingResponse
    import csv
    import io

    # Get event by ID or code
    event = get_event_by_identifier(db, event_id)

    # Get bookings for this event
    bookings = db.query(Booking).filter(Booking.event_id == event.id).all()

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
    response.headers["Content-Disposition"] = f"attachment; filename=participants_{event.event_code}.csv"
    return response


# ---------------- GET EVENT TIME SLOTS ----------------
@router.get("/{event_id}/time-slots")
def get_event_time_slots(event_id: str, db: Session = Depends(get_db)):
    """Get available time slots for an event"""
    event = get_event_by_identifier(db, event_id)
    
    if not event.time_slots:
        # No time slots configured, return single slot based on event_time
        return {
            "has_time_slots": False,
            "slots": [{
                "start": str(event.event_time.strftime("%H:%M")),
                "end": "16:00",
                "slots": event.total_slots,
                "available": event.available_slots
            }]
        }
    
    return {
        "has_time_slots": True,
        "slots": event.time_slots
    }