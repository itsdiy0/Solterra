from app.models.participant import Participant
from app.models.admin import Admin
from app.models.event import Event
from app.models.booking import Booking
from app.models.otp_code import OTPCode

# This makes imports easier: from app.models import Participant
__all__ = ["Participant", "Admin", "Event", "Booking", "OTPCode"]