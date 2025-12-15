from app.database import SessionLocal
from app.models import event, booking

if __name__ == '__main__':
    db = SessionLocal()
    e = db.query(event.Event).filter_by(event_code='EVT003').first()
    if not e:
        print('EVT003 not found')
    else:
        confirmed = db.query(booking.Booking).filter_by(event_id=e.id, booking_status='confirmed').count()
        confirmed_with_slot = db.query(booking.Booking).filter(booking.Booking.event_id==e.id, booking.Booking.booking_status=='confirmed', booking.Booking.time_slot_start!=None).count()
        confirmed_without_slot = confirmed - confirmed_with_slot
        print(e.name, 'date:', e.event_date, 'time:', e.event_time)
        print('total_slots:', e.total_slots, 'available_slots:', e.available_slots, 'confirmed_bookings:', confirmed)
        print('confirmed_with_slot:', confirmed_with_slot, 'confirmed_without_slot:', confirmed_without_slot)
        print('time_slots:', e.time_slots)
    db.close()