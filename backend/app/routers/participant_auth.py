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
from app.utils.phone_formatter import format_phone_number

router = APIRouter(prefix="/participant/auth", tags=["Participant Authentication"])


@router.post("/register", response_model=OTPResponse)
def register_participant(request: ParticipantRegisterRequest, db: Session = Depends(get_db)):
    """Step 1 of registration: Validate data and send OTP"""
    formatted_phone = format_phone_number(request.phone_number, default_country="MY")

    existing = db.query(Participant).filter(
        (Participant.phone_number == formatted_phone) |
        (Participant.mykad_id == request.mykad_id)
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=400, 
            detail="Phone number or MyKad already registered"
        )
    
    invalidate_previous_otps(db, formatted_phone, "registration")
    
    otp_record = create_otp_record(
        db=db,
        phone_number=formatted_phone,
        purpose="registration"
    )
    
    send_otp_sms(
        phone=formatted_phone, 
        otp_code=otp_record.otp_code,
    )
    
    print(f"📱 OTP sent to {formatted_phone}: {otp_record.otp_code}")
    
    return OTPResponse(
        message=f"OTP sent to {formatted_phone}. Valid for 10 minutes.",
        phone_number=formatted_phone  
    )


@router.post("/verify-registration", response_model=TokenResponse)
def verify_registration(request: VerifyRegistrationRequest, db: Session = Depends(get_db)):
    """Step 2 of registration: Verify OTP and create account"""
    
    
    formatted_phone = format_phone_number(request.phone_number, default_country="MY")
    
    is_valid = verify_otp(
        db=db,
        phone_number=formatted_phone, 
        otp_code=request.otp_code,
        purpose="registration"
    )
    
    if not is_valid:
        raise HTTPException(status_code=400, detail="Invalid or expired OTP")
    
    participant = Participant(
        name=request.name,
        phone_number=formatted_phone, 
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
    formatted_phone = format_phone_number(request.phone_number, default_country="MY")
    
    print(f"Input: {request.phone_number} → Formatted: {formatted_phone}")
    
    participant = db.query(Participant).filter(
        Participant.phone_number == formatted_phone,
        Participant.mykad_id == request.mykad_id
    ).first()

    if not participant:
        raise HTTPException(
            status_code=401, 
            detail="Invalid phone number or MyKad"
        )
    
    invalidate_previous_otps(db, formatted_phone, "login")
    
    otp_record = create_otp_record(
        db=db,
        phone_number=formatted_phone,  
        purpose="login"
    )
    
    send_otp_sms(
        phone=formatted_phone,  
        otp_code=otp_record.otp_code,
    )
    
    print(f"📱 OTP sent to {formatted_phone}: {otp_record.otp_code}")
    
    return OTPResponse(
        message=f"OTP sent to {formatted_phone}. Valid for 10 minutes.",
        phone_number=formatted_phone  # ✅ Return formatted
    )


@router.post("/verify-login", response_model=TokenResponse)
def verify_login(request: VerifyOTPRequest, db: Session = Depends(get_db)):
    """Step 2 of login: Verify OTP and return JWT token"""
    
    
    formatted_phone = format_phone_number(request.phone_number, default_country="MY")
    
    is_valid = verify_otp(
        db=db,
        phone_number=formatted_phone,  
        otp_code=request.otp_code,
        purpose="login"
    )
    
    if not is_valid:
        raise HTTPException(status_code=400, detail="Invalid or expired OTP")
    
    participant = db.query(Participant).filter(
        Participant.phone_number == formatted_phone  
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