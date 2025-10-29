from pydantic import BaseModel, Field, validator
from typing import Optional
from datetime import datetime
import re


# ============================================================
# PARTICIPANT SCHEMAS
# ============================================================

class ParticipantRegisterRequest(BaseModel):
    """Request schema for participant registration"""
    name: str = Field(..., min_length=1, max_length=255)
    phone_number: str = Field(..., min_length=10, max_length=20)
    mykad_id: str = Field(..., min_length=14, max_length=14)

    @validator('phone_number')
    def validate_phone_number(cls, v):
        """Validate Malaysian phone number format"""
        # Remove spaces and dashes
        v = v.replace(' ', '').replace('-', '')
        
        # Accept formats: +60XXXXXXXXX, 60XXXXXXXXX, 0XXXXXXXXX
        if v.startswith('+60'):
            v = v  # Already correct
        elif v.startswith('60'):
            v = '+' + v
        elif v.startswith('0'):
            v = '+60' + v[1:]
        else:
            raise ValueError('Phone number must be in Malaysian format (+60XXXXXXXXX)')
        
        # Validate format: +60 followed by 9-10 digits
        pattern = r'^\+60\d{9,10}$'
        if not re.match(pattern, v):
            raise ValueError('Invalid Malaysian phone number format')
        
        return v

    @validator('mykad_id')
    def validate_mykad_id(cls, v):
        """Validate MyKad ID format: YYMMDD-PB-####"""
        # Remove spaces
        v = v.replace(' ', '')
        
        pattern = r'^\d{6}-\d{2}-\d{4}$'
        if not re.match(pattern, v):
            raise ValueError('MyKad ID must be in format: YYMMDD-PB-####')
        
        return v

    class Config:
        json_schema_extra = {
            "example": {
                "name": "Siti Ahmad",
                "phone_number": "+60123456789",
                "mykad_id": "850101-01-1234"
            }
        }


class ParticipantLoginRequest(BaseModel):
    """Request schema for participant login"""
    phone_number: str = Field(..., min_length=10, max_length=20)
    mykad_id: str = Field(..., min_length=14, max_length=14)

    @validator('phone_number')
    def validate_phone_number(cls, v):
        """Normalize phone number"""
        v = v.replace(' ', '').replace('-', '')
        if v.startswith('+60'):
            return v
        elif v.startswith('60'):
            return '+' + v
        elif v.startswith('0'):
            return '+60' + v[1:]
        return v

    @validator('mykad_id')
    def validate_mykad_id(cls, v):
        """Remove spaces from MyKad"""
        return v.replace(' ', '')

    class Config:
        json_schema_extra = {
            "example": {
                "phone_number": "+60123456789",
                "mykad_id": "850101-01-1234"
            }
        }


class VerifyOTPRequest(BaseModel):
    """Request schema for OTP verification"""
    phone_number: str = Field(..., min_length=10, max_length=20)
    otp_code: str = Field(..., min_length=6, max_length=6)
    purpose: str = Field(..., pattern="^(registration|login|result_access)$")

    @validator('otp_code')
    def validate_otp_code(cls, v):
        """Validate OTP is 6 digits"""
        if not v.isdigit():
            raise ValueError('OTP must be 6 digits')
        return v

    class Config:
        json_schema_extra = {
            "example": {
                "phone_number": "+60123456789",
                "otp_code": "123456",
                "purpose": "registration"
            }
        }


class ParticipantResponse(BaseModel):
    """Response schema for participant data"""
    id: str
    name: str
    phone_number: str
    mykad_id: str
    phone_verified: bool
    created_at: datetime

    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "id": "123e4567-e89b-12d3-a456-426614174000",
                "name": "Siti Ahmad",
                "phone_number": "+60123456789",
                "mykad_id": "850101-01-1234",
                "phone_verified": True,
                "created_at": "2025-10-29T12:00:00"
            }
        }


# ============================================================
# ADMIN SCHEMAS
# ============================================================

class AdminRegisterRequest(BaseModel):
    """Request schema for admin registration"""
    name: str = Field(..., min_length=1, max_length=255)
    email: str = Field(..., min_length=5, max_length=255)
    password: str = Field(..., min_length=8, max_length=255)

    @validator('email')
    def validate_email(cls, v):
        """Basic email validation"""
        pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        if not re.match(pattern, v):
            raise ValueError('Invalid email format')
        return v.lower()

    @validator('password')
    def validate_password(cls, v):
        """Validate password strength"""
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters')
        if not any(c.isupper() for c in v):
            raise ValueError('Password must contain at least one uppercase letter')
        if not any(c.islower() for c in v):
            raise ValueError('Password must contain at least one lowercase letter')
        if not any(c.isdigit() for c in v):
            raise ValueError('Password must contain at least one digit')
        return v

    class Config:
        json_schema_extra = {
            "example": {
                "name": "Admin Name",
                "email": "admin@rose.org",
                "password": "SecurePass123"
            }
        }


class AdminLoginRequest(BaseModel):
    """Request schema for admin login"""
    email: str = Field(..., min_length=5, max_length=255)
    password: str = Field(..., min_length=1, max_length=255)

    @validator('email')
    def validate_email(cls, v):
        """Normalize email to lowercase"""
        return v.lower()

    class Config:
        json_schema_extra = {
            "example": {
                "email": "admin@rose.org",
                "password": "SecurePass123"
            }
        }


class AdminResponse(BaseModel):
    """Response schema for admin data"""
    id: str
    name: str
    email: str
    role: str
    email_verified: bool
    created_at: datetime

    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "id": "123e4567-e89b-12d3-a456-426614174000",
                "name": "Admin Name",
                "email": "admin@rose.org",
                "role": "admin",
                "email_verified": True,
                "created_at": "2025-10-29T12:00:00"
            }
        }


# ============================================================
# TOKEN SCHEMAS
# ============================================================

class TokenResponse(BaseModel):
    """Response schema for authentication tokens"""
    access_token: str
    token_type: str = "bearer"
    user: dict  # ParticipantResponse or AdminResponse

    class Config:
        json_schema_extra = {
            "example": {
                "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                "token_type": "bearer",
                "user": {
                    "id": "123e4567-e89b-12d3-a456-426614174000",
                    "name": "Siti Ahmad",
                    "phone_number": "+60123456789"
                }
            }
        }


class OTPResponse(BaseModel):
    """Response schema for OTP generation"""
    message: str
    phone_number: str

    class Config:
        json_schema_extra = {
            "example": {
                "message": "OTP sent to +60123456789",
                "phone_number": "+60123456789"
            }
        }


# ============================================================
# ERROR SCHEMAS
# ============================================================

class ErrorResponse(BaseModel):
    """Standard error response schema"""
    detail: str

    class Config:
        json_schema_extra = {
            "example": {
                "detail": "Invalid credentials"
            }
        }