from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
from uuid import UUID

from app.database import get_db
from app.models.admin import Admin
from app.models.participant import Participant
from app.models.booking import Booking
from app.models.test_result import TestResult
from app.schemas.result import (
    ResultUploadRequest,
    ResultResponse,
    ResultListResponse,
    SendResultSMSRequest,
    SendResultSMSResponse,
    ParticipantResultResponse,
    RequestResultOTPResponse,
    ViewResultResponse
)
from app.utils.security import get_current_admin, get_current_participant
from app.services.file_upload_service import file_upload_service
from app.services.sms_service import send_result_notification_sms
from app.services.otp_service import create_otp_record, verify_otp

router = APIRouter(tags=["Results"])


# ADMIN ROUTES
@router.post("/admin/results", response_model=ResultResponse)
async def upload_result(
    booking_id: str = File(...),
    result_category: str = File(...),
    result_notes: str = File(None),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin)
):
    """
    Admin uploads test result for a participant.
    Only checked-in participants can receive results.
    """
    
    # Verify booking exists and is checked-in
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    if booking.booking_status != "checked_in":
        raise HTTPException(
            status_code=400,
            detail="Cannot upload result for participant who hasn't checked in"
        )
    
    # Check if result already exists for this booking
    existing_result = db.query(TestResult).filter(
        TestResult.booking_id == booking_id
    ).first()
    
    if existing_result:
        raise HTTPException(
            status_code=400,
            detail="Result already uploaded for this booking"
        )
    
    # Upload PDF to Cloudinary
    file_content = await file.read()
    file_url = file_upload_service.upload_result_pdf(
        file_content=file_content,
        booking_id=booking_id,
        filename=file.filename or "result.pdf"
    )
    
    # Create result record
    test_result = TestResult(
        booking_id=booking_id,
        result_category=result_category,
        result_notes=result_notes,
        result_file_url=file_url,
        uploaded_by=current_admin.id,
        sms_sent=False
    )
    
    db.add(test_result)
    db.commit()
    db.refresh(test_result)
    
    return test_result


@router.post("/admin/results/{result_id}/send-sms", response_model=SendResultSMSResponse)
def send_result_sms(
    result_id: UUID,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin)
):
    """
    Admin sends SMS notification when result is ready.
    """
    
    # Get result with related booking and participant
    result = db.query(TestResult).filter(TestResult.id == result_id).first()
    
    if not result:
        raise HTTPException(status_code=404, detail="Result not found")
    
    if result.sms_sent:
        raise HTTPException(
            status_code=400,
            detail="SMS already sent for this result"
        )
    
    # Get booking and participant info
    booking = result.booking
    participant = booking.participant
    
    # Send SMS notification
    send_result_notification_sms(
        phone=participant.phone_number,
        result_category=result.result_category,
        booking_reference=booking.booking_reference,
        participant_name=participant.name,
        result_url=f"https://rose.org/results/{result.id}",  # Update with actual URL
        mock=True
    )
    
    # Mark SMS as sent
    result.sms_sent = True
    result.sms_sent_at = datetime.utcnow()
    db.commit()
    
    return SendResultSMSResponse(
        message=f"Result notification sent to {participant.phone_number}",
        sms_sent=True
    )


@router.get("/admin/results", response_model=ResultListResponse)
def get_all_results(
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin)
):
    """
    Admin views all test results.
    """
    results = db.query(TestResult).order_by(TestResult.uploaded_at.desc()).all()
    
    return ResultListResponse(
        results=results,
        total=len(results)
    )


