from sqlalchemy import Column, String, Boolean, Integer, DateTime
from sqlalchemy.dialects.postgresql import UUID
import uuid
from datetime import datetime

from app.database import Base


class OTPCode(Base):
    __tablename__ = "otp_codes"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    phone_number = Column(String(20), nullable=False, index=True)
    otp_code = Column(String(6), nullable=False)
    purpose = Column(String(50), nullable=False)  # 'registration', 'login', 'result_access'
    created_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime, nullable=False, index=True)
    verified = Column(Boolean, default=False)
    attempts = Column(Integer, default=0)

    def __repr__(self):
        return f"<OTPCode {self.phone_number} - {self.purpose}>"