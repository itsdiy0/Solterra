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
import Toast from '@/components/ui/toast';

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
  created_by?: string;
}

type FilterType = 'all' | 'published' | 'draft' | 'upcoming' | 'past';

export default function AdminEventsPage() {
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [showMyEventsOnly, setShowMyEventsOnly] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [currentAdminId, setCurrentAdminId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error'; show: boolean }>({
    message: '',
    type: 'success',
    show: false,
  });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [deleteTargetName, setDeleteTargetName] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const ITEMS_PER_PAGE = 12;

  useEffect(() => {
    // Get current admin ID from token
    const token = localStorage.getItem('access_token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setCurrentAdminId(payload.sub);
      } catch (e) {
        console.error('Failed to decode token:', e);
      }
    }
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

  const openDeleteModal = (eventId: string, eventName?: string) => {
    setDeleteTargetId(eventId);
    setDeleteTargetName(eventName || null);
    setShowDeleteModal(true);
  };

  const closeDeleteModal = () => {
    if (deleting) return;
    setShowDeleteModal(false);
    setDeleteTargetId(null);
    setDeleteTargetName(null);
  };

  const handleDelete = async (eventId?: string | null) => {
    if (!eventId) return;
    setDeleting(true);
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

      setToast({ message: 'Event deleted successfully!', type: 'success', show: true });
      closeDeleteModal();
      fetchEvents();
    } catch (err: any) {
      setToast({ message: err.message || 'Failed to delete event', type: 'error', show: true });
      closeDeleteModal();
    } finally {
      setDeleting(false);
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
      const isMyEvent = currentAdminId && event.created_by === currentAdminId;

      // First filter by "My Events" toggle if enabled
      if (showMyEventsOnly && !isMyEvent) {
        return false;
      }

      // Then apply the regular filters
      if (!matchesSearch) return false;

      if (activeFilter === 'published') {
        return event.status === 'published';
      } else if (activeFilter === 'draft') {
        return event.status === 'draft';
      } else if (activeFilter === 'upcoming') {
        return !isPast;
      } else if (activeFilter === 'past') {
        return isPast;
      }
      return true; // 'all' filter
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
  }, [activeFilter, searchTerm, showMyEventsOnly]);

  // Calculate counts based on current "My Events" toggle state
  const getFilteredForCount = () => {
    if (showMyEventsOnly) {
      return events.filter(e => currentAdminId && e.created_by === currentAdminId);
    }
    return events;
  };

  const eventsForCount = getFilteredForCount();
  const publishedCount = eventsForCount.filter(e => e.status === 'published').length;
  const draftCount = eventsForCount.filter(e => e.status === 'draft').length;
  const upcomingCount = eventsForCount.filter(e => !isEventPast(e.event_date, e.event_time)).length;
  const pastCount = eventsForCount.filter(e => isEventPast(e.event_date, e.event_time)).length;
  const myEventsCount = currentAdminId ? events.filter(e => e.created_by === currentAdminId).length : 0;

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
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Event
          </Button>
        </div>

        <Toast
          message={toast.message}
          type={toast.type}
          show={toast.show}
          onClose={() => setToast({ ...toast, show: false })}
        />
        <div className="mb-6 grid grid-cols-1 md:grid-cols-[90%_10%] gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
            <Input
              type="text"
              placeholder="Search by name, code, or location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-12"
            />
          </div>
          
          <Button
            onClick={() => setShowMyEventsOnly(!showMyEventsOnly)}
            variant={showMyEventsOnly ? 'default' : 'outline'}
            className={`w-full h-12 ${showMyEventsOnly ? 'bg-emerald-600 text-white hover:bg-emerald-700' : ''}`}
          >
            <span className="truncate">My Events</span>
            <span className="ml-2 px-2 py-0.5 rounded-full bg-black/20 text-xs flex-shrink-0">
              {myEventsCount}
            </span>
          </Button>
        </div>

        <div className="mb-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
          <Button
            onClick={() => setActiveFilter('all')}
            variant={activeFilter === 'all' ? 'default' : 'outline'}
            className={`w-full ${activeFilter === 'all' ? 'bg-emerald-600 text-white hover:bg-emerald-700' : ''}`}
          >
            <span className="truncate">All Events</span>
            <span className="ml-2 px-2 py-0.5 rounded-full bg-black/20 text-xs flex-shrink-0">
              {eventsForCount.length}
            </span>
          </Button>
          <Button
            onClick={() => setActiveFilter('published')}
            variant={activeFilter === 'published' ? 'default' : 'outline'}
            className={`w-full ${activeFilter === 'published' ? 'bg-emerald-600 text-white hover:bg-emerald-700' : ''}`}
          >
            <span className="truncate">Published</span>
            <span className="ml-2 px-2 py-0.5 rounded-full bg-black/20 text-xs flex-shrink-0">
              {publishedCount}
            </span>
          </Button>
          <Button
            onClick={() => setActiveFilter('draft')}
            variant={activeFilter === 'draft' ? 'default' : 'outline'}
            className={`w-full ${activeFilter === 'draft' ? 'bg-emerald-600 text-white hover:bg-emerald-700' : ''}`}
          >
            <span className="truncate">Draft</span>
            <span className="ml-2 px-2 py-0.5 rounded-full bg-black/20 text-xs flex-shrink-0">
              {draftCount}
            </span>
          </Button>
          <Button
            onClick={() => setActiveFilter('upcoming')}
            variant={activeFilter === 'upcoming' ? 'default' : 'outline'}
            className={`w-full ${activeFilter === 'upcoming' ? 'bg-emerald-600 text-white hover:bg-emerald-700' : ''}`}
          >
            <span className="truncate">Upcoming</span>
            <span className="ml-2 px-2 py-0.5 rounded-full bg-black/20 text-xs flex-shrink-0">
              {upcomingCount}
            </span>
          </Button>
          <Button
            onClick={() => setActiveFilter('past')}
            variant={activeFilter === 'past' ? 'default' : 'outline'}
            className={`w-full ${activeFilter === 'past' ? 'bg-emerald-600 text-white hover:bg-emerald-700' : ''}`}
          >
            <span className="truncate">Past Events</span>
            <span className="ml-2 px-2 py-0.5 rounded-full bg-black/20 text-xs flex-shrink-0">
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
                    <CardContent className="p-4">
                      <div className="flex flex-col">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-xl font-semibold flex-1 break-words">{event.name}</h3>
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap flex-shrink-0 ${event.status === 'published'
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-gray-100 text-gray-700'
                                }`}
                            >
                              {event.status}
                            </span>
                            {isPast && (
                              <span className="px-3 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700 whitespace-nowrap flex-shrink-0">
                                Past
                              </span>
                            )}
                          </div>

                          <p className="text-sm text-gray-500 font-mono mb-3 break-all">{event.event_code}</p>

                          <div className="space-y-2 text-sm text-gray-600 mb-4">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                              <span className="break-words">
                                {new Date(event.event_date).toLocaleDateString()} at{' '}
                                {event.event_time.slice(0, 5)}
                              </span>
                            </div>
                            <div className="flex items-start gap-2">
                              <MapPin className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                              <span className="break-words">{event.address}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Users className="w-4 h-4 text-emerald-600 flex-shrink-0" />
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
                            onClick={() => openDeleteModal(event.event_code, event.name)}
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
              <div className="flex items-center justify-center gap-2 flex-wrap">
                <Button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  variant="outline"
                  size="sm"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>

                <div className="flex items-center gap-1 flex-wrap justify-center">
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
        {showDeleteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40" onClick={closeDeleteModal} />
            <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6 z-10">
              <h3 className="text-lg font-semibold mb-2">Delete Event</h3>
              <p className="text-sm text-gray-600 mb-2">Are you sure you want to delete "{deleteTargetName}"?</p>
              <p className="text-sm text-gray-600 mb-4">This action cannot be undone.</p>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={closeDeleteModal} disabled={deleting}>Cancel</Button>
                <Button className="bg-red-600 hover:bg-red-700 text-white" onClick={() => handleDelete(deleteTargetId)} disabled={deleting}>{deleting ? 'Deleting...' : 'Delete'}</Button>
              </div>
            </div>
          </div>
        )}
      </DashboardLayout>
    </ProtectedRoute>
  );
}