'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Calendar,
  MapPin,
  Users,
  Plus,
  Edit,
  Trash2,
  Search,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface Event {
  id: string;
  name: string;
  event_code: string;
  event_date: string;
  event_time: string;
  address: string;
  total_slots: number;
  available_slots: number;
  status: string;
}

type FilterType = 'all' | 'published' | 'draft' | 'upcoming' | 'past';

export default function AdminEventsPage() {
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [currentPage, setCurrentPage] = useState(1);

  const ITEMS_PER_PAGE = 12;

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
      fetchEvents();
    } catch (err: any) {
      alert(err.message || 'Failed to delete event');
    }
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
      const matchesSearch =
        event.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.event_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.address.toLowerCase().includes(searchTerm.toLowerCase());

      const isPast = isEventPast(event.event_date, event.event_time);

      if (activeFilter === 'published') {
        return matchesSearch && event.status === 'published';
      } else if (activeFilter === 'draft') {
        return matchesSearch && event.status === 'draft';
      } else if (activeFilter === 'upcoming') {
        return matchesSearch && !isPast;
      } else if (activeFilter === 'past') {
        return matchesSearch && isPast;
      }
      return matchesSearch;
    });

    return filtered.sort((a, b) => {
      const aIsPast = isEventPast(a.event_date, a.event_time);
      const bIsPast = isEventPast(b.event_date, b.event_time);

      if (aIsPast && !bIsPast) return 1;
      if (!aIsPast && bIsPast) return -1;

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
  }, [activeFilter, searchTerm]);

  const publishedCount = events.filter(e => e.status === 'published').length;
  const draftCount = events.filter(e => e.status === 'draft').length;
  const upcomingCount = events.filter(e => !isEventPast(e.event_date, e.event_time)).length;
  const pastCount = events.filter(e => isEventPast(e.event_date, e.event_time)).length;

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
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Event
          </Button>
        </div>

        <div className="mb-6 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            type="text"
            placeholder="Search by name, code, or location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
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
            <span className="ml-2 px-2 py-0.5 rounded-full bg-white/20 text-xs">
              {events.length}
            </span>
          </Button>
          <Button
            onClick={() => setActiveFilter('published')}
            variant={activeFilter === 'published' ? 'default' : 'outline'}
            className={activeFilter === 'published' ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
          >
            Published
            <span className="ml-2 px-2 py-0.5 rounded-full bg-white/20 text-xs">
              {publishedCount}
            </span>
          </Button>
          <Button
            onClick={() => setActiveFilter('draft')}
            variant={activeFilter === 'draft' ? 'default' : 'outline'}
            className={activeFilter === 'draft' ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
          >
            Draft
            <span className="ml-2 px-2 py-0.5 rounded-full bg-white/20 text-xs">
              {draftCount}
            </span>
          </Button>
          <Button
            onClick={() => setActiveFilter('upcoming')}
            variant={activeFilter === 'upcoming' ? 'default' : 'outline'}
            className={activeFilter === 'upcoming' ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
          >
            Upcoming
            <span className="ml-2 px-2 py-0.5 rounded-full bg-white/20 text-xs">
              {upcomingCount}
            </span>
          </Button>
          <Button
            onClick={() => setActiveFilter('past')}
            variant={activeFilter === 'past' ? 'default' : 'outline'}
            className={activeFilter === 'past' ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
          >
            Past Events
            <span className="ml-2 px-2 py-0.5 rounded-full bg-white/20 text-xs">
              {pastCount}
            </span>
          </Button>
        </div>

        {events.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-500 mb-4">No events created yet</p>
              <Button
                onClick={() => router.push('/admin/events/create')}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                Create First Event
              </Button>
            </CardContent>
          </Card>
        ) : paginatedEvents.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-gray-500">No events found matching your filters</p>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
              {paginatedEvents.map((event) => {
                const bookedSlots = event.total_slots - event.available_slots;
                const bookedPercentage = (bookedSlots / event.total_slots) * 100;
                const isPast = isEventPast(event.event_date, event.event_time);

                return (
                  <Card
                    key={event.id}
                    className="hover:shadow-lg transition-shadow"
                  >
                    <CardContent>
                      <div className="flex flex-col">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-xl font-semibold flex-1">{event.name}</h3>
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-medium ${event.status === 'published'
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-gray-100 text-gray-700'
                                }`}
                            >
                              {event.status}
                            </span>
                            {isPast && (
                              <span className="px-3 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                                Past
                              </span>
                            )}
                          </div>

                          <p className="text-sm text-gray-500 font-mono mb-3">{event.event_code}</p>

                          <div className="space-y-2 text-sm text-gray-600 mb-4">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-emerald-600" />
                              <span>
                                {new Date(event.event_date).toLocaleDateString()} at{' '}
                                {event.event_time.slice(0, 5)}
                              </span>
                            </div>
                            <div className="flex items-start gap-2">
                              <MapPin className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                              <span>{event.address}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Users className="w-4 h-4 text-emerald-600" />
                              <span>
                                {bookedSlots} / {event.total_slots} slots booked
                              </span>
                            </div>
                          </div>

                          <div className="mb-3">
                            <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                              <div
                                className={`h-2 rounded-full transition-all ${bookedPercentage >= 100
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
                        </div>

                        <div className="flex flex-col sm:flex-row gap-2 pt-3 border-t">
                          {!isPast && (
                            <Button
                              onClick={() => router.push(`/admin/events/${event.event_code}`)}
                              variant="outline"
                              size="sm"
                              className="w-full sm:flex-1 border-emerald-500 text-emerald-600 hover:bg-emerald-50"
                            >
                              <Edit className="w-4 h-4 mr-2" />
                              Edit
                            </Button>
                          )}
                          <Button
                            onClick={() => router.push(`/admin/events/${event.event_code}/participants`)}
                            variant="outline"
                            size="sm"
                            className="w-full sm:flex-1"
                          >
                            <Users className="w-4 h-4 mr-2" />
                            Participants
                          </Button>
                          <Button
                            onClick={() => handleDelete(event.event_code)}
                            variant="outline"
                            size="sm"
                            className="w-full sm:flex-1 text-red-600 hover:bg-red-50 border-red-300"
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