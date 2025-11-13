from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional, List
from datetime import date
from uuid import UUID

from app.database import get_db
from app.models.event import Event
from app.schemas.event import EventResponse, EventListResponse

router = APIRouter(prefix="/events", tags=["Events"])


@router.get("", response_model=EventListResponse)
def get_events(
    db: Session = Depends(get_db),
    status: Optional[str] = Query(None, description="Filter by status (published/draft)"),
    date_from: Optional[date] = Query(None, description="Filter events from this date"),
    date_to: Optional[date] = Query(None, description="Filter events until this date"),
    location: Optional[str] = Query(None, description="Filter by location (address contains)")
):
    """
    Get list of events with optional filters.
    
    Query Parameters:
    - status: Filter by event status (published/draft)
    - date_from: Show events from this date onwards
    - date_to: Show events up to this date
    - location: Filter by location (searches in address field)
    
    Returns:
    - List of events sorted by event_date (soonest first)
    """
    query = db.query(Event)
    
    # Apply filters
    if status:
        query = query.filter(Event.status == status)
    else:
        # Default: only show published events
        query = query.filter(Event.status == "published")
    
    if date_from:
        query = query.filter(Event.event_date >= date_from)
    
    if date_to:
        query = query.filter(Event.event_date <= date_to)
    
    if location:
        query = query.filter(Event.address.ilike(f"%{location}%"))
    
    # Sort by date (soonest first) as per AC
    events = query.order_by(Event.event_date.asc(), Event.event_time.asc()).all()
    
    return EventListResponse(events=events, total=len(events))


@router.get("/{event_id}", response_model=EventResponse)
def get_event(
    event_id: UUID,
    db: Session = Depends(get_db)
):
    """
    Get detailed information for a specific event.
    
    Path Parameters:
    - event_id: UUID of the event
    
    Returns:
    - Complete event details including location, capacity, etc.
    """
    event = db.query(Event).filter(Event.id == event_id).first()
    
    if not event:
        raise HTTPException(
            status_code=404,
            detail=f"Event with ID {event_id} not found"
        )
    
    return event