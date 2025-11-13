'use client';

import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Calendar as CalendarIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function EventsPage() {
  const router = useRouter();
  const [searchLocation, setSearchLocation] = useState('');
  const [selectedDate, setSelectedDate] = useState('');

  // Mock events data
  const events = [
    {
      id: '1',
      name: 'Kampung Sentosa Hall',
      date: 'Thursday 12th December',
      time: '09:00 - 16:00',
      capacity: { current: 60, total: 100 },
      status: 'available'
    },
    {
      id: '2',
      name: 'Klinik Desa Bagan',
      date: 'Saturday 14th December',
      time: '09:00 - 13:00',
      capacity: { current: 80, total: 80 },
      status: 'full'
    },
  ];

  const capacityPercentage = (current: number, total: number) => {
    return (current / total) * 100;
  };

  return (
    <DashboardLayout title="Events">
      <div className="flex gap-4 mb-6 items-end">

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


        <Button className="h-12 px-8 bg-emerald-500 hover:bg-emerald-600">
          <Search className="w-5 h-5" />
        </Button>
      </div>

      <div className="space-y-4">
        {events.map((event) => (
          <Card key={event.id} className="border-gray-200 hover:shadow-md transition-shadow">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold mb-2">{event.name}</h3>
                  
                  <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                    <span>{event.date}</span>
                    <span>•</span>
                    <span>{event.time}</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-600 min-w-[80px]">Capacity:</span>
                    <div className="flex-1 max-w-xs">
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all ${
                            event.status === 'full' 
                              ? 'bg-rose-500' 
                              : 'bg-emerald-500'
                          }`}
                          style={{ width: `${capacityPercentage(event.capacity.current, event.capacity.total)}%` }}
                        />
                      </div>
                    </div>
                    <span className="text-sm font-medium min-w-[60px]">
                      {event.capacity.current}/{event.capacity.total}
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 ml-6">
                  <Button
                    variant="outline"
                    onClick={() => router.push(`/events/${event.id}`)}
                    className="border-emerald-500 text-emerald-600 hover:bg-emerald-50"
                  >
                    Details
                  </Button>
                  
                  {event.status === 'full' ? (
                    <Button
                      className="bg-emerald-500 hover:bg-emerald-600"
                    >
                      Join Waitlist
                    </Button>
                  ) : (
                    <Button
                      onClick={() => alert('Booking flow coming soon')}
                      className="bg-emerald-500 hover:bg-emerald-600"
                    >
                      Book
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </DashboardLayout>
  );
}