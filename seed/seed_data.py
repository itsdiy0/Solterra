import uuid
from datetime import datetime, date, time, timedelta
from sqlalchemy.orm import Session
from app.database import SessionLocal, engine
from app.models import admin, event, participant, booking, test_result
from faker import Faker
import json
import random

# Utility to clear and seed all tables
def seed_all():
    db: Session = SessionLocal()
    try:
        # Clear tables (order matters due to FKs)
        db.query(test_result.TestResult).delete()
        db.query(booking.Booking).delete()
        db.query(event.Event).delete()
        db.query(participant.Participant).delete()
        db.query(admin.Admin).delete()
        db.commit()

        # Admins
        admin1 = admin.Admin(
            id=uuid.uuid4(),
            name="Alice Admin",
            email="alice@example.com",
            password_hash="hash1",
            role="admin",
            email_verified=True
        )
        admin2 = admin.Admin(
            id=uuid.uuid4(),
            name="Bob SuperAdmin",
            email="bob@example.com",
            password_hash="hash2",
            role="superadmin",
            email_verified=False
        )
        # Add a test admin with known credentials
        test_admin = admin.Admin(
            id=uuid.uuid4(),
            name="Test Admin",
            email="testadmin@example.com",
            password_hash="$2b$12$kK8fowOslsTbSn9DGoBFxehSTIE1xPwEMdehhIqcP0Fc2d3.h1sfq",  # password: testpassword
            role="admin",
            email_verified=True
        )
        db.add_all([admin1, admin2, test_admin])
        db.commit()


        # Events (including from test admin)
        event1 = event.Event(
            id=uuid.uuid4(),
            event_code="EVT001",
            name="Health Fair",
            event_date=date.today() + timedelta(days=7),
            event_time=time(9, 0),
            address="123 Main St",
            latitude=3.139,
            longitude=101.6869,
            time_slots=[{"start": "09:00", "end": "10:00", "slots": 20, "available": 20}],
            total_slots=20,
            available_slots=20,
            additional_info="Annual event",
            status="published",
            created_by=admin1.id
        )
        event2 = event.Event(
            id=uuid.uuid4(),
            event_code="EVT002",
            name="Blood Drive",
            event_date=date.today() + timedelta(days=14),
            event_time=time(10, 0),
            address="456 Side St",
            latitude=3.150,
            longitude=101.7000,
            time_slots=None,
            total_slots=50,
            available_slots=50,
            additional_info=None,
            status="draft",
            created_by=admin2.id
        )
        event3 = event.Event(
            id=uuid.uuid4(),
            event_code="EVT003",
            name="Test Admin Event",
            event_date=date.today() + timedelta(days=10),
            event_time=time(11, 0),
            address="789 Test Ave",
            latitude=3.160,
            longitude=101.7100,
            time_slots=[{"start": "11:00", "end": "12:00", "slots": 10, "available": 10}],
            total_slots=10,
            available_slots=10,
            additional_info="Created by test admin",
            status="published",
            created_by=test_admin.id
        )
        db.add_all([event1, event2, event3])
        db.commit()




        # Use Faker to generate more admins/events/participants and bookings
        fake = Faker()

        NUM_ADMINS = 10
        NUM_EVENTS = 100
        NUM_PARTICIPANTS = 100

        # Create additional admins
        additional_admins = []
        for i in range(3, NUM_ADMINS):
            a = admin.Admin(
                id=uuid.uuid4(),
                name=fake.name(),
                email=fake.unique.safe_email(),
                password_hash="hash_placeholder",
                role="admin",
                email_verified=(i % 2 == 0)
            )
            additional_admins.append(a)
        db.add_all(additional_admins)
        db.commit()

        # All admins for assignment
        admins = [admin1, admin2, test_admin] + additional_admins

        # Create additional events up to NUM_EVENTS
        all_events = [event1, event2, event3]
        for i in range(4, NUM_EVENTS + 1):
            has_slots = (i % 3 != 0)
            if has_slots:
                # create 1-3 time slots totaling total_slots
                slot_count = fake.random_int(min=1, max=3)
                slots = []
                total = 0
                start_hour = fake.random_int(min=8, max=15)
                for s in range(slot_count):
                    st = f"{start_hour + s:02d}:00"
                    et = f"{start_hour + s + 1:02d}:00"
                    slot_size = fake.random_int(min=5, max=30)
                    total += slot_size
                    slots.append({"start": st, "end": et, "slots": slot_size, "available": slot_size})
                total_slots = total
            else:
                slots = None
                total_slots = fake.random_int(min=20, max=100)

            ev = event.Event(
                id=uuid.uuid4(),
                event_code=f"EVT{i:03d}",
                name=fake.sentence(nb_words=3),
                event_date=date.today() + timedelta(days=fake.random_int(min=1, max=60)),
                event_time=time(fake.random_int(min=8, max=16), 0),
                address=fake.address(),
                latitude=round(fake.latitude(), 6),
                longitude=round(fake.longitude(), 6),
                time_slots=slots,
                total_slots=total_slots,
                available_slots=total_slots,
                additional_info=None,
                status="published" if (i % 4 != 0) else "draft",
                created_by=fake.random_element(admins).id
            )
            all_events.append(ev)
        db.add_all(all_events[3:])
        db.commit()

        # Create participants up to NUM_PARTICIPANTS (keep existing ones)
        participants = []
        # Add a test participant with known credentials
        test_participant = participant.Participant(
            id=uuid.uuid4(),
            name="Test User",
            phone_number="0111111111",
            mykad_id="900101099999",
            phone_verified=True
        )
        participants.append(test_participant)
        current_count = len(participants)
        for i in range(current_count + 1, NUM_PARTICIPANTS + 1):
            p = participant.Participant(
                id=uuid.uuid4(),
                name=fake.name(),
                phone_number=f"01{fake.random_number(digits=8, fix_len=True)}",
                mykad_id=str(fake.random_number(digits=12, fix_len=True)),
                phone_verified=fake.boolean(chance_of_getting_true=50)
            )
            participants.append(p)
        db.add_all(participants[current_count:])
        db.commit()

        # Bookings: for each event randomly book participants up to its total_slots
        bookings = []
        booking_ref = 1
        # Refresh participants from DB to ensure referential integrity
        participants_db = db.query(participant.Participant).all()
        for ev in all_events:
            slot_participants = fake.random_int(min=0, max=min(ev.total_slots, 30))
            # pick unique participants from DB
            chosen = random.sample(participants_db, k=min(slot_participants, len(participants_db)))
            for p in chosen:
                status = "confirmed" if fake.boolean(chance_of_getting_true=75) else "cancelled"
                # assign a time slot if event has slots
                if ev.time_slots:
                    slot = random.choice(ev.time_slots)
                    start_h = int(slot["start"].split(":")[0])
                    slot_start = time(start_h, 0)
                    slot_end = time(start_h + 1, 0)
                else:
                    slot_start = None
                    slot_end = None

                bookings.append(booking.Booking(
                    id=uuid.uuid4(),
                    participant_id=p.id,
                    event_id=ev.id,
                    booking_reference=f"B{booking_ref:07d}",
                    booking_status=status,
                    booked_at=datetime.utcnow(),
                    cancelled_at=(datetime.utcnow() if status == "cancelled" else None),
                    time_slot_start=slot_start,
                    time_slot_end=slot_end
                ))
                booking_ref += 1

        db.add_all(bookings)
        db.commit()

        # Recalculate event slots based on confirmed bookings
        # Persist updated available_slots and time_slots explicitly
        for ev in db.query(event.Event).all():
            confirmed_count = db.query(booking.Booking).filter(
                booking.Booking.event_id == ev.id,
                booking.Booking.booking_status == "confirmed"
            ).count()

            slots = ev.time_slots
            if slots:
                if isinstance(slots, str):
                    try:
                        slots = json.loads(slots)
                    except Exception:
                        slots = []

                for slot in slots:
                    start = slot.get("start")
                    if start:
                        try:
                            t = datetime.strptime(start, "%H:%M").time()
                        except Exception:
                            t = None
                    else:
                        t = None

                    if t:
                        booked_in_slot = db.query(booking.Booking).filter(
                            booking.Booking.event_id == ev.id,
                            booking.Booking.booking_status == "confirmed",
                            booking.Booking.time_slot_start == t,
                        ).count()
                    else:
                        booked_in_slot = 0

                    slot["available"] = max(0, slot.get("slots", 0) - booked_in_slot)

            # Use a direct update to ensure DB change is persisted
            db.query(event.Event).filter(event.Event.id == ev.id).update({
                event.Event.available_slots: max(0, ev.total_slots - confirmed_count),
                event.Event.time_slots: slots
            })
        db.commit()
        # Create random test results for a subset of confirmed bookings
        confirmed_bookings = db.query(booking.Booking).filter(booking.Booking.booking_status == "confirmed").all()
        results = []
        sample_count = max(1, len(confirmed_bookings) // 10)
        for b in random.sample(confirmed_bookings, k=min(sample_count, len(confirmed_bookings))):
            cat = random.choice(["Normal", "Abnormal - follow up required"])
            results.append(test_result.TestResult(
                id=uuid.uuid4(),
                booking_id=b.id,
                result_category=cat,
                result_notes=("See doctor" if "Abnormal" in cat else "All good"),
                result_file_url=(None if random.random() < 0.5 else f"http://example.com/{b.id}.pdf"),
                uploaded_by=random.choice(admins).id,
                sms_sent=random.choice([True, False]),
                sms_sent_at=(datetime.utcnow() if random.random() < 0.5 else None)
            ))
        if results:
            db.add_all(results)
            db.commit()



        print("Seed data inserted successfully.")
    finally:
        db.close()

if __name__ == "__main__":
    seed_all()
