"""
Solterra Database Seed Script (Demo Version)
ROSE Foundation Event Management System

Booking Status Flow:
- Confirmed: Participant has booked
- Checked-in: Participant arrived at event
- Completed: Checked-in + test results uploaded
- Cancelled: Booking cancelled

Test Result Categories:
- Normal
- Abnormal

Run from backend directory:
    python seed_data.py
"""

import uuid
import random
from datetime import datetime, date, time, timedelta
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models import admin, event, participant, booking, test_result


# ============================================================
# PRE-GENERATED UUIDs - All relationships use these
# ============================================================

# Admins
ADMIN_1_UUID = uuid.uuid4()
ADMIN_2_UUID = uuid.uuid4()

# Participants (12 total)
PARTICIPANT_UUIDS = [uuid.uuid4() for _ in range(12)]


# ============================================================
# DEMO DATA
# ============================================================

PARTICIPANT_DATA = [
    {"uuid": PARTICIPANT_UUIDS[0], "name": "Siti Aminah binti Yusof", "phone": "+60123456001", "mykad": "780315-01-5234"},
    {"uuid": PARTICIPANT_UUIDS[1], "name": "Tan Mei Ling", "phone": "+60163456002", "mykad": "850622-07-5126"},
    {"uuid": PARTICIPANT_UUIDS[2], "name": "Kavitha a/p Muthu", "phone": "+60173456003", "mykad": "900810-10-5348"},
    {"uuid": PARTICIPANT_UUIDS[3], "name": "Faridah binti Hassan", "phone": "+60133456004", "mykad": "761105-04-5572"},
    {"uuid": PARTICIPANT_UUIDS[4], "name": "Wong Siew Mei", "phone": "+60183456005", "mykad": "880219-12-5684"},
    {"uuid": PARTICIPANT_UUIDS[5], "name": "Rohana binti Abdullah", "phone": "+60193456006", "mykad": "720930-01-5896"},
    {"uuid": PARTICIPANT_UUIDS[6], "name": "Lakshmi a/p Rajan", "phone": "+60123456007", "mykad": "830714-11-5108"},
    {"uuid": PARTICIPANT_UUIDS[7], "name": "Norazlina binti Mohd Nor", "phone": "+60163456008", "mykad": "910428-03-5220"},
    {"uuid": PARTICIPANT_UUIDS[8], "name": "Chong Suk Yin", "phone": "+60173456009", "mykad": "680812-08-5332"},
    {"uuid": PARTICIPANT_UUIDS[9], "name": "Prema a/p Subramaniam", "phone": "+60133456010", "mykad": "790126-05-5444"},
    {"uuid": PARTICIPANT_UUIDS[10], "name": "Zainab binti Ismail", "phone": "+60183456011", "mykad": "850509-02-5556"},
    {"uuid": PARTICIPANT_UUIDS[11], "name": "Lim Ai Ling", "phone": "+60193456012", "mykad": "700821-07-5668"},
]

PPR_LOCATIONS = [
    {"name": "PPR Kerinchi", "code": "KER", "address": "Dewan Komuniti PPR Kerinchi, Jalan Pantai Dalam, 59200 Kuala Lumpur", "lat": 3.10726500, "lng": 101.66398200},
    {"name": "Flat Sri Pahang", "code": "SRP", "address": "Dewan Serbaguna Flat Sri Pahang, Jalan Bangsar, 59000 Kuala Lumpur", "lat": 3.12889400, "lng": 101.67284600},
    {"name": "PPR Pantai Ria", "code": "PTR", "address": "Balai Raya PPR Pantai Ria, Jalan Pantai, 59100 Kuala Lumpur", "lat": 3.10142800, "lng": 101.66847300},
    {"name": "PPR Desa Rejang", "code": "DSR", "address": "Dewan PPR Desa Rejang, Jalan Rejang, Setapak, 53300 Kuala Lumpur", "lat": 3.18724600, "lng": 101.71892300},
    {"name": "PPR Lembah Subang", "code": "LBS", "address": "Balai Raya PPR Lembah Subang 1, Jalan SS13/1, 47500 Subang Jaya, Selangor", "lat": 3.04726800, "lng": 101.59374500},
    {"name": "PPR Seri Semarak", "code": "SSM", "address": "Dewan Komuniti PPR Seri Semarak, Jalan Semarak, 54000 Kuala Lumpur", "lat": 3.17283400, "lng": 101.70192800},
]


