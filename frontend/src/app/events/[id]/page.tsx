'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { MapPin, Clock, CreditCard, Smartphone } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';

interface Event {
  id: string;
  name: string;
  address: string;
  event_date: string;
  event_time: string;
  total_slots: number;
  available_slots: number;
  additional_info: string;
}

interface Booking {
  id: string;
  event: {
    id: string;
  };
}

export default function EventDetailPage() {
  const params = useParams();
  const eventId = params.id as string;

  const [event, setEvent] = useState<Event | null>(null);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [loading, setLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [isBooked, setIsBooked] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    const fetchEvent = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/events/${eventId}`);
        const data = await res.json();
        setEvent(data);
      } catch (err) {
        console.error('Failed to fetch event', err);
      } finally {
        setLoading(false);
      }
    };

    const token = localStorage.getItem('access_token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUserRole(payload.role);
        if (payload.role === 'participant') {
          fetchParticipantBookings(token);
        }
      } catch (e) {
        console.error('Failed to decode token:', e);
      }
    }
    fetchEvent();
  }, [eventId]);

  const fetchParticipantBookings = async (token: string) => {
    try {
      const resBookings = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/participant/bookings`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!resBookings.ok) return;

      const data: Booking[] = await resBookings.json();
      const bookedIds = new Set(data.map((b) => b.event.id));
      if (bookedIds.has(eventId)) setIsBooked(true);

      const resUser = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/participant/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (resUser.ok) {
        const userData = await resUser.json();
        setUserId(userData.id);
      }
    } catch (err) {
      console.error('Error fetching bookings/user info:', err);
    }
  };

  const handleBooking = async () => {
    if (!acceptedTerms) {
      alert('Please accept terms and conditions');
      return;
    }

    setBookingLoading(true);

    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        alert('You must be logged in to book.');
        return;
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/participant/bookings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ event_id: event?.id }),
      });

      const data = await res.json();

      if (data.booking) {
        alert(data.message || 'Booking confirmed!');

        setIsBooked(true);
        setEvent((prev) =>
          prev ? { ...prev, available_slots: Math.max(prev.available_slots - 1, 0) } : prev
        );

        const resUser = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/participant/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (resUser.ok) {
          const userData = await resUser.json();
          setUserId(userData.id);
        }

        if (data.message && data.message.toLowerCase().includes('sms')) {
          alert('Booking confirmed, but SMS delivery failed. Please check your booking details.');
        }
      } else {
        alert(data.detail?.[0]?.msg || 'Booking failed.');
      }
    } catch (err) {
      console.error(err);
      alert('Booking failed, please try again.');
    } finally {
      setBookingLoading(false);
    }
  };

  const handleWhatsAppShare = () => {
    if (!event) return;
    const text = `Check out this event: ${event.name}\nDate: ${event.event_date} ${event.event_time}\nLocation: ${event.address}\nMore info: ${event.additional_info || ''}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  if (loading) {
    return (
        <DashboardLayout title="Event Details">
          <p className="p-6 text-center">Loading event...</p>
        </DashboardLayout>
    );
  }

  if (!event) {
    return (
        <DashboardLayout title="Event Details">
          <p className="p-6 text-center">Event not found.</p>
        </DashboardLayout>
    );
  }

  const capacityPercentage = ((event.total_slots - event.available_slots) / event.total_slots) * 100;
  const slotsRemaining = event.available_slots;

  return (
      <DashboardLayout title="Book Event">
        <Card className="max-w-3xl">
          <CardContent className="p-6 space-y-6">
            <h2 className="text-2xl font-bold mb-4">{event.name}</h2>

            <div className="flex items-start gap-2 text-gray-700 mb-2">
              <MapPin className="w-5 h-5 mt-0.5 text-emerald-600" />
              <p>{event.address}</p>
            </div>

            <div className="flex items-center gap-2 text-gray-700 mb-4">
              <Clock className="w-5 h-5 text-emerald-600" />
              <span>{event.event_date}</span> • <span>{event.event_time}</span>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Capacity:</span>
                <span className="text-sm font-medium">{slotsRemaining} of {event.total_slots} slots remaining</span>
              </div>
              <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 transition-all" style={{ width: `${capacityPercentage}%` }} />
              </div>
              <p className="text-xs text-gray-500 mt-1 text-right">{event.total_slots - event.available_slots}/{event.total_slots} booked</p>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-3">What to bring:</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-gray-600" />
                  <span>MyKad (National ID)</span>
                </div>
                <div className="flex items-center gap-2">
                  <Smartphone className="w-5 h-5 text-gray-600" />
                  <span>Mobile phone (to receive results via SMS)</span>
                .</div>
              </div>
            </div>

            {userRole === 'participant' && (
              <>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold mb-3">Accept terms and conditions</h3>
                  <div className="flex items-start gap-2">
                    <Checkbox
                      id="terms"
                      checked={acceptedTerms}
                      onCheckedChange={(checked) => setAcceptedTerms(checked as boolean)}
                    />
                    <label htmlFor="terms" className="text-sm text-gray-700">I agree to the terms and conditions</label>
                  </div>
                </div>

                <div className="flex gap-3">
                  {isBooked ? (
                    <Button disabled className="flex-1 h-12 bg-gray-400 text-white">
                      Already Booked
                    </Button>
                  ) : event.available_slots === 0 ? (
                    <Button disabled className="flex-1 h-12 bg-gray-300 text-white">
                      Full
                    </Button>
                  ) : (
                    <Button
                      onClick={handleBooking}
                      disabled={!acceptedTerms || bookingLoading}
                      className="flex-1 h-12 bg-rose-400 hover:bg-rose-500 text-white"
                    >
                      {bookingLoading ? 'Booking...' : 'Book Now'}
                    </Button>
                  )}
                  <Button
                    onClick={handleWhatsAppShare}
                    className="flex-1 h-12 bg-emerald-500 hover:bg-emerald-600 text-white"
                  >
                    Share via WhatsApp
                  </Button>
                </div>
              </>
            )}


            {isBooked && userId && (
              <div className="mt-6 p-4 bg-gray-50 rounded-lg text-center">
                <h3 className="font-semibold mb-2">Your Booking QR Code</h3>
                <QRCodeCanvas
                  value={JSON.stringify({ booking_id: event.id, user_id: userId })}
                  size={180}
                />
                <p className="text-xs text-gray-500 mt-2">Show this QR code at the event for check-in.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </DashboardLayout>
  );
}