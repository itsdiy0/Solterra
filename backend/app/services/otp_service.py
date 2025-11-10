import random
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models import OTPCode

# OTP GENERATION
def generate_otp() -> str:
    """Generate 6-digit random OTP code"""
    return str(random.randint(100000, 999999))

# OTP DATABASE OPERATIONS
def create_otp_record(
    db: Session,
    phone_number: str,
    purpose: str,
    expiry_minutes: int = 10
) -> OTPCode:
    """
    Create OTP record in database
    
    Args:
        db: Database session
        phone_number: User's phone number
        purpose: 'registration', 'login', or 'result_access'
        expiry_minutes: OTP validity period (default 10 minutes)
    
    Returns:
        Created OTPCode object
    """
    # Generate OTP
    otp_code = generate_otp()
    
    # Calculate expiry time
    expires_at = datetime.utcnow() + timedelta(minutes=expiry_minutes)
    
    # Create record
    otp_record = OTPCode(
        phone_number=phone_number,
        otp_code=otp_code,
        purpose=purpose,
        expires_at=expires_at,
        verified=False,
        attempts=0
    )
    
    db.add(otp_record)
    db.commit()
    db.refresh(otp_record)
    
    return otp_record


def verify_otp(
    db: Session,
    phone_number: str,
    otp_code: str,
    purpose: str,
    max_attempts: int = 3
) -> bool:
    """
    Verify OTP code
    
    Args:
        db: Database session
        phone_number: User's phone number
        otp_code: The OTP code to verify
        purpose: 'registration', 'login', or 'result_access'
        max_attempts: Maximum allowed attempts (default 3)
    
    Returns:
        True if OTP is valid
    
    Raises:
        HTTPException: If OTP is invalid, expired, or max attempts exceeded
    """
    # Find the most recent OTP for this phone and purpose
    otp_record = db.query(OTPCode).filter(
        OTPCode.phone_number == phone_number,
        OTPCode.purpose == purpose,
        OTPCode.verified == False
    ).order_by(OTPCode.created_at.desc()).first()
    
    if not otp_record:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No OTP found. Please request a new one."
        )
    
    # Check if already verified
    if otp_record.verified:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="OTP already used"
        )
    
    # Check expiry
    if datetime.utcnow() > otp_record.expires_at:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="OTP expired. Please request a new one."
        )
    
    # Increment attempts
    otp_record.attempts += 1
    
    # Check max attempts
    if otp_record.attempts > max_attempts:
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many attempts. Please request a new OTP."
        )
    
    # Verify OTP code
    if otp_record.otp_code != otp_code:
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid OTP. {max_attempts - otp_record.attempts} attempts remaining."
        )
    
    # Mark as verified
    otp_record.verified = True
    db.commit()
    
    return True


def cleanup_expired_otps(db: Session) -> int:
    """
    Delete expired OTP codes from database
    Should be run periodically (e.g., daily cron job)
    
    Returns:
        Number of deleted records
    """
    deleted = db.query(OTPCode).filter(
        OTPCode.expires_at < datetime.utcnow()
    ).delete()
    
    db.commit()
    
    return deleted


def invalidate_previous_otps(
    db: Session,
    phone_number: str,
    purpose: str
) -> int:
    """
    Mark all previous unverified OTPs as verified (invalidate them)
    Useful when generating new OTP to prevent old ones from working
    
    Returns:
        Number of invalidated OTPs
    """
    updated = db.query(OTPCode).filter(
        OTPCode.phone_number == phone_number,
        OTPCode.purpose == purpose,
        OTPCode.verified == False
    ).update({"verified": True})
    
    db.commit()
    
    return updated