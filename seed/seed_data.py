import requests
from faker import Faker
import random

# -----------------------------
# Indonesian-style Seed Data
# -----------------------------
fake = Faker("id_ID")  # Indonesian locale
BASE_URL = "http://127.0.0.1:8000"

# -----------------------------
# Helper functions
# -----------------------------
def create_admin(name, email, password):
    url = f"{BASE_URL}/admin/auth/register"
    data = {"name": name, "email": email, "password": password}
    response = requests.post(url, json=data)
    if response.status_code == 200:
        print(f"Admin created: {email}")
        return response.json()["access_token"]
    else:
        print(f"Failed to create admin: {response.text}")
        return None

def create_participant(name, phone_number, mykad_id):
    url = f"{BASE_URL}/participant/auth/register"
    data = {"name": name, "phone_number": phone_number, "mykad_id": mykad_id}
    response = requests.post(url, json=data)
    if response.status_code == 200:
        print(f"Participant created: {name}")
        return response.json()["access_token"]
    else:
        print(f"Failed to create participant: {response.text}")
        return None

def create_event(admin_token, name, date, time, address, total_slots, status="published", additional_info=""):
    url = f"{BASE_URL}/events/"
    headers = {"Authorization": f"Bearer {admin_token}"}
    data = {
        "name": name,
        "event_date": date,
        "event_time": time,
        "address": address,
        "total_slots": total_slots,
        "status": status,
        "additional_info": additional_info
    }
    response = requests.post(url, json=data, headers=headers)
    if response.status_code == 201:
        print(f"Event created: {name}")
        return response.json()["id"], total_slots
    else:
        print(f"Failed to create event: {response.text}")
        return None, 0

def book_event(participant_token, event_id):
    url = f"{BASE_URL}/participant/bookings"
    headers = {"Authorization": f"Bearer {participant_token}"}
    data = {"event_id": event_id}
    response = requests.post(url, json=data, headers=headers)
    if response.status_code == 200:
        print(f"Booking confirmed for event {event_id}")
        return True
    else:
        print(f"Failed to book event {event_id}: {response.text}")
        return False

# -----------------------------
# Seed Configuration
# -----------------------------
NUM_ADMINS = 2
NUM_PARTICIPANTS = 5
NUM_EVENTS_PER_ADMIN = 3

admin_tokens = []
participant_tokens = []

# Indonesian-style event names
event_names = [
    "Pemeriksaan Kesehatan Gratis",
    "Screening Kanker Serviks",
    "Vaksinasi Anak",
    "Pemeriksaan Tekanan Darah",
    "Kampanye Kesehatan Jantung",
    "Tes Diabetes Komunitas"
]

# -----------------------------
# Create Admins
# -----------------------------
for _ in range(NUM_ADMINS):
    name = fake.name()
    email = fake.email()
    password = "@12345678Test"
    token = create_admin(name, email, password)
    if token:
        admin_tokens.append(token)

# -----------------------------
# Create Participants
# -----------------------------
# Specific participant: Raiyan
raiyan_token = create_participant(
    name="Raiyan",
    phone_number="07448730387",
    mykad_id="43215678901234"
)
if raiyan_token:
    participant_tokens.append(raiyan_token)

# Other random participants
for _ in range(NUM_PARTICIPANTS - 1):
    name = fake.name()
    phone_number = fake.phone_number()
    mykad_id = fake.bothify(text="##############")  # 14 characters
    token = create_participant(name, phone_number, mykad_id)
    if token:
        participant_tokens.append(token)

# -----------------------------
# Create Events for Admins
# -----------------------------
event_slots = {}  # Track remaining slots per event
event_ids = []

for admin_token in admin_tokens:
    for _ in range(NUM_EVENTS_PER_ADMIN):
        name = random.choice(event_names)
        date = str(fake.date_between(start_date="today", end_date="+30d"))
        time = str(fake.time())
        address = f"{fake.address()}, {fake.city()}"
        total_slots = random.randint(5, 20)
        additional_info = "Bawa KTP dan datang tepat waktu."
        event_id, slots = create_event(admin_token, name, date, time, address, total_slots, additional_info=additional_info)
        if event_id:
            event_ids.append(event_id)
            event_slots[event_id] = slots

# -----------------------------
# Book events for Raiyan (skip some events)
# -----------------------------
num_raiyan_bookings = random.randint(1, len(event_ids)-1)  # ensures at least 1 event is left unbooked
raiyan_events = random.sample(event_ids, num_raiyan_bookings)
for event_id in raiyan_events:
    success = book_event(raiyan_token, event_id)
    if success:
        event_slots[event_id] -= 1

# -----------------------------
# Book events for other participants
# -----------------------------
for participant_token in participant_tokens[1:]:  # skip Raiyan
    num_bookings = random.randint(0, min(3, len(event_ids)))
    random_events = random.sample(event_ids, len(event_ids))
    bookings_done = 0
    for event_id in random_events:
        if bookings_done >= num_bookings:
            break
        if event_slots[event_id] > 0:
            success = book_event(participant_token, event_id)
            if success:
                event_slots[event_id] -= 1
                bookings_done += 1

print("Seeding completed with Raiyan having selective bookings!")
