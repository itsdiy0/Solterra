'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Toast from '@/components/ui/toast';
import { User, Phone, CreditCard, CheckCircle, XCircle, Calendar, ArrowLeft, Clock, Download } from 'lucide-react';

interface Participant {
  id: string;
  name: string;
  phone_number: string;
  mykad_id: string;
  booking_status: string;
  booked_at: string;
  booking_reference: string;
}

interface Event {
  id: string;
  name: string;
  event_date: string;
  event_time: string;
  address: string;
  total_slots: number;
  available_slots: number;
}

export default function EventParticipantsPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.id as string;

  const [event, setEvent] = useState<Event | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [checkingIn, setCheckingIn] = useState<Set<string>>(new Set());
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
    fetchEventParticipants();
  }, [eventId]);

  const fetchEventParticipants = async () => {
    const token = localStorage.getItem('access_token');
    
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/events/${eventId}/participants`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error('Failed to fetch participants');

      const data = await res.json();
      setEvent(data.event);
      setParticipants(data.participants);
    } catch (err: any) {
      console.error(err);
      setError('Failed to load participants');
      setToast({ 
        message: err.message || 'Failed to load participants', 
        type: 'error', 
        show: true 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async (participantId: string, participantName: string) => {
    setCheckingIn(prev => new Set(prev).add(participantId));

    try {
      const token = localStorage.getItem('access_token');
      
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/bookings/${participantId}/check-in`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || 'Failed to check in');
      }

      setToast({ 
        message: `${participantName} checked in successfully!`, 
        type: 'success', 
        show: true 
      });
      
      fetchEventParticipants(); // Refresh list
    } catch (err: any) {
      console.error('Check-in error:', err);
      setToast({ 
        message: err.message || 'Failed to check in participant', 
        type: 'error', 
        show: true 
      });
    } finally {
      setCheckingIn(prev => {
        const newSet = new Set(prev);
        newSet.delete(participantId);
        return newSet;
      });
    }
  };

  const handleExportCSV = async () => {
    const token = localStorage.getItem('access_token');
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/events/${eventId}/participants/export`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error('Failed to export CSV');

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `participants_${eventId}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      setToast({ 
        message: 'Export started successfully', 
        type: 'success', 
        show: true 
      });
    } catch (err: any) {
      console.error('Export error:', err);
      setToast({ 
        message: err.message || 'Failed to export CSV', 
        type: 'error', 
        show: true 
      });
    }
  };

  if (loading) {
    return (
      <ProtectedRoute requiredRole="admin">
        <DashboardLayout title="Event Participants">
          <p className="text-gray-500 text-center py-12">Loading participants...</p>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  if (error) {
    return (
      <ProtectedRoute requiredRole="admin">
        <DashboardLayout title="Event Participants">
          <p className="text-red-600 text-center py-12">{error}</p>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  if (!event) {
    return (
      <ProtectedRoute requiredRole="admin">
        <DashboardLayout title="Event Participants">
          <p className="text-gray-500 text-center py-12">Event not found</p>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  const bookedSlots = event.total_slots - event.available_slots;
  const checkedInCount = participants.filter(p => p.booking_status === 'checked_in').length;

  return (
    <ProtectedRoute requiredRole="admin">
      <DashboardLayout title="Event Participants">
        <Toast
          message={toast.message}
          type={toast.type}
          show={toast.show}
          onClose={() => setToast({ ...toast, show: false })}
        />

        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <Button
              variant="outline"
              onClick={() => router.push(`/admin/events/${eventId}`)}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Event
            </Button>
            <Button
              variant="outline"
              onClick={handleExportCSV}
              disabled={participants.length === 0}
              title={participants.length === 0 ? "No participants to export" : ""}
            >
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </div>

          {/* Event Info */}
          <Card className="mb-6">
            <CardContent>
              <h2 className="text-2xl font-bold mb-3">{event.name}</h2>
              <div className="flex items-center gap-6 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>
                    {new Date(event.event_date).toLocaleDateString()} at {event.event_time}
                  </span>
                </div>
                <div>
                  <span className="font-semibold">{bookedSlots}</span> / {event.total_slots} booked
                </div>
                <div>
                  <span className="font-semibold text-emerald-600">{checkedInCount}</span> checked in
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Participants List */}
          <h3 className="text-xl font-bold mb-4">Participants ({participants.length})</h3>

          {participants.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <p className="text-gray-500">No participants registered yet</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {participants.map((participant) => {
                const isCheckingIn = checkingIn.has(participant.id);
                const isCheckedIn = participant.booking_status === 'checked_in';
                const isCancelled = participant.booking_status === 'cancelled';

                return (
                  <Card key={participant.id} className={isCancelled ? 'opacity-50' : ''}>
                    <CardContent>
                      <div className="flex items-center gap-6">
                        
                        {/* Status Indicator */}
                        <div className="flex-shrink-0">
                          {isCheckedIn ? (
                            <div className="flex items-center gap-2 px-3 py-2 bg-emerald-100 text-emerald-700 rounded-lg border border-emerald-200">
                              <CheckCircle className="w-4 h-4" />
                              <span className="text-sm font-medium">Checked In</span>
                            </div>
                          ) : isCancelled ? (
                            <div className="flex items-center gap-2 px-3 py-2 bg-red-100 text-red-700 rounded-lg border border-red-200">
                              <XCircle className="w-4 h-4" />
                              <span className="text-sm font-medium">Cancelled</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 px-3 py-2 bg-amber-100 text-amber-700 rounded-lg border border-amber-200">
                              <Clock className="w-4 h-4" />
                              <span className="text-sm font-medium">Confirmed</span>
                            </div>
                          )}
                        </div>

                        {/* Booking Reference */}
                        <div className="flex-shrink-0 w-32">
                          <p className="text-xs text-gray-500 mb-1">Booking Ref</p>
                          <p className="font-mono font-semibold text-sm">
                            {participant.booking_reference}
                          </p>
                        </div>

                        {/* Participant Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4 text-gray-400" />
                              <span className="font-medium">{participant.name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Phone className="w-4 h-4 text-gray-400" />
                              <span className="text-sm text-gray-600">{participant.phone_number}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <CreditCard className="w-4 h-4 text-gray-400" />
                              <span className="text-sm text-gray-600 font-mono">{participant.mykad_id}</span>
                            </div>
                          </div>
                        </div>

                        {/* Booked Time */}
                        <div className="flex-shrink-0 w-36">
                          <p className="text-xs text-gray-500 mb-1">Booked On</p>
                          <p className="text-sm text-gray-700">
                            {new Date(participant.booked_at).toLocaleDateString()}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(participant.booked_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>

                        {/* Check-in Button */}
                        <div className="flex-shrink-0">
                          {!isCheckedIn && !isCancelled && (
                            <Button
                              onClick={() => handleCheckIn(participant.id, participant.name)}
                              disabled={isCheckingIn}
                              className="bg-emerald-500 hover:bg-emerald-600"
                              size="sm"
                            >
                              {isCheckingIn ? 'Checking in...' : 'Check In'}
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
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}