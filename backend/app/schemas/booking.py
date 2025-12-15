from pydantic import BaseModel, Field, field_serializer
from typing import Optional
from datetime import datetime, time
from uuid import UUID

# BOOKING SCHEMAS
class CreateBookingRequest(BaseModel):
    """Request schema for creating a booking"""
    event_id: str = Field(..., min_length=1)
    time_slot_start: Optional[str] = None  # Format: "09:00"
    time_slot_end: Optional[str] = None    # Format: "10:00"

    class Config:
        json_schema_extra = {
            "example": {
                "event_id": "123e4567-e89b-12d3-a456-426614174000",
                "time_slot_start": "09:00",
                "time_slot_end": "10:00"
            }
        }


class BookingResponse(BaseModel):
    """Response schema for booking data"""
    id: UUID
    booking_reference: str
    booking_status: str
    booked_at: datetime
    cancelled_at: Optional[datetime] = None
    time_slot_start: Optional[time] = None
    time_slot_end: Optional[time] = None
    event: dict

    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "id": "123e4567-e89b-12d3-a456-426614174000",
                "booking_reference": "ROSE-A7B9C2",
                "booking_status": "confirmed",
                "booked_at": "2025-10-22T14:30:00",
                "cancelled_at": None,
                "time_slot_start": "09:00:00",
                "time_slot_end": "10:00:00",
                "event": {
                    "id": "123e4567-e89b-12d3-a456-426614174000",
                    "name": "Free Cervical Cancer Screening - KL",
                    "event_date": "2025-11-15",
                    "event_time": "09:00:00",
                    "address": "Community Center, Jalan Sultan, KL"
                }
            }
        }




class BookingWithEventResponse(BaseModel):
    """Response with complete booking and event details"""
    booking: BookingResponse
    message: str

    class Config:
        json_schema_extra = {
            "example": {
                "booking": {
                    "id": "123e4567-e89b-12d3-a456-426614174000",
                    "booking_reference": "ROSE-A7B9C2",
                    "booking_status": "confirmed",
                    "booked_at": "2025-10-22T14:30:00",
                    "event": {
                        "name": "Free Cervical Cancer Screening - KL",
                        "event_date": "2025-11-15"
                    }
                },
                "message": "Booking confirmed. SMS sent to your phone."
            }
        }


class BookingListResponse(BaseModel):
    """Response schema for booking list"""
    bookings: list[BookingResponse]
    total: int

    class Config:
        json_schema_extra = {
            "example": {
                "bookings": [
                    {
                        "id": "123e4567-e89b-12d3-a456-426614174000",
                        "booking_reference": "ROSE-A7B9C2",
                        "booking_status": "confirmed",
                        "booked_at": "2025-10-22T14:30:00",
                        "event": {
                            "name": "Free Cervical Cancer Screening - KL",
                            "event_date": "2025-11-15"
                        }
                    }
                ],
                "total": 1
            }
        }


class CancelBookingResponse(BaseModel):
    """Response schema for booking cancellation"""
    message: str
    booking_reference: str
    slots_released: int

    class Config:
        json_schema_extra = {
            "example": {
                "message": "Booking cancelled successfully. SMS confirmation sent.",
                "booking_reference": "ROSE-A7B9C2",
                "slots_released": 1
            }
        }

class AdminBookingResponse(BaseModel):
    id: UUID
    booking_reference: str
    booking_status: str
    booked_at: datetime
    cancelled_at: Optional[datetime]
    has_result: bool 
    participant: dict
    event: dict
    
    @field_serializer('id')
    def serialize_uuid(self, value: UUID) -> str:
        return str(value)
    
    class Config:
        from_attributes = True

class AdminBookingListResponse(BaseModel):
    """Response schema for admin booking list"""
    bookings: list[AdminBookingResponse]
    total: int