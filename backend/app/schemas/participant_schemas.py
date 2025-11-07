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
