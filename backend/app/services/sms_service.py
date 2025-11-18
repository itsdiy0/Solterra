
import logging
from typing import Optional

from twilio.rest import Client
from twilio.base.exceptions import TwilioRestException

from app.config import settings  # or wherever your settings are stored

# Initialize logger
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
            logger.error(f" Failed to send SMS to {to}: {e.msg}")
            return None


# ============================
# Specific message functions
# ============================

def send_otp_sms(phone: str, otp_code: str, mock: bool = True):
    print(f"\n📱 send_otp_sms() called with phone={phone}, otp={otp_code}, mock={mock}")
    sms_service = TwilioSMSService(mock=mock)
    message = f"Your verification code is: {otp_code}. It will expire in 10 minutes."
    print(f"📱 Calling sms_service.send_sms()...")
    result = sms_service.send_sms(phone, message)
    print(f"📱 SMS result: {result}\n")
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
        f" Booking confirmed for {booking_details['event_name']} "
        f"on {booking_details['date']} at {booking_details['time']}.\n"
        f"Ref: {booking_details['ref']}."
    )
    return sms_service.send_sms(phone, message)


def send_booking_cancellation_sms(phone: str, booking_ref: str, mock: bool = True):
    """
    Send booking cancellation SMS.
    """
    sms_service = TwilioSMSService(mock=mock)
    message = (
        f"Your booking with reference {booking_ref} has been cancelled. "
        "If this wasn’t you, please contact support immediately."
    )
    return sms_service.send_sms(phone, message)