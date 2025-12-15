from pydantic import BaseModel, Field


class UpdateProfileRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)


class UpdatePasswordRequest(BaseModel):
    current_password: str = Field(..., min_length=1)
    new_password: str = Field(..., min_length=6)


class MessageResponse(BaseModel):
    message: str