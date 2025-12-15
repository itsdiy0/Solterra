from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models import admin, event, participant, booking, test_result

# Utility to clear all tables (order matters due to FKs)
def clear_all():
    db: Session = SessionLocal()
    try:
        db.query(test_result.TestResult).delete()
        db.query(booking.Booking).delete()
        db.query(event.Event).delete()
        db.query(participant.Participant).delete()
        db.query(admin.Admin).delete()
        db.commit()
        print("All data deleted successfully.")
    finally:
        db.close()

if __name__ == "__main__":
    clear_all()
