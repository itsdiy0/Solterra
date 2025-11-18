from pydantic import BaseModel, Field
from datetime import datetime
from uuid import UUID

class ParticipantRegisterRequest(BaseModel):
    name: str = Field(..., min_length=1)
    phone_number: str
    mykad_id: str = Field(..., min_length=14, max_length=14)

class ParticipantLoginRequest(BaseModel):
    phone_number: str
    mykad_id: str = Field(..., min_length=14, max_length=14)

class ParticipantResponse(BaseModel):
    id: UUID
    name: str
    phone_number: str
    mykad_id: str
    phone_verified: bool
    created_at: datetime

    class Config:
        from_attributes = True

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict

class VerifyOTPRequest(BaseModel):
    """Request to verify OTP"""
    phone_number: str
    otp_code: str
    purpose: str  # 'registration', 'login', 'result_access'
    
    class Config:
        json_schema_extra = {
            "example": {
                "phone_number": "+60123456789",
                "otp_code": "123456",
                "purpose": "login"
            }
        }


class OTPResponse(BaseModel):
    """Response after OTP sent"""
    message: str
    phone_number: str
    
    class Config:
        json_schema_extra = {
            "example": {
                "message": "OTP sent to +60123456789. Valid for 10 minutes.",
                "phone_number": "+60123456789"
            }
        }

class VerifyRegistrationRequest(BaseModel):
    """Combined request for OTP verification and registration"""
    # OTP data
    phone_number: str
    otp_code: str
    purpose: str = "registration"
    # Registration data
    name: str
    mykad_id: str