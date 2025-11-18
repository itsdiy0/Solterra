'use client';

import { useEffect, useState } from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, Users } from 'lucide-react';

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
          <p className="text-gray-500 text-center py-12">Loading bookings...</p>
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

  return (
    <ProtectedRoute requiredRole="participant">
      <DashboardLayout title="My Calendar">
        <h2 className="text-xl font-semibold mb-4">Bookings Calendar</h2>

        <div className="flex justify-between items-center mb-4">
          <button
            className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300"
            onClick={goToPreviousMonth}
          >
            ← Previous
          </button>
          <h3 className="text-lg font-semibold">
            {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
          </h3>
          <button
            className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300"
            onClick={goToNextMonth}
          >
            Next →
          </button>
        </div>

        <div className="flex items-center gap-4 mb-4 flex-wrap">
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-emerald-500" />
            <span className="text-sm text-gray-700">Confirmed</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-pink-500" />
            <span className="text-sm text-gray-700">Incomplete</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-gray-400" />
            <span className="text-sm text-gray-700">Cancelled</span>
          </div>
        </div>

        <div className="grid grid-cols-7 text-center font-semibold mb-2">
          {weekdays.map((day) => (
            <div key={day}>{day}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-2 mb-6">
          {leadingEmptyDays.map((_, idx) => (
            <div key={`empty-${idx}`} />
          ))}

          {monthDays.map((day) => {
            const dateStr = `${year}-${(month + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
            const dayBookings = bookingsByDate(dateStr);

            const dots = dayBookings.map((b, idx) => {
              const color =
                b.booking_status === 'confirmed'
                  ? 'bg-emerald-500'
                  : b.booking_status === 'incomplete'
                  ? 'bg-pink-500'
                  : b.booking_status === 'cancelled'
                  ? 'bg-gray-400'
                  : 'bg-gray-300';
              return (
                <span
                  key={idx}
                  className={`w-2 h-2 rounded-full ${color}`}
                  title={`${b.event.name} (${b.booking_status.charAt(0).toUpperCase() + b.booking_status.slice(1)})`}
                />
              );
            });

            const isToday =
              day === today.getDate() &&
              month === today.getMonth() &&
              year === today.getFullYear();

            return (
              <div
                key={day}
                onClick={() => setSelectedDate(dateStr)}
                className={`cursor-pointer rounded p-2 text-center border 
                  ${isToday ? 'border-emerald-500 bg-emerald-50 font-semibold' : 'bg-gray-50 hover:bg-gray-100'}`}
              >
                <div className="text-sm mb-1">{day}</div>
                <div className="flex justify-center gap-1 flex-wrap">{dots}</div>
              </div>
            );
          })}
        </div>

        <h3 className="text-lg font-semibold mb-2">
          {selectedDate
            ? `Bookings on ${new Date(selectedDate).toLocaleDateString(undefined, {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
              })}`
            : 'Select a day to view bookings'}
        </h3>

        <div className="space-y-4 max-w-4xl">
          {selectedDate &&
            bookingsByDate(selectedDate).map((booking) => {
              const event = booking.event;
              const isWaitlist = event.available_slots === 0 && booking.booking_status !== 'confirmed';
              const isIncomplete = event.available_slots > 0 && booking.booking_status !== 'confirmed';
              const isCancelled = booking.booking_status === 'cancelled';
              const statusLabel = isCancelled
                ? 'Cancelled'
                : booking.booking_status === 'confirmed'
                ? 'Confirmed'
                : isIncomplete
                ? 'Incomplete'
                : 'Waitlist';
              const statusColor = isCancelled
                ? 'gray'
                : booking.booking_status === 'confirmed'
                ? 'green'
                : isIncomplete
                ? 'pink'
                : 'gray';
              const isCanceling = cancelingIds.has(booking.id);

              return (
                <Card key={booking.id} className="border-gray-200">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-3">
                          <h3 className="text-lg font-semibold">{event.name}</h3>
                          <span
                            className={`text-xs font-medium px-3 py-1 rounded-full bg-${statusColor}-100 text-${statusColor}-600`}
                          >
                            {statusLabel}
                          </span>
                        </div>

                        <div className="space-y-2 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-emerald-600" />
                            <span>
                              {new Date(event.event_date).toLocaleDateString(undefined, {
                                weekday: 'long',
                                day: 'numeric',
                                month: 'long',
                              })}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-emerald-600" />
                            {isWaitlist ? (
                              <span>Waiting in the queue</span>
                            ) : (
                              <span>Start: {event.event_time.slice(0, 5)}</span>
                            )}
                          </div>
                          {isIncomplete && event.available_slots !== undefined && (
                            <div className="flex items-center gap-2">
                              <Users className="w-4 h-4 text-emerald-600" />
                              <span className="font-medium text-emerald-600">
                                {event.available_slots} spaces remaining
                              </span>
                            </div>
                          )}
                          <div className="flex items-center gap-2">
                            <span className="font-medium">Address:</span> {event.address}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">Booking Ref:</span> {booking.booking_reference}
                          </div>
                        </div>

                        {isIncomplete && (
                          <div className="mt-3 p-3 bg-pink-50 border border-pink-200 rounded-md">
                            <p className="text-xs text-pink-700">
                              Complete your booking by accepting the terms and conditions
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="ml-6 flex flex-col gap-2">
                        {!isCancelled && (
                          <Button
                            onClick={() => handleCancelBooking(booking.id)}
                            disabled={isCanceling}
                            className="bg-red-500 hover:bg-red-600"
                          >
                            {isCanceling ? 'Cancelling...' : isWaitlist ? 'Leave Waitlist' : 'Cancel Booking'}
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}