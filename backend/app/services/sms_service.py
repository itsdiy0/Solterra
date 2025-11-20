import logging
from typing import Optional

from twilio.rest import Client
from twilio.base.exceptions import TwilioRestException

from app.config import settings

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)


class TwilioSMSService:
    def __init__(self, mock: bool = True):
        """
        Initialize Twilio SMS client.
        If mock=True, messages won't actually be sent (useful for local testing).
        """
        self.mock = mock

        if not mock:
            self.client = Client(
                settings.TWILIO_ACCOUNT_SID,
                settings.TWILIO_AUTH_TOKEN
            )
            self.from_number = settings.TWILIO_PHONE_NUMBER
        else:
            self.client = None
            self.from_number = "mock-number"

    def send_sms(self, to: str, message: str) -> Optional[str]:
        """
        Send a generic SMS message via Twilio or mock it.
        Returns message SID if sent successfully.
        """
        if self.mock:
            print("=" * 60)
            print("[MOCK SMS]")
            print(f"To: {to}")
            print(f"Message:\n{message}")
            print("=" * 60)
            
            logger.info(f"[MOCK SMS] To: {to} | Message: {message}")
            return "mock-sid"

        try:
            msg = self.client.messages.create(
                body=message,
                from_=self.from_number,
                to=to
            )
            logger.info(f"SMS sent successfully to {to} | SID: {msg.sid}")
            return msg.sid

        except TwilioRestException as e:
            logger.error(f"Failed to send SMS to {to}: {e.msg}")
            return None


def send_otp_sms(phone: str, otp_code: str, mock: bool = True):
    """Send OTP verification code via SMS"""
    sms_service = TwilioSMSService(mock=mock)
    message = f"Your verification code is: {otp_code}. It will expire in 10 minutes."
    result = sms_service.send_sms(phone, message)
    return result


def send_booking_confirmation_sms(phone: str, booking_details: dict, mock: bool = True):
    """
    Send booking confirmation SMS.
    booking_details example:
    {
        "event_name": "Concert Night",
        "date": "2025-11-10",
        "time": "7:30 PM",
        "ref": "ABC123"
    }
    """
    sms_service = TwilioSMSService(mock=mock)
    message = (
        f"Booking confirmed for {booking_details['event_name']} "
        f"on {booking_details['date']} at {booking_details['time']}.\n"
        f"Ref: {booking_details['ref']}."
    )
    return sms_service.send_sms(phone, message)


def send_booking_cancellation_sms(phone: str, booking_ref: str, mock: bool = True):
    """Send booking cancellation SMS"""
    sms_service = TwilioSMSService(mock=mock)
    message = (
        f"Your booking with reference {booking_ref} has been cancelled. "
        "If this wasn't you, please contact support immediately."
    )
    return sms_service.send_sms(phone, message)


def send_result_notification_sms(
    phone: str,
    result_category: str,
    booking_reference: str,
    participant_name: str,
    result_url: Optional[str] = None,
    mock: bool = True
) -> dict:
    """
    Send test result notification SMS.
    Different templates for Normal vs Abnormal results.
    """
    sms_service = TwilioSMSService(mock=mock)
    
    if result_category == "Normal":
        message = (
            f"Dear {participant_name},\n\n"
            f"Your screening test results are ready.\n\n"
            f"Result: Normal\n"
            f"Booking Ref: {booking_reference}\n\n"
            f"No further action needed.\n"
            f"View full results: {result_url or 'Login to view'}\n\n"
            f"- ROSE Foundation\n"
            f"Cervical Cancer Screening Program"
        )
    else:
        message = (
            f"Dear {participant_name},\n\n"
            f"Your screening test results are ready.\n\n"
            f"Result: Abnormal - Follow-up Required\n"
            f"Booking Ref: {booking_reference}\n\n"
            f"IMPORTANT: Please contact ROSE Foundation:\n"
            f"Phone: +60-XXX-XXXX\n"
            f"Email: support@rose.org\n\n"
            f"View full results: {result_url or 'Login to view'}\n\n"
            f"- ROSE Foundation"
        )
    
    return sms_service.send_sms(phone, message)