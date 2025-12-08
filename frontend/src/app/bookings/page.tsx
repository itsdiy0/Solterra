'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Toast from '@/components/ui/toast';
import MapView from '@/components/maps/MapView';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  CreditCard,
  QrCode,
  XCircle,
  CheckCircle,
  AlertCircle,
  X,
  Navigation
} from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';

interface Event {
  id: string;
  name: string;
  event_date: string;
  event_time: string;
  address: string;
  total_slots: number;
  available_slots: number;
  latitude?: number | null;
  longitude?: number | null;
}

interface Booking {
  id: string;
  booking_reference: string;
  booking_status: string;
  booked_at: string;
  cancelled_at: string | null;
  time_slot_start: string | null;
  time_slot_end: string | null;
  event: Event;
}

type FilterType = 'all' | 'upcoming' | 'past' | 'cancelled';

export default function MyBookingsPage() {
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelingIds, setCancelingIds] = useState<Set<string>>(new Set());
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [showQRModal, setShowQRModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showMapModal, setShowMapModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error';
    show: boolean;
  }>({
    message: '',
    type: 'success',
    show: false,
  });

  useEffect(() => {
    fetchBookings();
  }, []);

  useEffect(() => {
    filterBookings();
  }, [activeFilter, bookings]);

  const fetchBookings = async () => {
    const token = localStorage.getItem('access_token');
    
    if (!token) {
      router.push('/auth/participant/login');
      return;
    }

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/participant/bookings`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error('Failed to fetch bookings');

      const data: Booking[] = await res.json();
      setBookings(data);
      setFilteredBookings(data);
    } catch (err: any) {
      setToast({
        message: err.message || 'Failed to load bookings',
        type: 'error',
        show: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const filterBookings = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let filtered = [...bookings];

    switch (activeFilter) {
      case 'upcoming':
        filtered = filtered.filter(
          b => new Date(b.event.event_date) >= today && b.booking_status !== 'cancelled'
        );
        break;
      case 'past':
        filtered = filtered.filter(
          b => new Date(b.event.event_date) < today && b.booking_status !== 'cancelled'
        );
        break;
      case 'cancelled':
        filtered = filtered.filter(b => b.booking_status === 'cancelled');
        break;
      default:
        // 'all' - no filter
        break;
    }

    setFilteredBookings(filtered);
  };

  const handleCancelBooking = async (bookingId: string, bookingRef: string) => {
    setCancelingIds(prev => new Set(prev).add(bookingId));

    try {
      const token = localStorage.getItem('access_token');
      
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/participant/bookings/${bookingId}/cancel`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || 'Failed to cancel booking');
      }

      const data = await res.json();
      
      setToast({
        message: data.message || 'Booking cancelled successfully',
        type: 'success',
        show: true,
      });

      // Update local state
      setBookings(prev =>
        prev.map(b =>
          b.id === bookingId
            ? { ...b, booking_status: 'cancelled', cancelled_at: new Date().toISOString() }
            : b
        )
      );

      // Refresh bookings to get updated event slots
      setTimeout(() => fetchBookings(), 1000);
    } catch (err: any) {
      setToast({
        message: err.message || 'Failed to cancel booking',
        type: 'error',
        show: true,
      });
    } finally {
      setCancelingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(bookingId);
        return newSet;
      });
    }
  };

  const handleShowQR = (booking: Booking) => {
    setSelectedBooking(booking);
    setShowQRModal(true);
  };

  const handleShowMap = (event: Event) => {
    setSelectedEvent(event);
    setShowMapModal(true);
  };

  const getStatusConfig = (booking: Booking) => {
    const eventDate = new Date(booking.event.event_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (booking.booking_status === 'cancelled') {
      return {
        icon: XCircle,
        color: 'bg-red-100 text-red-700 border-red-200',
        text: 'Cancelled',
      };
    }

    if (booking.booking_status === 'checked_in') {
      return {
        icon: CheckCircle,
        color: 'bg-blue-100 text-blue-700 border-blue-200',
        text: 'Checked In',
      };
    }

    if (eventDate < today) {
      return {
        icon: CheckCircle,
        color: 'bg-gray-100 text-gray-700 border-gray-200',
        text: 'Completed',
      };
    }

    return {
      icon: CheckCircle,
      color: 'bg-emerald-100 text-emerald-700 border-emerald-200',
      text: 'Confirmed',
    };
  };

  if (loading) {
    return (
      <ProtectedRoute requiredRole="participant">
        <DashboardLayout title="My Bookings">
          <p className="text-gray-500 text-center py-12">Loading bookings...</p>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  const upcomingCount = bookings.filter(
    b => new Date(b.event.event_date) >= new Date() && b.booking_status !== 'cancelled'
  ).length;
  const pastCount = bookings.filter(
    b => new Date(b.event.event_date) < new Date() && b.booking_status !== 'cancelled'
  ).length;
  const cancelledCount = bookings.filter(b => b.booking_status === 'cancelled').length;

  return (
    <ProtectedRoute requiredRole="participant">
      <DashboardLayout title="My Bookings">
        <Toast
          message={toast.message}
          type={toast.type}
          show={toast.show}
          onClose={() => setToast({ ...toast, show: false })}
        />

        {/* QR Code Modal */}
        {showQRModal && selectedBooking && (
          <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            onClick={() => setShowQRModal(false)}
          >
            <Card className="max-w-sm" onClick={(e) => e.stopPropagation()}>
              <CardContent className="p-6 text-center">
                <h3 className="font-semibold text-lg mb-4">Check-in QR Code</h3>
                <div className="bg-white p-4 rounded-lg inline-block mb-4">
                  <QRCodeCanvas
                    value={JSON.stringify({
                      booking_id: selectedBooking.id,
                      booking_ref: selectedBooking.booking_reference,
                      event_id: selectedBooking.event.id,
                    })}
                    size={200}
                  />
                </div>
                <p className="text-sm text-gray-600 mb-2">{selectedBooking.booking_reference}</p>
                <p className="text-xs text-gray-500 mb-4">
                  Show this QR code at the event for check-in
                </p>
                <Button
                  onClick={() => setShowQRModal(false)}
                  variant="outline"
                  className="w-full"
                >
                  Close
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Map Modal */}
        {showMapModal && selectedEvent && selectedEvent.latitude && selectedEvent.longitude && (
          <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowMapModal(false)}
          >
            <Card className="max-w-2xl w-full" onClick={(e) => e.stopPropagation()}>
              <CardContent className="p-6">
                <div className="mb-4">
                  <h3 className="font-semibold text-lg flex items-center gap-2 mb-2">
                    <MapPin className="w-5 h-5 text-emerald-600" />
                    Event Location
                  </h3>
                  <p className="text-sm text-gray-600">{selectedEvent.name}</p>
                </div>

                <MapView 
                  lat={Number(selectedEvent.latitude)}
                  lng={Number(selectedEvent.longitude)} 
                  title={selectedEvent.name}
                  height="400px"
                />
                
                <div className="mt-4 space-y-3">
                  <div className="flex items-start gap-2 text-sm">
                    <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                    <p className="text-gray-700">{selectedEvent.address}</p>
                  </div>
                  
                  <Button
                    onClick={() => window.open(
                      `https://www.google.com/maps/dir/?api=1&destination=${selectedEvent.latitude},${selectedEvent.longitude}`, 
                      '_blank'
                    )}
                    className="w-full bg-emerald-600 hover:bg-emerald-700"
                  >
                    <Navigation className="w-4 h-4 mr-2" />
                    Get Directions
                  </Button>

                  <Button
                    onClick={() => setShowMapModal(false)}
                    variant="outline"
                    className="w-full"
                  >
                    Close
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-4">My Bookings</h2>

          {/* Filter Tabs */}
          <div className="flex gap-2 mb-4">
            <Button
              onClick={() => setActiveFilter('all')}
              variant={activeFilter === 'all' ? 'default' : 'outline'}
              className={activeFilter === 'all' ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
            >
              All ({bookings.length})
            </Button>
            <Button
              onClick={() => setActiveFilter('upcoming')}
              variant={activeFilter === 'upcoming' ? 'default' : 'outline'}
              className={activeFilter === 'upcoming' ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
            >
              Upcoming ({upcomingCount})
            </Button>
            <Button
              onClick={() => setActiveFilter('past')}
              variant={activeFilter === 'past' ? 'default' : 'outline'}
              className={activeFilter === 'past' ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
            >
              Past ({pastCount})
            </Button>
            <Button
              onClick={() => setActiveFilter('cancelled')}
              variant={activeFilter === 'cancelled' ? 'default' : 'outline'}
              className={activeFilter === 'cancelled' ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
            >
              Cancelled ({cancelledCount})
            </Button>
          </div>
        </div>

        {/* Bookings List */}
        {filteredBookings.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-gray-500 mb-4">
                {activeFilter === 'all' 
                  ? 'No bookings yet' 
                  : `No ${activeFilter} bookings`}
              </p>
              {activeFilter === 'all' && (
                <Button
                  onClick={() => router.push('/events')}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  Browse Events
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredBookings.map((booking) => {
              const statusConfig = getStatusConfig(booking);
              const StatusIcon = statusConfig.icon;
              const isCanceling = cancelingIds.has(booking.id);
              const isCancelled = booking.booking_status === 'cancelled';
              const eventDate = new Date(booking.event.event_date);
              const isPast = eventDate < new Date();
              const hasLocation = booking.event.latitude && booking.event.longitude;

              return (
                <Card key={booking.id} className={`hover:shadow-md transition-shadow ${isCancelled ? 'opacity-60' : ''}`}>
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

                      {/* Event Info */}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 mb-2 truncate">{booking.event.name}</p>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            <span>{new Date(booking.event.event_date).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>
                              {booking.time_slot_start && booking.time_slot_end
                                ? `${booking.time_slot_start.slice(0, 5)} - ${booking.time_slot_end.slice(0, 5)}`
                                : booking.event.event_time.slice(0, 5)}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            <span className="truncate">{booking.event.address}</span>
                          </div>
                        </div>
                      </div>

                      {/* Booked Date */}
                      <div className="flex-shrink-0 w-32">
                        <p className="text-xs text-gray-500 mb-1">Booked On</p>
                        <p className="text-sm text-gray-700">
                          {new Date(booking.booked_at).toLocaleDateString()}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(booking.booked_at).toLocaleTimeString([], { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex-shrink-0 flex gap-2">
                        {!isCancelled && !isPast && (
                          <>
                            <Button
                              onClick={() => handleShowQR(booking)}
                              variant="outline"
                              size="sm"
                              className="border-emerald-500 text-emerald-600 hover:bg-emerald-50"
                              title="View QR Code"
                            >
                              <QrCode className="w-4 h-4" />
                            </Button>
                            
                            {hasLocation && (
                              <Button
                                onClick={() => handleShowMap(booking.event)}
                                variant="outline"
                                size="sm"
                                className="border-emerald-500 text-emerald-600 hover:bg-emerald-50"
                                title="View Location"
                              >
                                <MapPin className="w-4 h-4" />
                              </Button>
                            )}
                          </>
                        )}
                        
                        {!isCancelled && !isPast && (
                          <Button
                            onClick={() => handleCancelBooking(booking.id, booking.booking_reference)}
                            disabled={isCanceling}
                            variant="outline"
                            size="sm"
                            className="text-red-600 border-red-300 hover:bg-red-50"
                          >
                            {isCanceling ? 'Cancelling...' : 'Cancel'}
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
    </ProtectedRoute>
  );
}