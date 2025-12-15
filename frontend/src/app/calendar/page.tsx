'use client';

import { useEffect, useState } from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, MapPin, ChevronLeft, ChevronRight, X } from 'lucide-react';

interface Event {
  id: string;
  name: string;
  event_date: string;
  event_time: string;
  address: string;
  total_slots: number;
  available_slots: number;
}

interface Booking {
  id: string;
  booking_reference: string;
  booking_status: string;
  booked_at: string;
  cancelled_at?: string | null;
  event: Event;
}

export default function MyCalendarPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [cancelingIds, setCancelingIds] = useState<Set<string>>(new Set());
  const [currentMonth, setCurrentMonth] = useState(new Date());

  useEffect(() => {
    const fetchBookings = async () => {
      const token = localStorage.getItem('access_token');
      if (!token) return;

      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/participant/bookings`, {
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        });
        if (!res.ok) throw new Error('Failed to fetch bookings');

        const data: Booking[] = await res.json();
        const now = new Date();
        setBookings(
          data.filter(
            (b) => new Date(`${b.event.event_date}T${b.event.event_time}`) >= now
          )
        );
      } catch (err: any) {
        setError(err.message || 'Error fetching bookings');
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, []);

  const handleCancelBooking = async (bookingId: string) => {
    if (!confirm('Are you sure you want to cancel this booking?')) return;
    setCancelingIds((prev) => new Set(prev).add(bookingId));

    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/participant/bookings/${bookingId}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.detail?.[0]?.msg || 'Failed to cancel booking');

      alert(data.message || 'Booking cancelled successfully');
      setBookings((prev) =>
        prev.map((b) =>
          b.id === bookingId ? { ...b, booking_status: 'cancelled', cancelled_at: new Date().toISOString() } : b
        )
      );
    } catch (err) {
      console.error(err);
      alert('Failed to cancel booking. Please try again.');
    } finally {
      setCancelingIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(bookingId);
        return newSet;
      });
    }
  };

  if (loading) {
    return (
      <ProtectedRoute requiredRole="participant">
        <DashboardLayout title="My Calendar">
          <p className="text-gray-500 text-center py-12">Loading...</p>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  if (error) {
    return (
      <ProtectedRoute requiredRole="participant">
        <DashboardLayout title="My Calendar">
          <p className="text-red-600 text-center py-12">{error}</p>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthDays = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const bookingsByDate = (date: string) =>
    bookings.filter((b) => b.event.event_date === date);

  const goToPreviousMonth = () => setCurrentMonth(new Date(year, month - 1, 1));
  const goToNextMonth = () => setCurrentMonth(new Date(year, month + 1, 1));

  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const leadingEmptyDays = Array.from({ length: firstDay }, (_, i) => null);
  const today = new Date();

  const selectedBookings = selectedDate ? bookingsByDate(selectedDate) : [];

  return (
    <ProtectedRoute requiredRole="participant">
      <DashboardLayout title="My Calendar">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Calendar Section - Left Side */}
          <div className="lg:col-span-3">
            <Card>
              <CardContent className="p-4">
                {/* Month Navigation */}
                <div className="flex justify-between items-center mb-4">
                  <button
                    onClick={goToPreviousMonth}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <h3 className="text-lg font-semibold">
                    {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
                  </h3>
                  <button
                    onClick={goToNextMonth}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>

                {/* Legend */}
                <div className="flex items-center justify-center gap-4 mb-4 text-xs">
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="text-gray-600">Confirmed</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    <span className="text-gray-600">Pending</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-gray-400" />
                    <span className="text-gray-600">Cancelled</span>
                  </div>
                </div>

                {/* Weekday Headers */}
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {weekdays.map((day) => (
                    <div key={day} className="text-center text-xs font-medium text-gray-500 py-2">
                      {day}
                    </div>
                  ))}
                </div>

                {/* Calendar Days */}
                <div className="grid grid-cols-7 gap-1">
                  {leadingEmptyDays.map((_, idx) => (
                    <div key={`empty-${idx}`} className="aspect-square" />
                  ))}

                  {monthDays.map((day) => {
                    const dateStr = `${year}-${(month + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
                    const dayBookings = bookingsByDate(dateStr);
                    const hasBookings = dayBookings.length > 0;

                    const isToday =
                      day === today.getDate() &&
                      month === today.getMonth() &&
                      year === today.getFullYear();

                    const isSelected = dateStr === selectedDate;

                    return (
                      <button
                        key={day}
                        onClick={() => setSelectedDate(dateStr)}
                        className={`aspect-square rounded-lg p-1 text-sm font-medium transition-all relative
                          ${isToday ? 'bg-emerald-50 text-emerald-700 ring-2 ring-emerald-500' : ''}
                          ${isSelected ? 'bg-emerald-600 text-white' : ''}
                          ${!isToday && !isSelected ? 'hover:bg-gray-100' : ''}
                        `}
                      >
                        <span className="block">{day}</span>
                        {hasBookings && (
                          <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 flex gap-0.5">
                            {dayBookings.slice(0, 3).map((booking, idx) => (
                              <span
                                key={idx}
                                className={`w-1 h-1 rounded-full ${
                                  isSelected 
                                    ? 'bg-white' 
                                    : booking.booking_status === 'confirmed'
                                    ? 'bg-emerald-500'
                                    : booking.booking_status === 'cancelled'
                                    ? 'bg-gray-400'
                                    : 'bg-amber-500'
                                }`}
                              />
                            ))}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Summary */}
                <div className="mt-4 pt-4 border-t">
                  <p className="text-sm text-gray-600 text-center">
                    <span className="font-semibold text-emerald-600">{bookings.filter(b => b.booking_status === 'confirmed').length}</span> upcoming bookings
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Events Section - Right Side */}
          <div className="lg:col-span-2">
            <div className="mb-4">
              <h2 className="text-xl font-semibold">
                {selectedDate
                  ? `Bookings on ${new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                    })}`
                  : 'Select a date to view bookings'}
              </h2>
              {selectedDate && selectedBookings.length > 0 && (
                <p className="text-sm text-gray-500 mt-1">
                  {selectedBookings.length} {selectedBookings.length === 1 ? 'booking' : 'bookings'}
                </p>
              )}
            </div>

            <div className="space-y-4">
              {!selectedDate && (
                <Card>
                  <CardContent className="p-12 text-center">
                    <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-500">Select a date from the calendar to view your bookings</p>
                  </CardContent>
                </Card>
              )}

              {selectedDate && selectedBookings.length === 0 && (
                <Card>
                  <CardContent className="p-12 text-center">
                    <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-500">No bookings on this date</p>
                  </CardContent>
                </Card>
              )}

              {selectedBookings.map((booking) => {
                const event = booking.event;
                const isCancelled = booking.booking_status === 'cancelled';
                const statusLabel = isCancelled 
                  ? 'Cancelled' 
                  : booking.booking_status === 'confirmed' 
                  ? 'Confirmed' 
                  : 'Pending';
                const statusColor = isCancelled
                  ? 'bg-gray-100 text-gray-700'
                  : booking.booking_status === 'confirmed'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-amber-100 text-amber-700';
                const isCanceling = cancelingIds.has(booking.id);

                return (
                  <Card key={booking.id} className={`hover:shadow-md transition-shadow ${isCancelled ? 'opacity-60' : ''}`}>
                    <CardContent className="p-6">
                      <div className="flex flex-col sm:flex-row gap-4">
                        {/* Event Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-3">
                            <h3 className="text-lg font-semibold text-gray-900 break-words">
                              {event.name}
                            </h3>
                            <span
                              className={`px-3 py-2 rounded-sm text-xs font-medium whitespace-nowrap flex-shrink-0 ${statusColor}`}
                            >
                              {statusLabel}
                            </span>
                          </div>

                          <div className="space-y-2 text-sm text-gray-600 mb-4">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                              <span className="break-words">
                                {new Date(event.event_date + 'T00:00:00').toLocaleDateString('en-US', {
                                  weekday: 'long',
                                  day: 'numeric',
                                  month: 'long',
                                  year: 'numeric',
                                })}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                              <span>{event.event_time.slice(0, 5)}</span>
                            </div>
                            <div className="flex items-start gap-2">
                              <MapPin className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                              <span className="break-words">{event.address}</span>
                            </div>
                          </div>

                          <div className="p-3 bg-gray-50 rounded-lg">
                            <p className="text-xs text-gray-500">Booking Reference</p>
                            <p className="text-sm font-mono font-medium text-gray-900 mt-1">
                              {booking.booking_reference}
                            </p>
                          </div>
                        </div>

                        {/* Cancel Button */}
                        {!isCancelled && (
                          <div className="flex sm:flex-col gap-2 sm:min-w-[120px]">
                            <Button
                              onClick={() => handleCancelBooking(booking.id)}
                              disabled={isCanceling}
                              variant="outline"
                              size="sm"
                              className="w-full p-0 text-red-600 hover:bg-red-50 border-red-300"
                            >
                              <X className="w-4 h-4 mr-2" />
                              {isCanceling ? 'Cancelling...' : 'Cancel'}
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}