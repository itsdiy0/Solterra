from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.schemas.participant_schemas import ParticipantRegisterRequest, ParticipantLoginRequest, TokenResponse
from app.models.participant import Participant
from app.utils.security import create_access_token
from app.database import get_db

router = APIRouter(prefix="/participant/auth", tags=["Participant Authentication"])

@router.post("/register", response_model=TokenResponse)
def register_participant(request: ParticipantRegisterRequest, db: Session = Depends(get_db)):
    existing = db.query(Participant).filter(
        (Participant.phone_number == request.phone_number) |
        (Participant.mykad_id == request.mykad_id)
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Phone number or MyKad already registered")

    participant = Participant(
        name=request.name,
        phone_number=request.phone_number,
        mykad_id=request.mykad_id
    )
    db.add(participant)
    db.commit()
    db.refresh(participant)

    access_token = create_access_token({"sub": str(participant.id), "role": "participant"})
    return TokenResponse(
        access_token=access_token,
        user={"id": str(participant.id), "name": participant.name, "phone_number": participant.phone_number}
    )

@router.post("/login", response_model=TokenResponse)
def login_participant(request: ParticipantLoginRequest, db: Session = Depends(get_db)):
    participant = db.query(Participant).filter(
        Participant.phone_number == request.phone_number,
        Participant.mykad_id == request.mykad_id
    ).first()

    if not participant:
        raise HTTPException(status_code=401, detail="Invalid phone number or MyKad")

    access_token = create_access_token({"sub": str(participant.id), "role": "participant"})
    return TokenResponse(
        access_token=access_token,
        user={"id": str(participant.id), "name": participant.name, "phone_number": participant.phone_number}
    )
