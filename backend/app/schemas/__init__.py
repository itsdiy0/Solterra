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

from app.schemas.event import (
    EventResponse,
    EventListResponse,
    EventCreateRequest,
)

from app.schemas.booking import (
    CreateBookingRequest,
    BookingResponse,
    BookingWithEventResponse,
    BookingListResponse,
    CancelBookingResponse,
)

__all__ = [
    # Auth schemas
    "ParticipantRegisterRequest",
    "ParticipantLoginRequest",
    "VerifyOTPRequest",
    "ParticipantResponse",
    "AdminRegisterRequest",
    "AdminLoginRequest",
    "AdminResponse",
    "TokenResponse",
    "OTPResponse",
    "ErrorResponse",
    # Event schemas
    "EventResponse",
    "EventListResponse",
    "EventCreateRequest",
    # Booking schemas
    "CreateBookingRequest",
    "BookingResponse",
    "BookingWithEventResponse",
    "BookingListResponse",
    "CancelBookingResponse",
]