def generate_event_code(location_code: str) -> str:
    """Generate event code: XXX-XXXX (3 letter location code - 4 random digits)"""
    random_digits = random.randint(1000, 9999)
    return f"{location_code}-{random_digits}"


def generate_time_slots(start_hour: int = 9, num_slots: int = 6, capacity: int = 5) -> list:
    slots = []
    for i in range(num_slots):
        hour = start_hour + (i // 2)
        minute = 30 if i % 2 else 0
        start = f"{hour:02d}:{minute:02d}"
        end_hour = hour if minute == 0 else hour + 1
        end_minute = 30 if minute == 0 else 0
        end = f"{end_hour:02d}:{end_minute:02d}"
        slots.append({"start": start, "end": end, "capacity": capacity, "available": capacity})
    return slots


# ============================================================
# MAIN SEED
# ============================================================

def seed_all():
    db: Session = SessionLocal()
    
    admin_uuids = [ADMIN_1_UUID, ADMIN_2_UUID]
    
    try:
        # ============================================================
        # ASK USER WHETHER TO CLEAR EXISTING DATA
        # ============================================================
        print("\n" + "=" * 60)
        print("SOLTERRA DATABASE SEED SCRIPT")
        print("=" * 60)
        
        # Check existing data counts
        existing_admins = db.query(admin.Admin).count()
        existing_participants = db.query(participant.Participant).count()
        existing_events = db.query(event.Event).count()
        existing_bookings = db.query(booking.Booking).count()
        existing_results = db.query(test_result.TestResult).count()
        
        print("\nExisting data in database:")
        print(f"   Admins:        {existing_admins}")
        print(f"   Participants:  {existing_participants}")
        print(f"   Events:        {existing_events}")
        print(f"   Bookings:      {existing_bookings}")
        print(f"   Test Results:  {existing_results}")
        
        print("\n" + "-" * 60)
        print("Options:")
        print("   [1] Clear all existing data and seed fresh")
        print("   [2] Keep existing data and add seed data (may cause conflicts)")
        print("   [3] Cancel and exit")
        print("-" * 60)
        
        choice = input("\nEnter your choice (1/2/3): ").strip()
        
        if choice == "3":
            print("\nOperation cancelled. No changes made.")
            return
        elif choice == "1":
            print("\n[CLEARING] Removing existing data...")
            db.query(test_result.TestResult).delete()
            db.query(booking.Booking).delete()
            db.query(event.Event).delete()
            db.query(participant.Participant).delete()
            db.query(admin.Admin).delete()
            db.commit()
            print("   Done - all tables cleared")
        elif choice == "2":
            print("\n[KEEPING] Existing data will be retained")
            print("   Warning: This may cause duplicate key errors")
        else:
            print("\nInvalid choice. Operation cancelled.")
            return
        
        # ============================================================
        # 2 ADMINS
        # ============================================================
        print("\n[ADMINS] Creating 2 admins...")
        
        admin1 = admin.Admin(
            id=ADMIN_1_UUID,
            name="Dr. Sarah Tan",
            email="sarah.tan@rosefoundation.my",
            password_hash="$2b$12$ExmyrsSashF61m2W22l1AuHgn1ht3du7dFkU76tp5JGpo1tThqwfW",  # TestPass123!
            role="admin",
            email_verified=True
        )
        
        admin2 = admin.Admin(
            id=ADMIN_2_UUID,
            name="Nurul Aisyah binti Ahmad",
            email="nurul.aisyah@rosefoundation.my",
            password_hash="$2b$12$ExmyrsSashF61m2W22l1AuHgn1ht3du7dFkU76tp5JGpo1tThqwfW",  # TestPass123!
            role="admin",
            email_verified=True
        )
        
        db.add_all([admin1, admin2])
        db.commit()
        
        print(f"   + {admin1.name} | {admin1.email}")
        print(f"   + {admin2.name} | {admin2.email}")
        
        # ============================================================
        # 12 PARTICIPANTS
        # ============================================================
        print("\n[PARTICIPANTS] Creating 12 participants...")
        
        participants = []
        for p_data in PARTICIPANT_DATA:
            p = participant.Participant(
                id=p_data["uuid"],
                name=p_data["name"],
                phone_number=p_data["phone"],
                mykad_id=p_data["mykad"],
                phone_verified=True
            )
            participants.append(p)
            print(f"   + {p.name} | {p.phone_number}")
        
        db.add_all(participants)
        db.commit()
        
        # ============================================================
        # 6 EVENTS with XXX-XXXX format codes
        # ============================================================
        print("\n[EVENTS] Creating 6 events...")
        
        events = []
        event_to_admin = {}
        
        event_configs = [
            {"status": "completed", "days_offset": -14, "loc_idx": 0, "admin_idx": 0},
            {"status": "completed", "days_offset": -7, "loc_idx": 1, "admin_idx": 1},
            {"status": "ongoing", "days_offset": 0, "loc_idx": 2, "admin_idx": 0},
            {"status": "published", "days_offset": 3, "loc_idx": 3, "admin_idx": 1},
            {"status": "published", "days_offset": 7, "loc_idx": 4, "admin_idx": 0},
            {"status": "draft", "days_offset": 14, "loc_idx": 5, "admin_idx": 1},
        ]
        
        for config in event_configs:
            loc = PPR_LOCATIONS[config["loc_idx"]]
            creator_uuid = admin_uuids[config["admin_idx"]]
            
            event_date = date.today() + timedelta(days=config["days_offset"])
            
            total_slots = 24
            time_slots = generate_time_slots(capacity=4)
            
            event_code = generate_event_code(loc["code"])
            
            ev_id = uuid.uuid4()
            event_to_admin[ev_id] = creator_uuid
            
            ev = event.Event(
                id=ev_id,
                event_code=event_code,
                name=f"ROSE Screening - {loc['name']}",
                event_date=event_date,
                event_time=time(9, 0),
                address=loc["address"],
                latitude=loc["lat"],
                longitude=loc["lng"],
                time_slots=time_slots,
                total_slots=total_slots,
                available_slots=total_slots,
                additional_info="Free cervical cancer screening for B40 women. Please bring MyKad.",
                status=config["status"],
                created_by=creator_uuid
            )
            events.append(ev)
            
            owner_name = "Dr. Sarah Tan" if creator_uuid == ADMIN_1_UUID else "Nurul Aisyah"
            print(f"   + {event_code} [{config['status']}] | {loc['name']} | Owner: {owner_name}")
        
        db.add_all(events)
        db.commit()
        
        # ============================================================
        # BOOKINGS
        # Statuses: Confirmed, Checked-in, Completed, Cancelled
        # ============================================================
        print("\n[BOOKINGS] Creating bookings...")
        
        all_bookings = []
        booking_map = {}
        bookings_to_complete = []
        
        time_slot_options = [
            (time(9, 0), time(9, 30)),
            (time(9, 30), time(10, 0)),
            (time(10, 0), time(10, 30)),
            (time(10, 30), time(11, 0)),
            (time(11, 0), time(11, 30)),
            (time(11, 30), time(12, 0)),
        ]
        
        booking_configs = {
            0: {  # Completed event 1 - 8 participants
                "bookings": [
                    {"p_idx": 0, "status": "Checked-in", "will_have_results": True},
                    {"p_idx": 1, "status": "Checked-in", "will_have_results": True},
                    {"p_idx": 2, "status": "Checked-in", "will_have_results": True},
                    {"p_idx": 3, "status": "Checked-in", "will_have_results": True},
                    {"p_idx": 4, "status": "Checked-in", "will_have_results": True},
                    {"p_idx": 5, "status": "Checked-in", "will_have_results": True},
                    {"p_idx": 6, "status": "Checked-in", "will_have_results": False},
                    {"p_idx": 7, "status": "Cancelled", "will_have_results": False},
                ]
            },
            1: {  # Completed event 2 - 6 participants
                "bookings": [
                    {"p_idx": 2, "status": "Checked-in", "will_have_results": True},
                    {"p_idx": 3, "status": "Checked-in", "will_have_results": True},
                    {"p_idx": 4, "status": "Checked-in", "will_have_results": True},
                    {"p_idx": 8, "status": "Checked-in", "will_have_results": True},
                    {"p_idx": 9, "status": "Checked-in", "will_have_results": False},
                    {"p_idx": 10, "status": "Cancelled", "will_have_results": False},
                ]
            },
            2: {  # Ongoing event - 7 participants
                "bookings": [
                    {"p_idx": 0, "status": "Checked-in", "will_have_results": False},
                    {"p_idx": 1, "status": "Checked-in", "will_have_results": False},
                    {"p_idx": 5, "status": "Checked-in", "will_have_results": False},
                    {"p_idx": 6, "status": "Confirmed", "will_have_results": False},
                    {"p_idx": 7, "status": "Confirmed", "will_have_results": False},
                    {"p_idx": 8, "status": "Confirmed", "will_have_results": False},
                    {"p_idx": 11, "status": "Cancelled", "will_have_results": False},
                ]
            },
            3: {  # Published event 1 - 5 participants
                "bookings": [
                    {"p_idx": 0, "status": "Confirmed", "will_have_results": False},
                    {"p_idx": 2, "status": "Confirmed", "will_have_results": False},
                    {"p_idx": 4, "status": "Confirmed", "will_have_results": False},
                    {"p_idx": 9, "status": "Confirmed", "will_have_results": False},
                    {"p_idx": 11, "status": "Confirmed", "will_have_results": False},
                ]
            },
            4: {  # Published event 2 - 4 participants
                "bookings": [
                    {"p_idx": 1, "status": "Confirmed", "will_have_results": False},
                    {"p_idx": 3, "status": "Confirmed", "will_have_results": False},
                    {"p_idx": 6, "status": "Confirmed", "will_have_results": False},
                    {"p_idx": 10, "status": "Confirmed", "will_have_results": False},
                ]
            },
        }
        
        for ev_idx, ev in enumerate(events):
            if ev_idx not in booking_configs:
                continue
            
            config = booking_configs[ev_idx]
            booking_map[ev.id] = []
            
            for seq, bk_config in enumerate(config["bookings"], 1):
                p_idx = bk_config["p_idx"]
                p_uuid = PARTICIPANT_UUIDS[p_idx]
                status = bk_config["status"]
                will_have_results = bk_config["will_have_results"]
                
                slot_start, slot_end = time_slot_options[seq % len(time_slot_options)]
                
                bk = booking.Booking(
                    id=uuid.uuid4(),
                    participant_id=p_uuid,
                    event_id=ev.id,
                    booking_reference=f"{ev.event_code}-{seq:03d}",
                    booking_status=status,
                    booked_at=datetime.utcnow() - timedelta(days=random.randint(1, 7)),
                    cancelled_at=datetime.utcnow() if status == "Cancelled" else None,
                    time_slot_start=slot_start,
                    time_slot_end=slot_end
                )
                all_bookings.append(bk)
                booking_map[ev.id].append(bk)
                
                if will_have_results:
                    bookings_to_complete.append(bk)
                
                p_name = PARTICIPANT_DATA[p_idx]["name"]
                results_note = " -> will get results" if will_have_results else ""
                print(f"   + {ev.event_code}-{seq:03d} | {p_name} | {status}{results_note}")
        
        db.add_all(all_bookings)
        db.commit()
        
        # ============================================================
        # TEST RESULTS - Categories: Normal, Abnormal
        # ============================================================
        print("\n[TEST RESULTS] Creating test results...")
        
        results = []
        
        result_configs = [
            {"category": "Normal", "sms_sent": True, "notes": "No abnormalities detected. Recommend routine screening in 3 years."},
            {"category": "Normal", "sms_sent": True, "notes": "Normal cervical cells. Continue regular check-ups."},
            {"category": "Normal", "sms_sent": False, "notes": "All clear. No further action required."},
            {"category": "Abnormal", "sms_sent": True, "notes": "Abnormal cells detected. Referred to Hospital KL for colposcopy."},
            {"category": "Normal", "sms_sent": True, "notes": "Healthy cervical tissue. Next screening in 3-5 years."},
            {"category": "Normal", "sms_sent": False, "notes": "No HPV detected. Normal results."},
            {"category": "Abnormal", "sms_sent": True, "notes": "Abnormal findings. Urgent follow-up required."},
            {"category": "Normal", "sms_sent": True, "notes": "Test completed successfully. No concerns."},
            {"category": "Normal", "sms_sent": False, "notes": "Normal screening results."},
            {"category": "Normal", "sms_sent": True, "notes": "All tests negative. Healthy results."},
        ]
        
        for i, bk in enumerate(bookings_to_complete):
            config = result_configs[i % len(result_configs)]
            event_admin_uuid = event_to_admin[bk.event_id]
            p_name = next(p["name"] for p in PARTICIPANT_DATA if p["uuid"] == bk.participant_id)
            
            tr = test_result.TestResult(
                id=uuid.uuid4(),
                booking_id=bk.id,
                result_category=config["category"],
                result_notes=config["notes"],
                result_file_url=f"https://res.cloudinary.com/rose/{bk.id}.pdf",
                uploaded_by=event_admin_uuid,
                uploaded_at=datetime.utcnow() - timedelta(days=random.randint(1, 5)),
                sms_sent=config["sms_sent"],
                sms_sent_at=datetime.utcnow() - timedelta(days=random.randint(1, 3)) if config["sms_sent"] else None
            )
            results.append(tr)
            
            sms_status = "sent" if config["sms_sent"] else "NOT SENT"
            print(f"   + {p_name} | {config['category']} | SMS: {sms_status}")
        
        db.add_all(results)
        db.commit()
        
        # ============================================================
        # UPDATE BOOKING STATUS: Checked-in -> Completed (if has results)
        # ============================================================
        print("\n[UPDATE] Marking bookings with results as 'Completed'...")
        
        for bk in bookings_to_complete:
            db.query(booking.Booking).filter(booking.Booking.id == bk.id).update({
                booking.Booking.booking_status: "Completed"
            })
            bk.booking_status = "Completed"
        
        db.commit()
        
        completed_count = sum(1 for b in all_bookings if b.booking_status == "Completed")
        print(f"   {completed_count} bookings marked as 'Completed'")
        
        # ============================================================
        # UPDATE EVENT AVAILABILITY
        # ============================================================
        print("\n[UPDATE] Updating slot availability...")
        
        for ev in events:
            active_bookings = sum(1 for b in all_bookings if b.event_id == ev.id and b.booking_status in ["Confirmed", "Checked-in", "Completed"])
            
            if ev.time_slots:
                for slot in ev.time_slots:
                    st = time(int(slot["start"].split(":")[0]), int(slot["start"].split(":")[1]))
                    booked = sum(1 for b in all_bookings if b.event_id == ev.id and b.booking_status in ["Confirmed", "Checked-in", "Completed"] and b.time_slot_start == st)
                    slot["available"] = max(0, slot["capacity"] - booked)
            
            db.query(event.Event).filter(event.Event.id == ev.id).update({
                event.Event.available_slots: max(0, ev.total_slots - active_bookings),
                event.Event.time_slots: ev.time_slots
            })
        
        db.commit()
        print("   Done")
        
        # ============================================================
        # SUMMARY
        # ============================================================
        sms_sent_count = sum(1 for r in results if r.sms_sent)
        sms_unsent_count = sum(1 for r in results if not r.sms_sent)
        normal_count = sum(1 for r in results if r.result_category == "Normal")
        abnormal_count = sum(1 for r in results if r.result_category == "Abnormal")
        
        status_counts = {}
        for b in all_bookings:
            status_counts[b.booking_status] = status_counts.get(b.booking_status, 0) + 1
        
        print("\n" + "=" * 60)
        print("SEED COMPLETE")
        print("=" * 60)
        print(f"   Admins:        2")
        print(f"   Participants:  12")
        print(f"   Events:        6")
        print(f"   Bookings:      {len(all_bookings)}")
        print(f"   Test Results:  {len(results)}")
        
        print("\nBooking Status Breakdown:")
        for status, count in sorted(status_counts.items()):
            print(f"   - {status}: {count}")
        
        print("\nTest Results Breakdown:")
        print(f"   - Normal: {normal_count}")
        print(f"   - Abnormal: {abnormal_count}")
        print(f"   - SMS Sent: {sms_sent_count}")
        print(f"   - SMS Not Sent: {sms_unsent_count}")
        
        print("\nAdmin Login (password: TestPass123!):")
        print(f"   - sarah.tan@rosefoundation.my")
        print(f"   - nurul.aisyah@rosefoundation.my")
        
        print("\nParticipants (all phone verified):")
        for p in PARTICIPANT_DATA:
            print(f"   - {p['name']} | {p['phone']}")
        
        print("\nEvent Codes (XXX-XXXX format):")
        for ev in events:
            print(f"   - {ev.event_code} | {ev.status}")
        
        print("=" * 60)
        
    except Exception as e:
        db.rollback()
        print(f"\n[ERROR] {e}")
        import traceback
        traceback.print_exc()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_all()