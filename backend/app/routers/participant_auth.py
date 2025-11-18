from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.schemas.participant_schemas import (
    ParticipantRegisterRequest, 
    ParticipantLoginRequest,
    VerifyOTPRequest,
    VerifyRegistrationRequest,
    TokenResponse,
    OTPResponse
)
from app.models.participant import Participant
from app.utils.security import create_access_token
from app.database import get_db
from app.services.otp_service import create_otp_record, verify_otp, invalidate_previous_otps
from app.services.sms_service import send_otp_sms

router = APIRouter(prefix="/participant/auth", tags=["Participant Authentication"])


@router.post("/register", response_model=OTPResponse)
def register_participant(request: ParticipantRegisterRequest, db: Session = Depends(get_db)):
    """Step 1 of registration: Validate data and send OTP"""
    
    existing = db.query(Participant).filter(
        (Participant.phone_number == request.phone_number) |
        (Participant.mykad_id == request.mykad_id)
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=400, 
            detail="Phone number or MyKad already registered"
        )
    
    invalidate_previous_otps(db, request.phone_number, "registration")
    
    otp_record = create_otp_record(
        db=db,
        phone_number=request.phone_number,
        purpose="registration"
    )
    
    send_otp_sms(
        phone=request.phone_number,
        otp_code=otp_record.otp_code,
        mock=True
    )
    
    print(f"📱 OTP sent to {request.phone_number}: {otp_record.otp_code}")
    
    return OTPResponse(
        message=f"OTP sent to {request.phone_number}. Valid for 10 minutes.",
        phone_number=request.phone_number
    )


@router.post("/verify-registration", response_model=TokenResponse)
def verify_registration(request: VerifyRegistrationRequest, db: Session = Depends(get_db)):
    """Step 2 of registration: Verify OTP and create account"""
    
    is_valid = verify_otp(
        db=db,
        phone_number=request.phone_number,
        otp_code=request.otp_code,
        purpose="registration"
    )
    
    if not is_valid:
        raise HTTPException(status_code=400, detail="Invalid or expired OTP")
    
    participant = Participant(
        name=request.name,
        phone_number=request.phone_number,
        mykad_id=request.mykad_id,
        phone_verified=True
    )
    db.add(participant)
    db.commit()
    db.refresh(participant)
    
    access_token = create_access_token({
        "sub": str(participant.id), 
        "role": "participant"
    })
    
    return TokenResponse(
        access_token=access_token,
        user={
            "id": str(participant.id), 
            "name": participant.name, 
            "phone_number": participant.phone_number
        }
    )


@router.post("/login", response_model=OTPResponse)
def login_participant(request: ParticipantLoginRequest, db: Session = Depends(get_db)):
    """Step 1 of login: Verify phone + MyKad pairing and send OTP"""
    
    participant = db.query(Participant).filter(
        Participant.phone_number == request.phone_number,
        Participant.mykad_id == request.mykad_id
    ).first()

    if not participant:
        raise HTTPException(
            status_code=401, 
            detail="Invalid phone number or MyKad"
        )
    
    invalidate_previous_otps(db, request.phone_number, "login")
    
    otp_record = create_otp_record(
        db=db,
        phone_number=request.phone_number,
        purpose="login"
    )
    
    send_otp_sms(
        phone=request.phone_number,
        otp_code=otp_record.otp_code,
        mock=True
    )
    
    print(f"📱 OTP sent to {request.phone_number}: {otp_record.otp_code}")
    
    return OTPResponse(
        message=f"OTP sent to {request.phone_number}. Valid for 10 minutes.",
        phone_number=request.phone_number
    )


@router.post("/verify-login", response_model=TokenResponse)
def verify_login(request: VerifyOTPRequest, db: Session = Depends(get_db)):
    """Step 2 of login: Verify OTP and return JWT token"""
    
    is_valid = verify_otp(
        db=db,
        phone_number=request.phone_number,
        otp_code=request.otp_code,
        purpose="login"
    )
    
    if not is_valid:
        raise HTTPException(status_code=400, detail="Invalid or expired OTP")
    
    participant = db.query(Participant).filter(
        Participant.phone_number == request.phone_number
    ).first()
    
    if not participant:
        raise HTTPException(status_code=404, detail="Participant not found")
    
    access_token = create_access_token({
        "sub": str(participant.id), 
        "role": "participant"
    })
    
    return TokenResponse(
        access_token=access_token,
        user={
            "id": str(participant.id), 
            "name": participant.name, 
            "phone_number": participant.phone_number
        }
    )