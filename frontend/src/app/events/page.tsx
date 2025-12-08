'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Calendar as CalendarIcon, MapPin, Clock, Users, ArrowRight, CheckCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Toast from '@/components/ui/toast';

interface Event {
  id: string;
  name: string;
  event_date: string;
  event_code: string;
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

  useEffect(() => {
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
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      const url = userRole === 'admin'
        ? `${process.env.NEXT_PUBLIC_API_URL}/events/?published_only=false`
        : `${process.env.NEXT_PUBLIC_API_URL}/events/?published_only=true`;

      const headers: HeadersInit = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch(url, { headers });
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
    }
  };

  const handleWhatsAppShare = (event: Event) => {
    const text = `Check out this event: ${event.name}\nDate: ${event.event_date} ${event.event_time}\nLocation: ${event.address}\n${event.additional_info || ''}`;
    const encodedText = encodeURIComponent(text);
    const whatsappUrl = `https://wa.me/?text=${encodedText}`;
    window.open(whatsappUrl, '_blank');
  };

  const capacityPercentage = (current: number, total: number) => {
    return (current / total) * 100;
  };

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

      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-4">Browse Events</h2>

        <div className="flex gap-4 items-end">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Search by location..."
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
      </div>

      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-500">Loading events...</p>
        </div>
      ) : filteredEvents.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-gray-500 mb-4">No events found</p>
            {(searchLocation || selectedDate) && (
              <Button
                onClick={() => {
                  setSearchLocation('');
                  setSelectedDate('');
                }}
                variant="outline"
              >
                Clear Filters
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredEvents.map((event) => {
            const bookedSlots = event.total_slots - event.available_slots;
            const percentage = capacityPercentage(bookedSlots, event.total_slots);
            const isBooked = bookedEventIds.has(event.id);

            return (
              <Card
                key={event.id}
                className="hover:shadow-lg transition-shadow"
              >
                <CardContent>
                  <div className="flex items-start justify-between gap-6">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900 mb-3">{event.name}</h3>
                      <p className="text-xs text-gray-500 font-mono mb-3">{event.event_code}</p>
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center gap-2 text-gray-600">
                          <CalendarIcon className="w-4 h-4 text-emerald-600" />
                          <span className="text-sm">
                            {new Date(event.event_date).toLocaleDateString('en-US', {
                              weekday: 'long',
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                            })}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-gray-600">
                          <Clock className="w-4 h-4 text-emerald-600" />
                          <span className="text-sm">{event.event_time.slice(0, 5)} onwards</span>
                        </div>

                        <div className="flex items-start gap-2 text-gray-600">
                          <MapPin className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                          <span className="text-sm">{event.address}</span>
                        </div>
                      </div>

                      {/* Capacity Bar */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs text-gray-600 flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            Capacity
                          </span>
                          <span className="text-xs font-medium text-gray-900">
                            {bookedSlots} / {event.total_slots} booked
                            {event.available_slots > 0 && (
                              <span className="text-emerald-600 ml-1">
                                ({event.available_slots} spots left)
                              </span>
                            )}
                          </span>
                        </div>
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all ${event.available_slots === 0
                                ? 'bg-red-500'
                                : percentage >= 80
                                  ? 'bg-amber-500'
                                  : 'bg-emerald-500'
                              }`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-3 min-w-[160px]">
                      {userRole === 'participant' ? (
                        <>
                          {isBooked ? (
                            <Button
                              onClick={() => router.push('/bookings')}
                              className="w-full bg-gray-500 hover:bg-gray-600 text-white font-semibold"
                            >
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Already Booked
                            </Button>
                          ) : event.available_slots === 0 ? (
                            <Button
                              disabled
                              className="w-full bg-red-100 text-red-700 font-semibold cursor-not-allowed"
                            >
                              Fully Booked
                            </Button>
                          ) : (
                            <Button
                              onClick={() => router.push(`/events/${event.event_code}`)}
                              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-sm"
                            >
                              Book Now
                              <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                          )}
                        </>
                      ) : (
                        // Guest view - no booking functionality
                        <Button
                          onClick={() => router.push(`/events/${event.event_code}`)}
                          variant="outline"
                          className="w-full border-emerald-500 text-emerald-600 hover:bg-emerald-50"
                        >
                          View Details
                        </Button>
                      )}

                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleWhatsAppShare(event);
                        }}
                        variant="outline"
                        size="sm"
                        className="w-full"
                      >
                        Share via WhatsApp
                      </Button>
                    </div>
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