# PARTICIPANT ROUTES
@router.get("/participant/results", response_model=List[ParticipantResultResponse])
def get_my_results(
    db: Session = Depends(get_db),
    current_participant: Participant = Depends(get_current_participant)
):
    """
    Participant views their test results from past attended events.
    Shows results pending for attended events without processed results.
    """
    
    # Get all bookings for this participant
    bookings = db.query(Booking).filter(
        Booking.participant_id == current_participant.id,
        Booking.booking_status == "checked_in"  # Only attended events
    ).all()
    
    results = []
    
    for booking in bookings:
        if booking.test_result:
            # Result available
            results.append(
                ParticipantResultResponse(
                    id=str(booking.test_result.id),
                    event_name=booking.event.name,
                    event_date=str(booking.event.event_date),
                    result_category=booking.test_result.result_category,
                    result_available=True,
                    uploaded_at=booking.test_result.uploaded_at
                )
            )
        else:
            # Result pending
            results.append(
                ParticipantResultResponse(
                    id=str(booking.id),
                    event_name=booking.event.name,
                    event_date=str(booking.event.event_date),
                    result_category="Pending",
                    result_available=False,
                    uploaded_at=booking.booked_at
                )
            )
    
    return results


@router.post("/participant/results/{result_id}/request-otp", response_model=RequestResultOTPResponse)
def request_result_otp(
    result_id: UUID,
    db: Session = Depends(get_db),
    current_participant: Participant = Depends(get_current_participant)
):
    """
    Request OTP to view detailed result (PDPA security).
    """
    
    # Verify result belongs to this participant
    result = db.query(TestResult).filter(TestResult.id == result_id).first()
    
    if not result:
        raise HTTPException(status_code=404, detail="Result not found")
    
    if result.booking.participant_id != current_participant.id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Generate OTP
    from app.services.otp_service import invalidate_previous_otps
    
    invalidate_previous_otps(db, current_participant.phone_number, "result_access")
    
    otp_record = create_otp_record(
        db=db,
        phone_number=current_participant.phone_number,
        purpose="result_access"
    )
    
    # Send OTP via SMS
    from app.services.sms_service import send_otp_sms
    
    send_otp_sms(
        phone=current_participant.phone_number,
        otp_code=otp_record.otp_code,
        mock=True
    )
    
    print(f"OTP sent to {current_participant.phone_number}: {otp_record.otp_code}")
    
    return RequestResultOTPResponse(
        message=f"OTP sent to {current_participant.phone_number} to verify identity",
        phone_number=current_participant.phone_number
    )


@router.post("/participant/results/{result_id}/view", response_model=ViewResultResponse)
def view_result_with_otp(
    result_id: UUID,
    otp_code: str,
    db: Session = Depends(get_db),
    current_participant: Participant = Depends(get_current_participant)
):
    """
    View detailed result after OTP verification (PDPA compliance).
    """
    
    # Verify result exists and belongs to participant
    result = db.query(TestResult).filter(TestResult.id == result_id).first()
    
    if not result:
        raise HTTPException(status_code=404, detail="Result not found")
    
    if result.booking.participant_id != current_participant.id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Verify OTP
    is_valid = verify_otp(
        db=db,
        phone_number=current_participant.phone_number,
        otp_code=otp_code,
        purpose="result_access"
    )
    
    if not is_valid:
        raise HTTPException(status_code=400, detail="Invalid or expired OTP")
    
    # Generate time-limited signed URL for PDF (1 hour validity)
    secure_url = None
    if result.result_file_url:
        # Extract public_id from Cloudinary URL
        # Format: https://res.cloudinary.com/{cloud}/raw/upload/v123/test_results/{booking_id}/filename
        # We need: test_results/{booking_id}/filename
        url_parts = result.result_file_url.split('/upload/')
        if len(url_parts) > 1:
            public_id = url_parts[1].split('.')[0]  # Remove extension
            secure_url = file_upload_service.generate_signed_url(public_id, expires_in_hours=1)
        else:
            secure_url = result.result_file_url  # Fallback
    
    return ViewResultResponse(
        result_category=result.result_category,
        result_notes=result.result_notes,
        result_file_url=secure_url,
        event_name=result.booking.event.name,
        event_date=str(result.booking.event.event_date)
    )


@router.get("/admin/results/{result_id}", response_model=ResultResponse)
def get_result_by_id(
    result_id: UUID,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin)
):
    """Admin views specific result details"""
    
    result = db.query(TestResult).filter(TestResult.id == result_id).first()
    
    if not result:
        raise HTTPException(status_code=404, detail="Result not found")
    
    return result