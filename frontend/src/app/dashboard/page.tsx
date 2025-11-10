'use client';

import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function DashboardPage() {
  // Mock data (will come from API later)
  const upcomingEvents = [
    { id: 1, name: 'Kampung Sentosa Hall', date: 'Thur 12th Dec', time: '09:00 - 16:00' },
    { id: 2, name: 'Kampung Sentosa Hall', date: 'Thur 12th Dec', time: '09:00 - 16:00' },
    { id: 3, name: 'Kampung Sentosa Hall', date: 'Thur 12th Dec', time: '09:00 - 18:00' },
  ];

  const myBookings = [
    { id: 1, name: 'Kampung Sentosa Hall', date: 'Thur 12th Dec', time: '11:00 - 12:00', status: 'Pending Check-in' },
  ];

  return (
    <DashboardLayout title="Dashboard">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Events */}
        <div>
          <h2 className="text-xl font-bold mb-4">Upcoming Events</h2>
          <div className="space-y-3">
            {upcomingEvents.map((event) => (
              <Card key={event.id} className="bg-gradient-to-r from-pink-400 to-rose-400 border-none">
                <CardContent className="p-4">
                  <h3 className="font-semibold text-white mb-2">{event.name}</h3>
                  <div className="flex justify-between items-center text-white text-sm">
                    <span>{event.date}</span>
                    <span>{event.time}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* My Bookings & Test Results */}
        <div className="space-y-6">
          {/* My Bookings */}
          <div>
            <h2 className="text-xl font-bold mb-4">My Bookings</h2>
            {myBookings.map((booking) => (
              <Card key={booking.id} className="bg-emerald-100 border-emerald-200">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold">{booking.name}</h3>
                    <span className="text-xs bg-rose-400 text-white px-2 py-1 rounded">
                      {booking.status}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm text-gray-600">
                    <span>{booking.date}</span>
                    <span>{booking.time}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Test Results */}
          <div>
            <h2 className="text-xl font-bold mb-4">Test Results</h2>
            <Card className="bg-emerald-100 border-emerald-200">
              <CardContent className="p-8 flex items-center justify-center">
                <p className="text-gray-500">No results available</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}