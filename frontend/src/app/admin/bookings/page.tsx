'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar, MapPin, User, Phone, CreditCard, CheckCircle, XCircle, Clock, ArrowRight } from 'lucide-react';

interface Booking {
  id: string;
  booking_reference: string;
  booking_status: string;
  booked_at: string;
  cancelled_at: string | null;
  participant: {
    id: string;
    name: string;
    phone_number: string;
    mykad_id: string;
  };
  event: {
    id: string;
    name: string;
    event_date: string;
    event_time: string;
    address: string;
  };
}

export default function AdminBookingsPage() {
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchBookings();
  }, []);

  useEffect(() => {
    filterBookings();
  }, [searchTerm, statusFilter, bookings]);

  const fetchBookings = async () => {
    const token = localStorage.getItem('access_token');
    
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/bookings`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error('Failed to fetch bookings');

      const data = await res.json();
      setBookings(data.bookings || []);
      setFilteredBookings(data.bookings || []);
    } catch (err) {
      console.error(err);
      setError('Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  const filterBookings = () => {
    let filtered = [...bookings];

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(b => b.booking_status === statusFilter);
    }

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(b => 
        b.participant.name.toLowerCase().includes(term) ||
        b.participant.phone_number.includes(term) ||
        b.booking_reference.toLowerCase().includes(term) ||
        b.event.name.toLowerCase().includes(term)
      );
    }

    setFilteredBookings(filtered);
  };

  const getStatusConfig = (status: string) => {
    const configs = {
      confirmed: { 
        icon: CheckCircle, 
        color: 'bg-green-100 text-green-700 border-green-200',
        text: 'Confirmed'
      },
      checked_in: { 
        icon: CheckCircle, 
        color: 'bg-blue-100 text-blue-700 border-blue-200',
        text: 'Checked In'
      },
      cancelled: { 
        icon: XCircle, 
        color: 'bg-red-100 text-red-700 border-red-200',
        text: 'Cancelled'
      },
      completed: { 
        icon: CheckCircle, 
        color: 'bg-emerald-100 text-emerald-700 border-emerald-200',
        text: 'Completed'
      },
    };

    return configs[status as keyof typeof configs] || {
      icon: Clock,
      color: 'bg-gray-100 text-gray-700 border-gray-200',
      text: status
    };
  };

  if (loading) {
    return (
      <ProtectedRoute requiredRole="admin">
        <DashboardLayout title="Bookings">
          <p className="text-gray-500 text-center py-12">Loading bookings...</p>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  if (error) {
    return (
      <ProtectedRoute requiredRole="admin">
        <DashboardLayout title="Bookings">
          <p className="text-red-600 text-center py-12">{error}</p>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requiredRole="admin">
      <DashboardLayout title="Bookings">
        {/* Header & Stats */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-6">Bookings Management</h2>

          {/* Stats Cards */}
          <div className="grid grid-cols-4 gap-3 mb-6">
            <Card>
              <CardContent className="p-2 text-center">
                <p className="text-sm text-gray-600 mb-1">Total Bookings</p>
                <p className="text-3xl font-bold">{bookings.length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-2 text-center">
                <p className="text-sm text-gray-600 mb-1">Confirmed</p>
                <p className="text-3xl font-bold">
                  {bookings.filter(b => b.booking_status === 'confirmed').length}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-2 text-center">
                <p className="text-sm text-gray-600 mb-1">Checked In</p>
                <p className="text-3xl font-bold">
                  {bookings.filter(b => b.booking_status === 'checked_in').length}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-2 text-center">
                <p className="text-sm text-gray-600 mb-1">Cancelled</p>
                <p className="text-3xl font-bold">
                  {bookings.filter(b => b.booking_status === 'cancelled').length}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <div className="flex gap-4">
            <Input
              placeholder="Search by name, phone, booking ref, or event..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 h-11"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 border rounded-md h-11 bg-white min-w-[180px]"
            >
              <option value="all">All Statuses</option>
              <option value="confirmed">Confirmed</option>
              <option value="checked_in">Checked In</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {/* Bookings List */}
        {filteredBookings.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-gray-500">No bookings found</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredBookings.map((booking) => {
              const statusConfig = getStatusConfig(booking.booking_status);
              const StatusIcon = statusConfig.icon;

              return (
                <Card key={booking.id} className="hover:shadow-md transition-shadow">
                  <CardContent>
                    <div className="flex items-center gap-6">
                      
                      {/* Status Badge */}
                      <div className="flex-shrink-0">
                        <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${statusConfig.color}`}>
                          <StatusIcon className="w-4 h-4" />
                          <span className="text-sm font-medium whitespace-nowrap">
                            {statusConfig.text}
                          </span>
                        </div>
                      </div>

                      {/* Booking Reference */}
                      <div className="flex-shrink-0 w-32">
                        <p className="text-xs text-gray-500 mb-1">Booking Ref</p>
                        <p className="font-mono font-semibold text-sm">
                          {booking.booking_reference}
                        </p>
                      </div>

                      {/* Participant Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-500 mb-1">Participant</p>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2 min-w-0">
                            <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            <span className="font-medium truncate">{booking.participant.name}</span>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <Phone className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-600">{booking.participant.phone_number}</span>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <CreditCard className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-600 font-mono">{booking.participant.mykad_id}</span>
                          </div>
                        </div>
                      </div>

                      {/* Event Info */}
                      <div className="flex-1 min-w-0 border-l pl-6">
                        <p className="text-xs text-gray-500 mb-1">Event</p>
                        <p className="font-medium text-sm truncate mb-1">{booking.event.name}</p>
                        <div className="flex items-center gap-3 text-xs text-gray-600">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            <span>{new Date(booking.event.event_date).toLocaleDateString()}</span>
                          </div>
                          <span>•</span>
                          <span>{booking.event.event_time}</span>
                        </div>
                      </div>

                      {/* Booking Date */}
                      <div className="flex-shrink-0 w-36">
                        <p className="text-xs text-gray-500 mb-1">Booked On</p>
                        <p className="text-sm text-gray-700">
                          {new Date(booking.booked_at).toLocaleDateString()}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(booking.booked_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>

                      {/* Action Button */}
                      <div className="flex-shrink-0">
                        <Button
                          onClick={() => router.push(`/admin/events/${booking.event.id}`)}
                          variant="outline"
                          size="sm"
                          className="h-9"
                        >
                          View Event
                          <ArrowRight className="w-3 h-3 ml-2" />
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