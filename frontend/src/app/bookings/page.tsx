'use client';

import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, MapPin, Users } from 'lucide-react';

export default function MyBookingsPage() {
  // Mock bookings data
  const bookings = [
    {
      id: '1',
      eventName: 'Kampung Sentosa Community Hall',
      address: 'Kampung Sentosa, Selangor',
      date: 'Thursday 12th December',
      startTime: '11:00',
      status: 'Incomplete',
      statusColor: 'pink',
      slotsRemaining: 11,
      action: 'cancel'
    },
    {
      id: '2',
      eventName: 'Klinik Desa Bagan, Selangor',
      address: 'Klinik Desa Bagan, Selangor',
      date: 'Saturday 14th December',
      startTime: 'Waiting',
      status: 'Waitlist',
      statusColor: 'gray',
      waitlistPosition: 5,
      action: 'leave'
    },
  ];

  const handleCancelBooking = (bookingId: string) => {
    if (confirm('Are you sure you want to cancel this booking?')) {
      // TODO: Connect to API
      alert(`Cancelling booking ${bookingId}`);
    }
  };

  const handleLeaveWaitlist = (bookingId: string) => {
    if (confirm('Are you sure you want to leave the waitlist?')) {
      // TODO: Connect to API
      alert(`Leaving waitlist ${bookingId}`);
    }
  };

  return (
    <DashboardLayout title="My Bookings">
      {bookings.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-gray-500">No bookings yet</p>
            <Button 
              className="mt-4 bg-emerald-500 hover:bg-emerald-600"
              onClick={() => window.location.href = '/events'}
            >
              Browse Events
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4 max-w-4xl">
          {bookings.map((booking) => (
            <Card key={booking.id} className="border-gray-200">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  {/* Booking Info */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-lg font-semibold">{booking.eventName}</h3>
                      <span className="text-xs font-medium px-3 py-1 rounded-full bg-rose-100 text-rose-600">
                        {booking.status}
                      </span>
                    </div>

                    <div className="space-y-2 text-sm text-gray-600">
                      {/* Date */}
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-emerald-600" />
                        <span>{booking.date}</span>
                      </div>

                      {/* Time or Status */}
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-emerald-600" />
                        {booking.status === 'Waitlist' ? (
                          <span>Waiting (5 people ahead of you)</span>
                        ) : (
                          <span>Start: {booking.startTime}</span>
                        )}
                      </div>

                      {/* Slots Remaining */}
                      {booking.status === 'Incomplete' && booking.slotsRemaining && (
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-emerald-600" />
                          <span className="font-medium text-emerald-600">
                            {booking.slotsRemaining} spaces remaining
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Status-specific Messages */}
                    {booking.status === 'Incomplete' && (
                      <div className="mt-3 p-3 bg-pink-50 border border-pink-200 rounded-md">
                        <p className="text-xs text-pink-700">
                          Complete your booking by accepting the terms and conditions
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Action Button */}
                  <div className="ml-6">
                    {booking.status === 'Incomplete' ? (
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          onClick={() => alert('View details')}
                          className="border-emerald-500 text-emerald-600 hover:bg-emerald-50"
                        >
                          Other Events
                        </Button>
                        <Button
                          onClick={() => handleCancelBooking(booking.id)}
                          className="bg-red-500 hover:bg-red-600"
                        >
                          Cancel Booking
                        </Button>
                      </div>
                    ) : (
                      <Button
                        onClick={() => handleLeaveWaitlist(booking.id)}
                        className="bg-red-500 hover:bg-red-600"
                      >
                        Leave Waitlist
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}