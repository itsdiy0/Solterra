'use client';

import { useEffect, useState } from 'react';
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
  booking_status: string; // confirmed, incomplete, waitlist
  booked_at: string;
  cancelled_at?: string | null;
  event: Event;
}

export default function MyBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancelingIds, setCancelingIds] = useState<Set<string>>(new Set());

  const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;

  const handleCancelBooking = async (bookingId: string) => {
    if (!confirm('Are you sure you want to cancel this booking?')) return;

    setCancelingIds((prev) => new Set(prev).add(bookingId));

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/participant/bookings/${bookingId}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.detail?.[0]?.msg || 'Failed to cancel booking');
        return;
      }

      alert(data.message || 'Booking cancelled successfully');

      // Update UI immediately
      setBookings((prev) =>
        prev.map((b) =>
          b.id === bookingId
            ? { ...b, booking_status: 'cancelled', cancelled_at: new Date().toISOString() }
            : b
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

  const handleLeaveWaitlist = async (bookingId: string) => {
    if (!confirm('Are you sure you want to leave the waitlist?')) return;

    setCancelingIds((prev) => new Set(prev).add(bookingId));

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/participant/bookings/${bookingId}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.detail?.[0]?.msg || 'Failed to leave waitlist');
        return;
      }

      alert('You have left the waitlist successfully');

      setBookings((prev) =>
        prev.map((b) =>
          b.id === bookingId
            ? { ...b, booking_status: 'cancelled', cancelled_at: new Date().toISOString() }
            : b
        )
      );
    } catch (err) {
      console.error(err);
      alert('Failed to leave waitlist. Please try again.');
    } finally {
      setCancelingIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(bookingId);
        return newSet;
      });
    }
  };

  useEffect(() => {
    if (!token) {
      window.location.href = '/auth/login';
      return;
    }

    const fetchBookings = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/participant/bookings`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!res.ok) throw new Error('Failed to fetch bookings');

        const data: Booking[] = await res.json();
        setBookings(data);
      } catch (err: any) {
        setError(err.message || 'Error fetching bookings');
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, [token]);

  if (loading) {
    return (
      <DashboardLayout title="My Bookings">
        <p className="text-gray-500 text-center py-12">Loading bookings...</p>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout title="My Bookings">
        <p className="text-red-600 text-center py-12">{error}</p>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="My Bookings">
      {bookings.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-gray-500">No bookings yet</p>
            <Button
              className="mt-4 bg-emerald-500 hover:bg-emerald-600"
              onClick={() => (window.location.href = '/events')}
            >
              Browse Events
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4 max-w-4xl">
          {bookings.map((booking) => {
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
                      {/* Header */}
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="text-lg font-semibold">{event.name}</h3>
                        <span
                          className={`text-xs font-medium px-3 py-1 rounded-full bg-${statusColor}-100 text-${statusColor}-600`}
                        >
                          {statusLabel}
                        </span>
                      </div>

                      {/* Details */}
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
                          {isWaitlist ? <span>Waiting in the queue</span> : <span>Start: {event.event_time.slice(0, 5)}</span>}
                        </div>
                        {isIncomplete && event.available_slots !== undefined && (
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-emerald-600" />
                            <span className="font-medium text-emerald-600">{event.available_slots} spaces remaining</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Address:</span> {event.address}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Booking Ref:</span> {booking.booking_reference}
                        </div>
                      </div>

                      {/* Incomplete notice */}
                      {isIncomplete && (
                        <div className="mt-3 p-3 bg-pink-50 border border-pink-200 rounded-md">
                          <p className="text-xs text-pink-700">
                            Complete your booking by accepting the terms and conditions
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
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
      )}
    </DashboardLayout>
  );
}
