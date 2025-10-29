from app.schemas.auth import (
    ParticipantRegisterRequest,
    ParticipantLoginRequest,
    VerifyOTPRequest,
    ParticipantResponse,
    AdminRegisterRequest,
    AdminLoginRequest,
    AdminResponse,
    TokenResponse,
    OTPResponse,
    ErrorResponse,
)

__all__ = [
    # Participant schemas
    "ParticipantRegisterRequest",
    "ParticipantLoginRequest",
    "VerifyOTPRequest",
    "ParticipantResponse",
    # Admin schemas
    "AdminRegisterRequest",
    "AdminLoginRequest",
    "AdminResponse",
    # Token schemas
    "TokenResponse",
    "OTPResponse",
    # Error schemas
    "ErrorResponse",
]