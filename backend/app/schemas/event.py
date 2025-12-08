from pydantic import BaseModel, Field, field_serializer
from typing import Optional
from datetime import date, time, datetime
from decimal import Decimal
from uuid import UUID


# EVENT SCHEMAS
class EventCreateRequest(BaseModel):
    """Request schema for creating an event"""
    name: str = Field(..., min_length=1, max_length=255)
    event_date: date
    event_time: time
    address: str = Field(..., min_length=1)
    total_slots: int = Field(..., gt=0)
    additional_info: Optional[str] = None
    status: str = Field(default="published", pattern="^(draft|published)$")
    latitude: Optional[float] = None
    longitude: Optional[float] = None

    class Config:
        json_schema_extra = {
            "example": {
                "name": "Free Cervical Cancer Screening - KL",
                "event_date": "2025-11-15",
                "event_time": "09:00:00",
                "address": "Community Center, Jalan Sultan, KL",
                "total_slots": 50,
                "additional_info": "Bring MyKad and wear comfortable clothing",
                "status": "published",
                "latitude": 3.1390,
                "longitude": 101.6869
            }
        }


class EventResponse(BaseModel):
    """Response schema for event data"""
    id: UUID  
    event_code: str
    name: str
    event_date: date
    event_time: time
    address: str
    total_slots: int
    available_slots: int
    additional_info: Optional[str]
    status: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    
    @field_serializer('id')
    def serialize_id(self, value: UUID) -> str:
        return str(value)
    
    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "id": "123e4567-e89b-12d3-a456-426614174000",
                "event_code": "SEN-0001",
                "name": "Free Cervical Cancer Screening - KL",
                "event_date": "2025-11-15",
                "event_time": "09:00:00",
                "address": "Community Center, Jalan Sultan, KL",
                "total_slots": 50,
                "available_slots": 35,
                "additional_info": "Bring MyKad",
                "status": "published",
                "latitude": 3.1390,
                "longitude": 101.6869
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


