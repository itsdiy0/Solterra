from fastapi import APIRouter, Depends, HTTPException, status, Path
from sqlalchemy.orm import Session
from app.database import get_db
from app.utils.security import get_current_admin
from app.models.admin import Admin
from app.schemas.event import EventCreateRequest, EventResponse
from app.services.event_service import EventService

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
    current_admin: Admin = Depends(get_current_admin)  # ✅ admin-only
):
    """Get an event with participants (safe fields only)."""
    service = EventService(db)
    event_data = service.get_event_with_participants(event_id)

    # Only return safe participant info
    safe_participants = [
        {
            "id": p["id"],
            "name": p["name"],
            "booking_status": p["booking_status"],
            "booked_at": p["booked_at"],
            "booking_reference": getattr(p, "booking_reference", None)
        }
        for p in event_data["participants"]
    ]

    return {
        "event": event_data["event"],
        "participants": safe_participants
    }
