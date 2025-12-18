"""
Solterra Database Seed Script (Demo Version)
ROSE Foundation Event Management System

Booking Status Flow:
- confirmed: Participant has booked
- checked_in: Participant arrived at event
- completed: Checked-in + test results uploaded
- cancelled: Booking cancelled

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

# Admins (2 only)
ADMIN_1_UUID = uuid.uuid4()
ADMIN_2_UUID = uuid.uuid4()

# Participants (25 total)
PARTICIPANT_UUIDS = [uuid.uuid4() for _ in range(25)]


# ============================================================
# DEMO DATA
# ============================================================

PARTICIPANT_DATA = [
    # Malay names
    {"uuid": PARTICIPANT_UUIDS[0], "name": "Siti Aminah binti Yusof", "phone": "+60123456001", "mykad": "780315-01-5234"},
    {"uuid": PARTICIPANT_UUIDS[1], "name": "Faridah binti Hassan", "phone": "+60133456002", "mykad": "761105-04-5572"},
    {"uuid": PARTICIPANT_UUIDS[2], "name": "Rohana binti Abdullah", "phone": "+60193456003", "mykad": "720930-01-5896"},
    {"uuid": PARTICIPANT_UUIDS[3], "name": "Norazlina binti Mohd Nor", "phone": "+60163456004", "mykad": "910428-03-5220"},
    {"uuid": PARTICIPANT_UUIDS[4], "name": "Zainab binti Ismail", "phone": "+60183456005", "mykad": "850509-02-5556"},
    {"uuid": PARTICIPANT_UUIDS[5], "name": "Halimah binti Osman", "phone": "+60123456006", "mykad": "800612-14-5678"},
    {"uuid": PARTICIPANT_UUIDS[6], "name": "Mariam binti Zainal", "phone": "+60173456007", "mykad": "770823-01-5790"},
    {"uuid": PARTICIPANT_UUIDS[7], "name": "Nuraisyah binti Rahman", "phone": "+60143456008", "mykad": "890217-08-5012"},
    {"uuid": PARTICIPANT_UUIDS[8], "name": "Fatimah binti Latif", "phone": "+60193456009", "mykad": "750904-03-5124"},
    {"uuid": PARTICIPANT_UUIDS[9], "name": "Azizah binti Karim", "phone": "+60123456010", "mykad": "820716-10-5236"},
    # Chinese names
    {"uuid": PARTICIPANT_UUIDS[10], "name": "Tan Mei Ling", "phone": "+60163456011", "mykad": "850622-07-5126"},
    {"uuid": PARTICIPANT_UUIDS[11], "name": "Wong Siew Mei", "phone": "+60183456012", "mykad": "880219-12-5684"},
    {"uuid": PARTICIPANT_UUIDS[12], "name": "Chong Suk Yin", "phone": "+60173456013", "mykad": "680812-08-5332"},
    {"uuid": PARTICIPANT_UUIDS[13], "name": "Lim Ai Ling", "phone": "+60193456014", "mykad": "700821-07-5668"},
    {"uuid": PARTICIPANT_UUIDS[14], "name": "Lee Hui Fang", "phone": "+60123456015", "mykad": "790503-01-5780"},
    {"uuid": PARTICIPANT_UUIDS[15], "name": "Ng Siew Chin", "phone": "+60143456016", "mykad": "830915-04-5892"},
    {"uuid": PARTICIPANT_UUIDS[16], "name": "Ong Pei Wen", "phone": "+60163456017", "mykad": "860127-11-5004"},
    {"uuid": PARTICIPANT_UUIDS[17], "name": "Chan Mei Yee", "phone": "+60183456018", "mykad": "740608-07-5116"},
    # Indian names
    {"uuid": PARTICIPANT_UUIDS[18], "name": "Kavitha a/p Muthu", "phone": "+60173456019", "mykad": "900810-10-5348"},
    {"uuid": PARTICIPANT_UUIDS[19], "name": "Lakshmi a/p Rajan", "phone": "+60123456020", "mykad": "830714-11-5108"},
    {"uuid": PARTICIPANT_UUIDS[20], "name": "Prema a/p Subramaniam", "phone": "+60133456021", "mykad": "790126-05-5444"},
    {"uuid": PARTICIPANT_UUIDS[21], "name": "Saraswathi a/p Krishnan", "phone": "+60193456022", "mykad": "810309-01-5228"},
    {"uuid": PARTICIPANT_UUIDS[22], "name": "Devi a/p Suppiah", "phone": "+60143456023", "mykad": "770520-08-5340"},
    {"uuid": PARTICIPANT_UUIDS[23], "name": "Malini a/p Nair", "phone": "+60163456024", "mykad": "840731-14-5452"},
    {"uuid": PARTICIPANT_UUIDS[24], "name": "Anitha a/p Maniam", "phone": "+60183456025", "mykad": "720911-03-5564"},
]

PPR_LOCATIONS = [
    {"name": "PPR Kerinchi", "code": "KER", "address": "Dewan Komuniti PPR Kerinchi, Jalan Pantai Dalam, 59200 Kuala Lumpur", "lat": 3.10726500, "lng": 101.66398200},
    {"name": "Flat Sri Pahang", "code": "SRP", "address": "Dewan Serbaguna Flat Sri Pahang, Jalan Bangsar, 59000 Kuala Lumpur", "lat": 3.12889400, "lng": 101.67284600},
    {"name": "PPR Pantai Ria", "code": "PTR", "address": "Balai Raya PPR Pantai Ria, Jalan Pantai, 59100 Kuala Lumpur", "lat": 3.10142800, "lng": 101.66847300},
    {"name": "PPR Desa Rejang", "code": "DSR", "address": "Dewan PPR Desa Rejang, Jalan Rejang, Setapak, 53300 Kuala Lumpur", "lat": 3.18724600, "lng": 101.71892300},
    {"name": "PPR Lembah Subang", "code": "LBS", "address": "Balai Raya PPR Lembah Subang 1, Jalan SS13/1, 47500 Subang Jaya, Selangor", "lat": 3.04726800, "lng": 101.59374500},
    {"name": "PPR Seri Semarak", "code": "SSM", "address": "Dewan Komuniti PPR Seri Semarak, Jalan Semarak, 54000 Kuala Lumpur", "lat": 3.17283400, "lng": 101.70192800},
    {"name": "PPR Kota Damansara", "code": "KTD", "address": "Balai Raya PPR Kota Damansara, Jalan PJU 5/1, 47810 Petaling Jaya, Selangor", "lat": 3.15284700, "lng": 101.58472300},
    {"name": "PPR Hicom", "code": "HCM", "address": "Dewan Komuniti PPR Hicom, Seksyen 26, 40400 Shah Alam, Selangor", "lat": 3.07381900, "lng": 101.51847200},
    {"name": "PPR Ampang", "code": "AMP", "address": "Balai Raya PPR Ampang, Jalan Ampang, 68000 Ampang, Selangor", "lat": 3.15726400, "lng": 101.76283100},
    {"name": "PPR Intan Baiduri", "code": "ITB", "address": "Dewan PPR Intan Baiduri, Jalan Kepong, 52100 Kuala Lumpur", "lat": 3.21847300, "lng": 101.63928400},
    {"name": "PPR Sg Bonus", "code": "SGB", "address": "Balai Raya PPR Sungai Bonus, Jalan Gombak, 53000 Kuala Lumpur", "lat": 3.20183600, "lng": 101.70284500},
    {"name": "PPR Taman Wahyu", "code": "TWY", "address": "Dewan Komuniti PPR Taman Wahyu, Jalan Ipoh, 51200 Kuala Lumpur", "lat": 3.22917400, "lng": 101.67382100},
    {"name": "PPR Beringin", "code": "BRG", "address": "Dewan Komuniti PPR Beringin, Jalan Beringin, 52000 Kuala Lumpur", "lat": 3.19284500, "lng": 101.65847200},
    {"name": "PPR Pudu Ulu", "code": "PDU", "address": "Balai Raya PPR Pudu Ulu, Jalan Pudu, 55200 Kuala Lumpur", "lat": 3.13726400, "lng": 101.72183600},
    {"name": "PPR Salak Selatan", "code": "SLS", "address": "Dewan PPR Salak Selatan, Jalan Salak, 57100 Kuala Lumpur", "lat": 3.09847300, "lng": 101.70928400},
    {"name": "PPR Sri Johor", "code": "SJR", "address": "Balai Raya PPR Sri Johor, Jalan Sri Johor, 50350 Kuala Lumpur", "lat": 3.14283600, "lng": 101.69374500},
    {"name": "PPR Kg Baru", "code": "KGB", "address": "Dewan Komuniti PPR Kampung Baru, Jalan Raja Muda, 50300 Kuala Lumpur", "lat": 3.16847200, "lng": 101.70183700},
    {"name": "PPR Setapak Jaya", "code": "STJ", "address": "Balai Raya PPR Setapak Jaya, Jalan Genting Klang, 53300 Kuala Lumpur", "lat": 3.19374600, "lng": 101.71847300},
]


def generate_event_code(location_code: str) -> str:
    """Generate event code: XXX-XXXX (3 letter location code - 4 random digits)"""
    random_digits = random.randint(1000, 9999)
    return f"{location_code}-{random_digits}"


def generate_time_slots(start_hour: int = 9, num_slots: int = 6, capacity: int = 4) -> list:
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
        # 25 PARTICIPANTS
        # ============================================================
        print("\n[PARTICIPANTS] Creating 25 participants...")
        
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
        # 18 EVENTS - variety of statuses including fully booked
        # Only 2 drafts (one per admin)
        # ============================================================
        print("\n[EVENTS] Creating 18 events...")
        
        events = []
        event_to_admin = {}
        
        # Event configurations
        # total_slots=24 means 6 time slots x 4 capacity each
        event_configs = [
            # COMPLETED EVENTS (7 events - past dates, all have results)
            {"status": "completed", "days_offset": -60, "loc_idx": 0, "admin_idx": 0, "total_slots": 24},   # 2 months ago
            {"status": "completed", "days_offset": -45, "loc_idx": 1, "admin_idx": 1, "total_slots": 24},   # 6 weeks ago
            {"status": "completed", "days_offset": -35, "loc_idx": 2, "admin_idx": 0, "total_slots": 24},   # 5 weeks ago
            {"status": "completed", "days_offset": -28, "loc_idx": 3, "admin_idx": 1, "total_slots": 24},   # 4 weeks ago
            {"status": "completed", "days_offset": -21, "loc_idx": 4, "admin_idx": 0, "total_slots": 24},   # 3 weeks ago
            {"status": "completed", "days_offset": -14, "loc_idx": 5, "admin_idx": 1, "total_slots": 24},   # 2 weeks ago
            {"status": "completed", "days_offset": -7, "loc_idx": 6, "admin_idx": 0, "total_slots": 24},    # 1 week ago
            
            # ONGOING EVENTS (2 events - today)
            {"status": "ongoing", "days_offset": 0, "loc_idx": 7, "admin_idx": 1, "total_slots": 24},
            {"status": "ongoing", "days_offset": 0, "loc_idx": 8, "admin_idx": 0, "total_slots": 24},
            
            # PUBLISHED EVENTS (5 events - upcoming, some fully booked)
            {"status": "published", "days_offset": 2, "loc_idx": 9, "admin_idx": 1, "total_slots": 24, "fully_booked": True},   # FULLY BOOKED
            {"status": "published", "days_offset": 5, "loc_idx": 10, "admin_idx": 0, "total_slots": 24},
            {"status": "published", "days_offset": 7, "loc_idx": 11, "admin_idx": 1, "total_slots": 24, "fully_booked": True},  # FULLY BOOKED
            {"status": "published", "days_offset": 10, "loc_idx": 12, "admin_idx": 0, "total_slots": 24},
            {"status": "published", "days_offset": 14, "loc_idx": 13, "admin_idx": 1, "total_slots": 24},
            
            # CANCELLED EVENTS (2 events)
            {"status": "cancelled", "days_offset": -5, "loc_idx": 14, "admin_idx": 0, "total_slots": 24},   # Was scheduled 5 days ago
            {"status": "cancelled", "days_offset": 4, "loc_idx": 15, "admin_idx": 1, "total_slots": 24},    # Was scheduled for 4 days from now
            
            # DRAFT EVENTS (2 events - one per admin)
            {"status": "draft", "days_offset": 21, "loc_idx": 16, "admin_idx": 0, "total_slots": 24},   # Admin 1 draft
            {"status": "draft", "days_offset": 28, "loc_idx": 17, "admin_idx": 1, "total_slots": 24},   # Admin 2 draft
        ]
        
        for config in event_configs:
            loc = PPR_LOCATIONS[config["loc_idx"]]
            creator_uuid = admin_uuids[config["admin_idx"]]
            
            event_date = date.today() + timedelta(days=config["days_offset"])
            
            total_slots = config["total_slots"]
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
            fully_booked_note = " [FULLY BOOKED]" if config.get("fully_booked") else ""
            print(f"   + {event_code} [{config['status']}] | {loc['name']} | Owner: {owner_name}{fully_booked_note}")
        
        db.add_all(events)
        db.commit()
        
        # ============================================================
        # BOOKINGS - Realistic distribution
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
        
        # Booking configs for each event (by index)
        booking_configs = {
            # Event 0: Completed 2 months ago - all results done
            0: {
                "bookings": [
                    {"p_idx": 0, "status": "checked_in", "will_have_results": True},
                    {"p_idx": 1, "status": "checked_in", "will_have_results": True},
                    {"p_idx": 2, "status": "checked_in", "will_have_results": True},
                    {"p_idx": 10, "status": "checked_in", "will_have_results": True},
                    {"p_idx": 11, "status": "checked_in", "will_have_results": True},
                    {"p_idx": 18, "status": "checked_in", "will_have_results": True},
                    {"p_idx": 19, "status": "cancelled", "will_have_results": False},
                ]
            },
            # Event 1: Completed 6 weeks ago
            1: {
                "bookings": [
                    {"p_idx": 3, "status": "checked_in", "will_have_results": True},
                    {"p_idx": 4, "status": "checked_in", "will_have_results": True},
                    {"p_idx": 5, "status": "checked_in", "will_have_results": True},
                    {"p_idx": 12, "status": "checked_in", "will_have_results": True},
                    {"p_idx": 13, "status": "checked_in", "will_have_results": True},
                    {"p_idx": 20, "status": "checked_in", "will_have_results": True},
                    {"p_idx": 21, "status": "checked_in", "will_have_results": True},
                    {"p_idx": 6, "status": "cancelled", "will_have_results": False},
                ]
            },
            # Event 2: Completed 5 weeks ago
            2: {
                "bookings": [
                    {"p_idx": 0, "status": "checked_in", "will_have_results": True},
                    {"p_idx": 7, "status": "checked_in", "will_have_results": True},
                    {"p_idx": 8, "status": "checked_in", "will_have_results": True},
                    {"p_idx": 14, "status": "checked_in", "will_have_results": True},
                    {"p_idx": 15, "status": "checked_in", "will_have_results": True},
                    {"p_idx": 22, "status": "checked_in", "will_have_results": True},
                    {"p_idx": 9, "status": "cancelled", "will_have_results": False},
                ]
            },
            # Event 3: Completed 4 weeks ago
            3: {
                "bookings": [
                    {"p_idx": 1, "status": "checked_in", "will_have_results": True},
                    {"p_idx": 2, "status": "checked_in", "will_have_results": True},
                    {"p_idx": 9, "status": "checked_in", "will_have_results": True},
                    {"p_idx": 16, "status": "checked_in", "will_have_results": True},
                    {"p_idx": 17, "status": "checked_in", "will_have_results": True},
                    {"p_idx": 23, "status": "checked_in", "will_have_results": True},
                    {"p_idx": 24, "status": "checked_in", "will_have_results": True},
                    {"p_idx": 10, "status": "cancelled", "will_have_results": False},
                ]
            },
            # Event 4: Completed 3 weeks ago - some results pending
            4: {
                "bookings": [
                    {"p_idx": 3, "status": "checked_in", "will_have_results": True},
                    {"p_idx": 4, "status": "checked_in", "will_have_results": True},
                    {"p_idx": 5, "status": "checked_in", "will_have_results": True},
                    {"p_idx": 11, "status": "checked_in", "will_have_results": True},
                    {"p_idx": 18, "status": "checked_in", "will_have_results": True},
                    {"p_idx": 19, "status": "checked_in", "will_have_results": False},  # Pending
                    {"p_idx": 12, "status": "cancelled", "will_have_results": False},
                ]
            },
            # Event 5: Completed 2 weeks ago - more results pending
            5: {
                "bookings": [
                    {"p_idx": 0, "status": "checked_in", "will_have_results": True},
                    {"p_idx": 6, "status": "checked_in", "will_have_results": True},
                    {"p_idx": 7, "status": "checked_in", "will_have_results": True},
                    {"p_idx": 13, "status": "checked_in", "will_have_results": True},
                    {"p_idx": 20, "status": "checked_in", "will_have_results": False},  # Pending
                    {"p_idx": 21, "status": "checked_in", "will_have_results": False},  # Pending
                    {"p_idx": 14, "status": "cancelled", "will_have_results": False},
                ]
            },
            # Event 6: Completed 1 week ago - most results pending
            6: {
                "bookings": [
                    {"p_idx": 1, "status": "checked_in", "will_have_results": True},
                    {"p_idx": 2, "status": "checked_in", "will_have_results": True},
                    {"p_idx": 8, "status": "checked_in", "will_have_results": False},  # Pending
                    {"p_idx": 15, "status": "checked_in", "will_have_results": False},  # Pending
                    {"p_idx": 16, "status": "checked_in", "will_have_results": False},  # Pending
                    {"p_idx": 22, "status": "checked_in", "will_have_results": False},  # Pending
                    {"p_idx": 17, "status": "cancelled", "will_have_results": False},
                ]
            },
            # Event 7: Ongoing today - mix of checked_in and confirmed
            7: {
                "bookings": [
                    {"p_idx": 0, "status": "checked_in", "will_have_results": False},
                    {"p_idx": 3, "status": "checked_in", "will_have_results": False},
                    {"p_idx": 4, "status": "checked_in", "will_have_results": False},
                    {"p_idx": 10, "status": "checked_in", "will_have_results": False},
                    {"p_idx": 5, "status": "confirmed", "will_have_results": False},
                    {"p_idx": 11, "status": "confirmed", "will_have_results": False},
                    {"p_idx": 18, "status": "confirmed", "will_have_results": False},
                    {"p_idx": 23, "status": "cancelled", "will_have_results": False},
                ]
            },
            # Event 8: Ongoing today - another location
            8: {
                "bookings": [
                    {"p_idx": 1, "status": "checked_in", "will_have_results": False},
                    {"p_idx": 2, "status": "checked_in", "will_have_results": False},
                    {"p_idx": 6, "status": "checked_in", "will_have_results": False},
                    {"p_idx": 12, "status": "confirmed", "will_have_results": False},
                    {"p_idx": 13, "status": "confirmed", "will_have_results": False},
                    {"p_idx": 19, "status": "confirmed", "will_have_results": False},
                    {"p_idx": 20, "status": "confirmed", "will_have_results": False},
                ]
            },
            # Event 9: Published FULLY BOOKED (2 days away) - 24 bookings
            9: {
                "bookings": [
                    {"p_idx": i % 25, "status": "confirmed", "will_have_results": False}
                    for i in range(24)
                ]
            },
            # Event 10: Published with availability (5 days away)
            10: {
                "bookings": [
                    {"p_idx": 0, "status": "confirmed", "will_have_results": False},
                    {"p_idx": 7, "status": "confirmed", "will_have_results": False},
                    {"p_idx": 8, "status": "confirmed", "will_have_results": False},
                    {"p_idx": 14, "status": "confirmed", "will_have_results": False},
                    {"p_idx": 21, "status": "confirmed", "will_have_results": False},
                    {"p_idx": 22, "status": "confirmed", "will_have_results": False},
                ]
            },
            # Event 11: Published FULLY BOOKED (7 days away) - 24 bookings
            11: {
                "bookings": [
                    {"p_idx": (i + 5) % 25, "status": "confirmed", "will_have_results": False}
                    for i in range(24)
                ]
            },
            # Event 12: Published with availability (10 days away)
            12: {
                "bookings": [
                    {"p_idx": 1, "status": "confirmed", "will_have_results": False},
                    {"p_idx": 3, "status": "confirmed", "will_have_results": False},
                    {"p_idx": 9, "status": "confirmed", "will_have_results": False},
                    {"p_idx": 15, "status": "confirmed", "will_have_results": False},
                    {"p_idx": 16, "status": "confirmed", "will_have_results": False},
                    {"p_idx": 23, "status": "confirmed", "will_have_results": False},
                    {"p_idx": 24, "status": "confirmed", "will_have_results": False},
                    {"p_idx": 4, "status": "cancelled", "will_have_results": False},
                ]
            },
            # Event 13: Published with few bookings (14 days away)
            13: {
                "bookings": [
                    {"p_idx": 2, "status": "confirmed", "will_have_results": False},
                    {"p_idx": 5, "status": "confirmed", "will_have_results": False},
                    {"p_idx": 17, "status": "confirmed", "will_have_results": False},
                ]
            },
            # Event 14: Cancelled (was 5 days ago) - all bookings cancelled
            14: {
                "bookings": [
                    {"p_idx": 0, "status": "cancelled", "will_have_results": False},
                    {"p_idx": 6, "status": "cancelled", "will_have_results": False},
                    {"p_idx": 10, "status": "cancelled", "will_have_results": False},
                    {"p_idx": 11, "status": "cancelled", "will_have_results": False},
                    {"p_idx": 18, "status": "cancelled", "will_have_results": False},
                ]
            },
            # Event 15: Cancelled (was for 4 days from now) - all bookings cancelled
            15: {
                "bookings": [
                    {"p_idx": 1, "status": "cancelled", "will_have_results": False},
                    {"p_idx": 2, "status": "cancelled", "will_have_results": False},
                    {"p_idx": 7, "status": "cancelled", "will_have_results": False},
                    {"p_idx": 12, "status": "cancelled", "will_have_results": False},
                    {"p_idx": 19, "status": "cancelled", "will_have_results": False},
                    {"p_idx": 20, "status": "cancelled", "will_have_results": False},
                ]
            },
            # Event 16: Draft (Admin 1) - no bookings
            # Event 17: Draft (Admin 2) - no bookings
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
                
                slot_start, slot_end = time_slot_options[(seq - 1) % len(time_slot_options)]
                
                # Booking date varies based on event date
                if ev.event_date < date.today():
                    booked_days_before = random.randint(3, 10)
                    booked_at = datetime.combine(ev.event_date, time(10, 0)) - timedelta(days=booked_days_before)
                else:
                    booked_at = datetime.utcnow() - timedelta(days=random.randint(1, 7))
                
                bk = booking.Booking(
                    id=uuid.uuid4(),
                    participant_id=p_uuid,
                    event_id=ev.id,
                    booking_reference=f"{ev.event_code}-{seq:03d}",
                    booking_status=status,
                    booked_at=booked_at,
                    cancelled_at=datetime.utcnow() - timedelta(days=random.randint(1, 3)) if status == "cancelled" else None,
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
        # TEST RESULTS
        # ============================================================
        print("\n[TEST RESULTS] Creating test results...")
        
        results = []
        
        result_configs = [
            {"category": "Normal", "sms_sent": True, "notes": "No abnormalities detected. Recommend routine screening in 3 years."},
            {"category": "Normal", "sms_sent": True, "notes": "Normal cervical cells. Continue regular check-ups."},
            {"category": "Normal", "sms_sent": True, "notes": "HPV negative. Healthy results."},
            {"category": "Normal", "sms_sent": False, "notes": "All clear. No further action required."},
            {"category": "Normal", "sms_sent": True, "notes": "Healthy cervical tissue. Next screening in 3-5 years."},
            {"category": "Abnormal", "sms_sent": True, "notes": "Abnormal cells detected. Referred to Hospital KL for colposcopy."},
            {"category": "Normal", "sms_sent": True, "notes": "Test completed successfully. No concerns."},
            {"category": "Normal", "sms_sent": False, "notes": "Normal screening results. Recommend follow-up in 3 years."},
            {"category": "Normal", "sms_sent": True, "notes": "No HPV detected. Continue healthy lifestyle."},
            {"category": "Abnormal", "sms_sent": True, "notes": "Abnormal findings requiring follow-up. Referral letter provided."},
            {"category": "Normal", "sms_sent": True, "notes": "All tests negative. Healthy results confirmed."},
            {"category": "Normal", "sms_sent": False, "notes": "Normal results. No action needed."},
            {"category": "Normal", "sms_sent": True, "notes": "Screening complete. No abnormalities found."},
            {"category": "Abnormal", "sms_sent": False, "notes": "Low-grade abnormality detected. Recommend repeat in 6 months."},
            {"category": "Normal", "sms_sent": True, "notes": "HPV test negative. Cervical cells normal."},
        ]
        
        for i, bk in enumerate(bookings_to_complete):
            config = result_configs[i % len(result_configs)]
            event_admin_uuid = event_to_admin[bk.event_id]
            p_name = next(p["name"] for p in PARTICIPANT_DATA if p["uuid"] == bk.participant_id)
            
            ev = next(e for e in events if e.id == bk.event_id)
            upload_date = datetime.combine(ev.event_date, time(14, 0)) + timedelta(days=random.randint(2, 7))
            
            tr = test_result.TestResult(
                id=uuid.uuid4(),
                booking_id=bk.id,
                result_category=config["category"],
                result_notes=config["notes"],
                result_file_url=f"https://res.cloudinary.com/rose/{bk.id}.pdf",
                uploaded_by=event_admin_uuid,
                uploaded_at=upload_date,
                sms_sent=config["sms_sent"],
                sms_sent_at=upload_date + timedelta(hours=random.randint(1, 24)) if config["sms_sent"] else None
            )
            results.append(tr)
            
            sms_status = "sent" if config["sms_sent"] else "NOT SENT"
            print(f"   + {p_name} | {config['category']} | SMS: {sms_status}")
        
        db.add_all(results)
        db.commit()
        
        # ============================================================
        # UPDATE BOOKING STATUS: checked_in -> completed (if has results)
        # ============================================================
        print("\n[UPDATE] Marking bookings with results as 'completed'...")
        
        for bk in bookings_to_complete:
            db.query(booking.Booking).filter(booking.Booking.id == bk.id).update({
                booking.Booking.booking_status: "completed"
            })
            bk.booking_status = "completed"
        
        db.commit()
        
        completed_count = sum(1 for b in all_bookings if b.booking_status == "completed")
        print(f"   {completed_count} bookings marked as 'completed'")
        
        # ============================================================
        # UPDATE EVENT AVAILABILITY
        # ============================================================
        print("\n[UPDATE] Updating slot availability...")
        
        for ev in events:
            active_bookings = sum(1 for b in all_bookings if b.event_id == ev.id and b.booking_status in ["confirmed", "checked_in", "completed"])
            
            if ev.time_slots:
                for slot in ev.time_slots:
                    st = time(int(slot["start"].split(":")[0]), int(slot["start"].split(":")[1]))
                    booked = sum(1 for b in all_bookings if b.event_id == ev.id and b.booking_status in ["confirmed", "checked_in", "completed"] and b.time_slot_start == st)
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
        
        event_status_counts = {}
        for e in events:
            event_status_counts[e.status] = event_status_counts.get(e.status, 0) + 1
        
        # Count fully booked events
        fully_booked_count = sum(1 for e in events if e.available_slots == 0 and e.status == "published")
        
        print("\n" + "=" * 60)
        print("SEED COMPLETE")
        print("=" * 60)
        print(f"   Admins:        2")
        print(f"   Participants:  {len(PARTICIPANT_DATA)}")
        print(f"   Events:        {len(events)}")
        print(f"   Bookings:      {len(all_bookings)}")
        print(f"   Test Results:  {len(results)}")
        
        print("\nEvent Status Breakdown:")
        for status, count in sorted(event_status_counts.items()):
            print(f"   - {status}: {count}")
        print(f"   - fully booked (published): {fully_booked_count}")
        
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
        
        print("\nParticipants (25 total - all phone verified):")
        print("   Malay:   10 participants")
        print("   Chinese: 8 participants")
        print("   Indian:  7 participants")
        
        print("\nEvent Codes:")
        for ev in events:
            slots_info = f"({ev.available_slots}/{ev.total_slots} available)"
            if ev.available_slots == 0 and ev.status == "published":
                slots_info = "(FULLY BOOKED)"
            print(f"   - {ev.event_code} | {ev.status} | {ev.event_date} {slots_info}")
        
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