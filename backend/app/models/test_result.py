from sqlalchemy import Column, String, Text, Boolean, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime

from app.database import Base


class TestResult(Base):
    __tablename__ = "test_results"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    booking_id = Column(UUID(as_uuid=True), ForeignKey("bookings.id", ondelete="CASCADE"), nullable=False, unique=True)
    result_category = Column(String(50), nullable=False)  # 'Normal', 'Abnormal - follow up required'
    result_notes = Column(Text, nullable=True)
    result_file_url = Column(Text, nullable=True)  # Cloudinary URL
    uploaded_by = Column(UUID(as_uuid=True), ForeignKey("admins.id"), nullable=False)
    uploaded_at = Column(DateTime, default=datetime.utcnow)
    sms_sent = Column(Boolean, default=False)
    sms_sent_at = Column(DateTime, nullable=True)

    # Relationships
    booking = relationship("Booking", back_populates="test_result")
    uploader = relationship("Admin", foreign_keys=[uploaded_by])

    def __repr__(self):
        return f"<TestResult {self.id} - {self.result_category}>"