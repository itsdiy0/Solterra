'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin, Users, Plus, Edit, Trash2 } from 'lucide-react';

interface Event {
  id: string;
  name: string;
  event_date: string;
  event_time: string;
  address: string;
  total_slots: number;
  available_slots: number;
  status: string;
}

export default function AdminEventsPage() {
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    const token = localStorage.getItem('access_token');
    
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/events?published_only=false`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error('Failed to fetch events');

      const data = await res.json();
      setEvents(data);
    } catch (err) {
      console.error(err);
      setError('Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (eventId: string) => {
    if (!confirm('Are you sure you want to delete this event?')) return;

    const token = localStorage.getItem('access_token');
    
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/events/${eventId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || 'Failed to delete event');
      }

      alert('Event deleted successfully!');
      fetchEvents(); // Refresh list
    } catch (err: any) {
      alert(err.message || 'Failed to delete event');
    }
  };

  if (loading) {
    return (
      <ProtectedRoute requiredRole="admin">
        <DashboardLayout title="Manage Events">
          <p className="text-gray-500 text-center py-12">Loading events...</p>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  if (error) {
    return (
      <ProtectedRoute requiredRole="admin">
        <DashboardLayout title="Manage Events">
          <p className="text-red-600 text-center py-12">{error}</p>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requiredRole="admin">
      <DashboardLayout title="Manage Events">
        <div className="mb-6 flex justify-between items-center">
          <h2 className="text-2xl font-bold">Events Management</h2>
          <Button
            onClick={() => router.push('/admin/events/create')}
            className="bg-emerald-500 hover:bg-emerald-600"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Event
          </Button>
        </div>

        {events.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-500 mb-4">No events created yet</p>
              <Button
                onClick={() => router.push('/admin/events/create')}
                className="bg-emerald-500 hover:bg-emerald-600"
              >
                Create First Event
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {events.map((event) => {
              const bookedSlots = event.total_slots - event.available_slots;
              const bookedPercentage = (bookedSlots / event.total_slots) * 100;

              return (
                <Card key={event.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-semibold">{event.name}</h3>
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${
                              event.status === 'published'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            {event.status}
                          </span>
                        </div>

                        <div className="space-y-2 text-sm text-gray-600 mb-4">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            <span>
                              {new Date(event.event_date).toLocaleDateString()} at{' '}
                              {event.event_time}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4" />
                            <span>{event.address}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4" />
                            <span>
                              {bookedSlots} / {event.total_slots} slots booked
                            </span>
                          </div>
                        </div>

                        {/* Capacity Bar */}
                        <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                          <div
                            className={`h-2 rounded-full transition-all ${
                              bookedPercentage >= 100
                                ? 'bg-red-500'
                                : bookedPercentage >= 80
                                ? 'bg-amber-500'
                                : 'bg-emerald-500'
                            }`}
                            style={{ width: `${Math.min(bookedPercentage, 100)}%` }}
                          />
                        </div>
                        <p className="text-xs text-gray-500">
                          {event.available_slots} slots remaining
                        </p>
                      </div>

                      <div className="ml-6 flex flex-col gap-2">
                        <Button
                          onClick={() => router.push(`/admin/events/${event.id}`)}
                          variant="outline"
                          size="sm"
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </Button>
                        <Button
                          onClick={() => router.push(`/admin/events/${event.id}/participants`)}
                          variant="outline"
                          size="sm"
                        >
                          <Users className="w-4 h-4 mr-2" />
                          Participants
                        </Button>
                        <Button
                          onClick={() => handleDelete(event.id)}
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
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
    </ProtectedRoute>
  );
}