from pydantic import BaseModel, Field, validator
from typing import Optional
from datetime import date, time, datetime
from decimal import Decimal
from uuid import UUID


# EVENT SCHEMAS
class EventResponse(BaseModel):
    """Response schema for event data"""
    id: UUID
    name: str
    event_date: date
    event_time: time
    address: str
    latitude: Optional[Decimal] = None
    longitude: Optional[Decimal] = None
    total_slots: int
    available_slots: int
    additional_info: Optional[str] = None
    status: str
    created_by: Optional[UUID] = None
    created_at: datetime

    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "id": "123e4567-e89b-12d3-a456-426614174000",
                "name": "Free Cervical Cancer Screening - KL",
                "event_date": "2025-11-15",
                "event_time": "09:00:00",
                "address": "Community Center, Jalan Sultan, KL",
                "latitude": 3.1390,
                "longitude": 101.6869,
                "total_slots": 50,
                "available_slots": 23,
                "additional_info": "Bring MyKad and wear comfortable clothing",
                "status": "published",
                "created_by": "123e4567-e89b-12d3-a456-426614174000",
                "created_at": "2025-10-20T10:00:00"
            }
        }


class EventListResponse(BaseModel):
    """Response schema for event list"""
    events: list[EventResponse]
    total: int

    class Config:
        json_schema_extra = {
            "example": {
                "events": [
                    {
                        "id": "123e4567-e89b-12d3-a456-426614174000",
                        "name": "Free Cervical Cancer Screening - KL",
                        "event_date": "2025-11-15",
                        "event_time": "09:00:00",
                        "address": "Community Center, Jalan Sultan, KL",
                        "total_slots": 50,
                        "available_slots": 23,
                        "status": "published",
                        "created_at": "2025-10-20T10:00:00"
                    }
                ],
                "total": 1
            }
        }


class EventCreateRequest(BaseModel):
    """Request schema for creating event (Sprint 2, but define now)"""
    name: str = Field(..., min_length=1, max_length=255)
    event_date: date
    event_time: time
    address: str = Field(..., min_length=1)
    total_slots: int = Field(..., gt=0, le=200)
    additional_info: Optional[str] = None
    status: str = Field(default="draft", pattern="^(draft|published)$")

    @validator('event_date')
    def validate_event_date(cls, v):
        """Ensure event date is not in the past"""
        if v < date.today():
            raise ValueError('Event date cannot be in the past')
        return v

    class Config:
        json_schema_extra = {
            "example": {
                "name": "Free Cervical Cancer Screening - KL",
                "event_date": "2025-11-15",
                "event_time": "09:00:00",
                "address": "Community Center, Jalan Sultan, Kuala Lumpur",
                "total_slots": 50,
                "additional_info": "Bring MyKad. Wear comfortable clothing.",
                "status": "published"
            }
        }