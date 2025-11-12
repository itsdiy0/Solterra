from pydantic import BaseModel, EmailStr, Field,validator
from datetime import datetime
from uuid import UUID
import re
class AdminRegisterRequest(BaseModel):
    name: str
    email: EmailStr
    password: str = Field(..., min_length=8)

    @validator("password")
    def validate_password_strength(cls, v):
        pattern = r'^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_\-+=\[\]{};:,.<>?/|`~]).{8,}$'
        if not re.match(pattern, v):
            raise ValueError(
                "Password must include uppercase, lowercase, number, and special character."
            )
        return v

class AdminLoginRequest(BaseModel):
    email: EmailStr
    password: str

class AdminResponse(BaseModel):
    id: UUID
    name: str
    email: str
    role: str
    created_at: datetime

    class Config:
        from_attributes = True

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict
