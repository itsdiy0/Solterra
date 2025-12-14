'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Toast from '@/components/ui/toast';
import {
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Users,
  CheckCircle,
  ArrowRight,
  Search,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

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

type FilterType = 'all' | 'available' | 'booked' | 'past';

export default function EventsPage() {
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [bookedEventIds, setBookedEventIds] = useState<Set<string>>(new Set());
  const [searchLocation, setSearchLocation] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [currentPage, setCurrentPage] = useState(1);
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

  const ITEMS_PER_PAGE = 12;

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      const payload = JSON.parse(atob(token.split('.')[1]));
      setUserRole(payload.role);
      if (payload.role === 'participant') {
        fetchParticipantBookings(token);
      }
    }
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/events`);
      if (!res.ok) throw new Error('Failed to fetch events');
      const data = await res.json();
      setEvents(data);
    } catch (err: any) {
      setToast({
        message: err.message || 'Failed to load events',
        type: 'error',
        show: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchParticipantBookings = async (token: string) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/bookings`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        const bookedIds: Set<string> = new Set(
          data.bookings
            .filter((b: any) => b.booking_status !== 'cancelled')
            .map((b: any) => b.event.id)
        );
        setBookedEventIds(bookedIds);
      }
    } catch (err) {
      console.error('Failed to fetch bookings:', err);
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

  const isEventPast = (eventDate: string, eventTime?: string) => {
    const now = new Date();
    const eventDateTime = new Date(eventDate);

    if (eventTime) {
      const [hours, minutes] = eventTime.split(':').map(Number);
      eventDateTime.setHours(hours, minutes, 0, 0);
    } else {
      eventDateTime.setHours(23, 59, 59, 999);
    }

    return eventDateTime < now;
  };

  const getSortedAndFilteredEvents = () => {
    let filtered = events.filter((event) => {
      const matchesLocation = event.address.toLowerCase().includes(searchLocation.toLowerCase());
      const isPast = isEventPast(event.event_date, event.event_time);
      const isBooked = bookedEventIds.has(event.id);

      if (activeFilter === 'available') {
        return matchesLocation && !isPast && !isBooked && event.available_slots > 0;
      } else if (activeFilter === 'booked') {
        return matchesLocation && isBooked && !isPast;
      } else if (activeFilter === 'past') {
        return matchesLocation && isPast;
      }
      return matchesLocation;
    });

    return filtered.sort((a, b) => {
      const aIsPast = isEventPast(a.event_date, a.event_time);
      const bIsPast = isEventPast(b.event_date, b.event_time);
      const aIsBooked = bookedEventIds.has(a.id);
      const bIsBooked = bookedEventIds.has(b.id);
      const aFullyBooked = a.available_slots === 0;
      const bFullyBooked = b.available_slots === 0;

      if (aIsPast && !bIsPast) return 1;
      if (!aIsPast && bIsPast) return -1;

      if (!aIsPast && !bIsPast) {
        if (!aIsBooked && !aFullyBooked && (bIsBooked || bFullyBooked)) return -1;
        if ((aIsBooked || aFullyBooked) && !bIsBooked && !bFullyBooked) return 1;
        if (aIsBooked && !bIsBooked && !bFullyBooked) return -1;
        if (!aIsBooked && !aFullyBooked && bIsBooked) return 1;
      }

      return aIsPast
        ? new Date(a.event_date).getTime() - new Date(b.event_date).getTime()
        : new Date(b.event_date).getTime() - new Date(a.event_date).getTime();
    });
  };

  const sortedAndFilteredEvents = getSortedAndFilteredEvents();

  const totalPages = Math.ceil(sortedAndFilteredEvents.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedEvents = sortedAndFilteredEvents.slice(startIndex, endIndex);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeFilter, searchLocation]);

  const availableCount = events.filter(e => !isEventPast(e.event_date, e.event_time) && !bookedEventIds.has(e.id) && e.available_slots > 0).length;
  const bookedCount = events.filter(e => bookedEventIds.has(e.id) && !isEventPast(e.event_date, e.event_time)).length;
  const pastCount = events.filter(e => isEventPast(e.event_date, e.event_time)).length;

  return (
    <ProtectedRoute requiredRole="participant">
      <DashboardLayout title="Browse Events">
        <Toast
          message={toast.message}
          type={toast.type}
          show={toast.show}
          onClose={() => setToast({ ...toast, show: false })}
        />

        <div className="mb-6 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            type="text"
            placeholder="Search by location..."
            value={searchLocation}
            onChange={(e) => setSearchLocation(e.target.value)}
            className="pl-10 h-12"
          />
        </div>

        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          <Button
            onClick={() => setActiveFilter('all')}
            variant={activeFilter === 'all' ? 'default' : 'outline'}
            className={activeFilter === 'all' ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
          >
            All Events
            <span className="ml-2 px-2 py-0.5 rounded-full bg-black/20 text-xs">
              {events.length}
            </span>
          </Button>
          <Button
            onClick={() => setActiveFilter('available')}
            variant={activeFilter === 'available' ? 'default' : 'outline'}
            className={activeFilter === 'available' ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
          >
            Available
            <span className="ml-2 px-2 py-0.5 rounded-full bg-black/20 text-xs">
              {availableCount}
            </span>
          </Button>
          {userRole === 'participant' && (
            <Button
              onClick={() => setActiveFilter('booked')}
              variant={activeFilter === 'booked' ? 'default' : 'outline'}
              className={activeFilter === 'booked' ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
            >
              My Bookings
              <span className="ml-2 px-2 py-0.5 rounded-full bg-black/20 text-xs">
                {bookedCount}
              </span>
            </Button>
          )}
          <Button
            onClick={() => setActiveFilter('past')}
            variant={activeFilter === 'past' ? 'default' : 'outline'}
            className={activeFilter === 'past' ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
          >
            Past Events
            <span className="ml-2 px-2 py-0.5 rounded-full bg-black/20 text-xs">
              {pastCount}
            </span>
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Loading events...</p>
          </div>
        ) : paginatedEvents.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-gray-500">No events found</p>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
              {paginatedEvents.map((event) => {
                const bookedSlots = event.total_slots - event.available_slots;
                const percentage = capacityPercentage(bookedSlots, event.total_slots);
                const isBooked = bookedEventIds.has(event.id);
                const isPast = isEventPast(event.event_date, event.event_time);

                return (
                  <Card
                    key={event.id}
                    className={`hover:shadow-lg transition-shadow ${isPast ? 'opacity-60' : ''}`}
                  >
                    <CardContent>
                      <div className="flex flex-col gap-4">
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-2">
                            <h3 className="text-lg sm:text-xl font-bold text-gray-900 line-clamp-2">{event.name}</h3>
                            {isPast && (
                              <span className="px-2 sm:px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 whitespace-nowrap ml-2">
                                Past
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 font-mono mb-3">{event.event_code}</p>

                          <div className="space-y-2 mb-4">
                            <div className="flex items-center gap-2 text-gray-600">
                              <CalendarIcon className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                              <span className="text-sm">
                                {new Date(event.event_date).toLocaleDateString('en-US', {
                                  weekday: 'short',
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric',
                                })}
                              </span>
                            </div>

                            <div className="flex items-center gap-2 text-gray-600">
                              <Clock className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                              <span className="text-sm">{event.event_time.slice(0, 5)} onwards</span>
                            </div>

                            <div className="flex items-start gap-2 text-gray-600">
                              <MapPin className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                              <span className="text-sm line-clamp-2">{event.address}</span>
                            </div>
                          </div>

                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs text-gray-600 flex items-center gap-1">
                                <Users className="w-3 h-3" />
                                Capacity
                              </span>
                              <span className="text-xs font-medium text-gray-900">
                                {bookedSlots} / {event.total_slots}
                                {event.available_slots > 0 && !isPast && (
                                  <span className="text-emerald-600 ml-1">
                                    ({event.available_slots} left)
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

                        <div className={`flex flex-col gap-2 pt-4 border-t ${isPast ? 'pointer-events-none' : ''}`}>
                          {!isPast && userRole === 'participant' ? (
                            <>
                              {isBooked ? (
                                <Button
                                  onClick={() => router.push('/bookings')}
                                  className="w-full h-11 bg-gray-500 hover:bg-gray-600 text-white font-semibold"
                                >
                                  <CheckCircle className="w-4 h-4 mr-2" />
                                  Already Booked
                                </Button>
                              ) : event.available_slots === 0 ? (
                                <Button
                                  disabled
                                  className="w-full h-11 bg-red-100 text-red-700 font-semibold cursor-not-allowed"
                                >
                                  Fully Booked
                                </Button>
                              ) : (
                                <Button
                                  onClick={() => router.push(`/events/${event.event_code}`)}
                                  className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-sm"
                                >
                                  Book Now
                                  <ArrowRight className="w-4 h-4 ml-2" />
                                </Button>
                              )}
                              <Button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleWhatsAppShare(event);
                                }}
                                variant="outline"
                                className="w-full h-11"
                              >
                                Share via WhatsApp
                              </Button>
                            </>
                          ) : !isPast ? (
                            <>
                              <Button
                                onClick={() => router.push(`/events/${event.event_code}`)}
                                variant="outline"
                                className="w-full h-11 border-emerald-500 text-emerald-600 hover:bg-emerald-50"
                              >
                                View Details
                              </Button>
                              <Button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleWhatsAppShare(event);
                                }}
                                variant="outline"
                                className="w-full h-11"
                              >
                                Share via WhatsApp
                              </Button>
                            </>
                          ) : (
                            <Button
                              disabled
                              variant="outline"
                              className="w-full h-11 cursor-not-allowed"
                            >
                              Event Ended
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2">
                <Button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  variant="outline"
                  size="sm"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <Button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      variant={currentPage === page ? 'default' : 'outline'}
                      size="sm"
                      className={currentPage === page ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
                    >
                      {page}
                    </Button>
                  ))}
                </div>

                <Button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  variant="outline"
                  size="sm"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            )}
          </>
        )}
      </DashboardLayout>
    </ProtectedRoute>
  );
}