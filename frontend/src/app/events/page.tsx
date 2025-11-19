'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Calendar as CalendarIcon, PlusCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Toast from '@/components/ui/toast';

interface Event {
  id: string;
  name: string;
  event_date: string;
  event_time: string;
  address: string;
  available_slots: number;
  total_slots: number;
  status: string;
  additional_info: string;
}

interface Booking {
  id: string;
  event: {
    id: string;
  };
}

export default function EventsPage() {
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [bookedEventIds, setBookedEventIds] = useState<Set<string>>(new Set());
  const [bookingLoadingIds, setBookingLoadingIds] = useState<Set<string>>(new Set());
  const [searchLocation, setSearchLocation] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error';
    show: boolean;
  }>({
    message: '',
    type: 'success',
    show: false,
  });

  // Fetch events based on role
  const fetchEvents = async () => {
    setLoading(true);
    try {
      const url =
        userRole === 'admin'
          ? `${process.env.NEXT_PUBLIC_API_URL}/events/?published_only=false`
          : `${process.env.NEXT_PUBLIC_API_URL}/events/?published_only=true`;

      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch events');

      const data = await res.json();
      setEvents(data.events || data);
    } catch (err: any) {
      console.error('Error fetching events:', err);
      setToast({ message: err.message || 'Error fetching events', type: 'error', show: true });
    } finally {
      setLoading(false);
    }
  };

  // Fetch participant bookings
  const fetchParticipantBookings = async (token: string) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/participant/bookings`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) return;

      const data: Booking[] = await res.json();
      const bookedIds = new Set(data.map((b) => b.event.id));
      setBookedEventIds(bookedIds);
    } catch (err) {
      console.error('Error fetching participant bookings:', err);
      setToast({ message: 'Error fetching bookings', type: 'error', show: true });
    }
  };

  // Book event handler
  const handleBookEvent = async (eventId: string) => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      setToast({ message: 'You must be logged in to book.', type: 'error', show: true });
      return;
    }

    setBookingLoadingIds((prev) => new Set(prev).add(eventId));

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/participant/bookings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ event_id: eventId }),
      });

      if (!res.ok) {
        const errData = await res.json();
        const errorMessage = Array.isArray(errData.detail)
          ? errData.detail[0]?.msg
          : errData.detail;
        throw new Error(errorMessage || 'Failed to book event');
      }

      const result = await res.json();
      setToast({ message: result.message || 'Booking successful!', type: 'success', show: true });

      setBookedEventIds((prev) => new Set(prev).add(eventId));

      setEvents((prevEvents) =>
        prevEvents.map((event) =>
          event.id === eventId
            ? { ...event, available_slots: Math.max(event.available_slots - 1, 0) }
            : event
        )
      );
    } catch (err: any) {
      setToast({ message: err.message || 'Error booking event', type: 'error', show: true });
    } finally {
      setBookingLoadingIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(eventId);
        return newSet;
      });
    }
  };

  // WhatsApp share
  const handleWhatsAppShare = (event: Event) => {
    const text = `Check out this event: ${event.name}\nDate: ${event.event_date} ${event.event_time}\nLocation: ${event.address}\n${event.additional_info || ''}`;
    const encodedText = encodeURIComponent(text);
    const whatsappUrl = `https://wa.me/?text=${encodedText}`;
    window.open(whatsappUrl, '_blank');
  };

  const capacityPercentage = (current: number, total: number) => {
    return (current / total) * 100;
  };

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUserRole(payload.role);
        if (payload.role === 'participant') fetchParticipantBookings(token);
      } catch (e) {
        console.error('Failed to decode token:', e);
      }
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [userRole]);

  const filteredEvents = events.filter((event) => {
    const matchesLocation = event.address.toLowerCase().includes(searchLocation.toLowerCase());
    const matchesDate = selectedDate ? event.event_date === selectedDate : true;
    return matchesLocation && matchesDate;
  });

  return (
    <DashboardLayout title="Events">
      <Toast
        message={toast.message}
        type={toast.type}
        show={toast.show}
        onClose={() => setToast({ ...toast, show: false })}
      />

      <div className="flex justify-between items-center mb-6">
        <div className="flex gap-4 items-end flex-1">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Enter a location/Postcode"
                value={searchLocation}
                onChange={(e) => setSearchLocation(e.target.value)}
                className="pl-10 h-12"
              />
            </div>
          </div>

          <div className="flex-1">
            <div className="relative">
              <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="pl-10 h-12"
              />
            </div>
          </div>
        </div>

        {userRole === 'admin' && (
          <Button
            onClick={() => router.push('/events/create')}
            className="ml-4 h-12 bg-emerald-500 hover:bg-emerald-600"
          >
            <PlusCircle className="mr-2 h-5 w-5" />
            Create Event
          </Button>
        )}
      </div>

      {loading ? (
        <p className="text-gray-500">Loading events...</p>
      ) : filteredEvents.length === 0 ? (
        <p className="text-gray-500">No events found</p>
      ) : (
        <div className="space-y-4">
          {filteredEvents.map((event) => {
            const isBooked = bookedEventIds.has(event.id);
            const isBookingLoading = bookingLoadingIds.has(event.id);

            return (
              <Card
                key={event.id}
                className="border-gray-200 hover:shadow-md transition-shadow"
              >
                <CardContent className="p-6 flex flex-col md:flex-row md:items-center justify-between">
                  <div className="flex-1 mb-4 md:mb-0">
                    <h3 className="text-lg font-semibold mb-2">{event.name}</h3>
                    <p className="text-sm text-gray-600 mb-1">
                      {event.event_date} • {event.event_time}
                    </p>
                    <p className="text-sm text-gray-600 mb-2">{event.address}</p>

                    <div className="flex items-center gap-3">
                      <span className="text-sm text-gray-600 min-w-[80px]">Capacity:</span>
                      <div className="flex-1 max-w-xs">
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all ${
                              event.available_slots === 0 ? 'bg-rose-500' : 'bg-emerald-500'
                            }`}
                            style={{
                              width: `${capacityPercentage(
                                event.total_slots - event.available_slots,
                                event.total_slots
                              )}%`,
                            }}
                          />
                        </div>
                      </div>
                      <span className="text-sm font-medium min-w-[60px]">
                        {event.total_slots - event.available_slots}/{event.total_slots}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 md:ml-6">
                    <Button
                      variant="outline"
                      onClick={() => router.push(`/events/${event.id}`)}
                      className="border-emerald-500 text-emerald-600 hover:bg-emerald-50"
                    >
                      Details
                    </Button>

                    {userRole === 'participant' && (
                      <>
                        {isBooked ? (
                          <Button disabled className="bg-gray-400 text-white">
                            Booked
                          </Button>
                        ) : event.available_slots === 0 ? (
                          <Button disabled className="bg-gray-300 text-white">Full</Button>
                        ) : (
                          <Button
                            onClick={() => handleBookEvent(event.id)}
                            disabled={isBookingLoading}
                            className={`bg-emerald-500 hover:bg-emerald-600 ${
                              isBookingLoading ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                          >
                            {isBookingLoading ? 'Booking...' : 'Book'}
                          </Button>
                        )}
                      </>
                    )}

                    <Button
                      onClick={() => handleWhatsAppShare(event)}
                      className="bg-emerald-500 hover:bg-emerald-600 text-white"
                    >
                      Share via WhatsApp
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </DashboardLayout>
  );
}
