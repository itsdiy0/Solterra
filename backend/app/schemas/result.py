from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from uuid import UUID


class ResultUploadRequest(BaseModel):
    """Request schema for uploading test result"""
    booking_id: str
    result_category: str = Field(..., pattern="^(Normal|Abnormal - follow up required)$")
    result_notes: Optional[str] = None
    
    class Config:
        json_schema_extra = {
            "example": {
                "booking_id": "123e4567-e89b-12d3-a456-426614174000",
                "result_category": "Normal",
                "result_notes": "HPV test negative. No further action required."
            }
        }


class ResultResponse(BaseModel):
    """Response schema for test result"""
    id: str
    booking_id: str
    result_category: str
    result_notes: Optional[str]
    result_file_url: Optional[str]
    uploaded_by: str
    uploaded_at: datetime
    sms_sent: bool
    sms_sent_at: Optional[datetime]
    
    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "id": "123e4567-e89b-12d3-a456-426614174000",
                "booking_id": "123e4567-e89b-12d3-a456-426614174000",
                "result_category": "Normal",
                "result_notes": "HPV test negative",
                "result_file_url": "https://res.cloudinary.com/...",
                "uploaded_by": "admin-uuid",
                "uploaded_at": "2025-11-18T10:00:00",
                "sms_sent": True,
                "sms_sent_at": "2025-11-18T10:05:00"
            }
        }


class ResultListResponse(BaseModel):
    """Response schema for result list"""
    results: list[ResultResponse]
    total: int


class SendResultSMSRequest(BaseModel):
    """Request to send result notification SMS"""
    result_id: str
    
    class Config:
        json_schema_extra = {
            "example": {
                "result_id": "123e4567-e89b-12d3-a456-426614174000"
            }
        }


class SendResultSMSResponse(BaseModel):
    """Response after sending result SMS"""
    message: str
    sms_sent: bool
    
    class Config:
        json_schema_extra = {
            "example": {
                "message": "Result notification sent to +60123456789",
                "sms_sent": True
            }
        }


class ParticipantResultResponse(BaseModel):
    """Participant view of their result (limited fields)"""
    id: str
    event_name: str
    event_date: str
    result_category: str
    result_available: bool
    uploaded_at: datetime
    
    class Config:
        json_schema_extra = {
            "example": {
                "id": "123e4567-e89b-12d3-a456-426614174000",
                "event_name": "Kampung Sentosa Hall Screening",
                "event_date": "2025-11-15",
                "result_category": "Normal",
                "result_available": True,
                "uploaded_at": "2025-11-18T10:00:00"
            }
        }


class RequestResultOTPResponse(BaseModel):
    """Response when requesting OTP to view result"""
    message: str
    phone_number: str
    
    class Config:
        json_schema_extra = {
            "example": {
                "message": "OTP sent to +60123456789 to verify identity",
                "phone_number": "+60123456789"
            }
        }


class ViewResultResponse(BaseModel):
    """Response with secure result access"""
    result_category: str
    result_notes: Optional[str]
    result_file_url: Optional[str]  # Time-limited secure URL
    event_name: str
    event_date: str
    
    class Config:
        json_schema_extra = {
            "example": {
                "result_category": "Normal",
                "result_notes": "HPV test negative. No further action required.",
                "result_file_url": "https://res.cloudinary.com/secure-signed-url...",
                "event_name": "Kampung Sentosa Hall Screening",
                "event_date": "2025-11-15"
            }
        }