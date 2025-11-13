from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from fastapi import HTTPException, status
from datetime import datetime
import requests
import os

from app.models.event import Event, EventStatus
from app.schemas.event import EventCreateRequest


class EventService:
    """Service layer for event management."""

    def __init__(self, db: Session):
        self.db = db
        self.google_api_key = os.getenv("GOOGLE_MAPS_API_KEY")

    # ---------------- CREATE EVENT ----------------
    def create_event(self, event_data: EventCreateRequest, created_by: str) -> Event:
        event_datetime = datetime.combine(event_data.event_date, event_data.event_time)
        if event_datetime < datetime.now():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Event date and time cannot be in the past"
            )

        duplicate_event = (
            self.db.query(Event)
            .filter(
                Event.name.ilike(event_data.name.strip()),
                Event.event_date == event_data.event_date,
                Event.address.ilike(event_data.address.strip())
            )
            .first()
        )
        if duplicate_event:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="An event with the same name, date, and address already exists"
            )

        coordinates = None
        if self.google_api_key:
            coordinates = self._validate_address(event_data.address)

        new_event = Event(
            name=event_data.name.strip(),
            event_date=event_data.event_date,
            event_time=event_data.event_time,
            address=event_data.address.strip(),
            total_slots=event_data.total_slots,
            available_slots=event_data.total_slots,
            additional_info=event_data.additional_info,
            status=event_data.status,
            created_by=created_by,
            latitude=coordinates["lat"] if coordinates else None,
            longitude=coordinates["lng"] if coordinates else None,
        )

        try:
            self.db.add(new_event)
            self.db.commit()
            self.db.refresh(new_event)
        except SQLAlchemyError as e:
            self.db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Database error: {str(e)}"
            )

        return new_event

    # ---------------- LIST EVENTS ----------------
    def list_events(self, published_only: bool = True) -> list[Event]:
        query = self.db.query(Event)
        if published_only:
            query = query.filter(Event.status == EventStatus.published)
        return query.order_by(Event.event_date.asc(), Event.event_time.asc()).all()

    # ---------------- GET EVENT BY ID ----------------
    def get_event_by_id(self, event_id: str) -> Event:
        event = self.db.query(Event).filter(Event.id == event_id).first()
        if not event:
            raise HTTPException(status_code=404, detail="Event not found")
        return event

    # ---------------- GET EVENT WITH PARTICIPANTS ----------------
    def get_event_with_participants(self, event_id: str):
        event = self.get_event_by_id(event_id)
        participants = [
            {
                "id": booking.participant.id,
                "name": booking.participant.name,
                "phone_number": booking.participant.phone_number,
                "mykad_id": booking.participant.mykad_id,
                "booking_status": booking.booking_status,
                "booked_at": booking.booked_at
            }
            for booking in event.bookings
        ]
        return {"event": event, "participants": participants}

    # ---------------- PRIVATE ----------------
    def _validate_address(self, address: str):
        geo_url = "https://maps.googleapis.com/maps/api/geocode/json"
        params = {"address": address, "key": self.google_api_key}
        response = requests.get(geo_url, params=params)
        data = response.json()
        if data["status"] != "OK":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid address or not found: {address}"
            )
        return data["results"][0]["geometry"]["location"]

    # ---------------- UPDATE EVENT ----------------
    def update_event(self, event_id: str, event_data: EventCreateRequest, current_admin_id: str) -> Event:
        """
        Update an existing event.
        Only the admin who created the event can update it.
        Validates date/time, duplicate events, and total_slots.
        """
        # 1. Fetch event
        event = self.get_event_by_id(event_id)

        # 2. Verify admin ownership
        if event.created_by != current_admin_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to edit this event"
            )

        # 3. Validate date/time
        event_datetime = datetime.combine(event_data.event_date, event_data.event_time)
        if event_datetime < datetime.now():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Event date and time cannot be in the past"
            )

        # 4. Prevent duplicates (ignore current event)
        duplicate_event = (
            self.db.query(Event)
            .filter(
                Event.id != event.id,
                Event.name.ilike(event_data.name.strip()),
                Event.event_date == event_data.event_date,
                Event.address.ilike(event_data.address.strip())
            )
            .first()
        )
        if duplicate_event:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Another event with the same name, date, and address already exists"
            )

        # 5. Validate total_slots
        booked_slots = event.total_slots - event.available_slots
        if event_data.total_slots < booked_slots:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Total slots cannot be less than already booked slots ({booked_slots})"
            )

        # 6. Update fields
        event.name = event_data.name.strip()
        event.event_date = event_data.event_date
        event.event_time = event_data.event_time
        event.address = event_data.address.strip()
        event.total_slots = event_data.total_slots
        event.available_slots = event_data.total_slots - booked_slots
        event.additional_info = event_data.additional_info
        event.status = event_data.status

        # 7. Optional: re-validate address
        if self.google_api_key:
            coordinates = self._validate_address(event.address)
            event.latitude = coordinates["lat"]
            event.longitude = coordinates["lng"]

        # 8. Commit changes
        try:
            self.db.commit()
            self.db.refresh(event)
        except SQLAlchemyError as e:
            self.db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Database error: {str(e)}"
            )

        return event
