'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Toast from '@/components/ui/toast';
import { FileText, Send, CheckCircle, Clock, Search, User, Shield, Calendar, ExternalLink } from 'lucide-react';

interface Participant {
  id: string;
  name: string;
  mykad_id: string;
  phone_number: string;
}

interface Event {
  id: string;
  name: string;
  event_code: string;
  event_date: string;
}

interface Booking {
  id: string;
  booking_reference: string;
  participant: Participant;
  event: Event;
}

interface Result {
  id: string;
  booking_id: string;
  result_category: string;
  result_notes: string | null;
  uploaded_at: string;
  sms_sent: boolean;
  sms_sent_at: string | null;
  result_file_url: string | null;
  booking: Booking;
}

export default function AdminResultsPage() {
  const router = useRouter();
  const [results, setResults] = useState<Result[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [sendingIds, setSendingIds] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEventId, setSelectedEventId] = useState<string>('all');
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
    fetchResults();
    fetchEvents();
  }, []);

  const fetchResults = async () => {
    const token = localStorage.getItem('access_token');
    
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/results`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error('Failed to fetch results');

      const data = await res.json();
      setResults(data.results || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

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
      setEvents(data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendSMS = async (resultId: string) => {
    setSendingIds(prev => new Set(prev).add(resultId));

    try {
      const token = localStorage.getItem('access_token');
      
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/results/${resultId}/send-sms`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || 'Failed to send SMS');
      }

      const data = await res.json();
      setToast({
        message: data.message || 'SMS sent successfully!',
        type: 'success',
        show: true,
      });

      setResults(prev => prev.map(r => 
        r.id === resultId 
          ? { ...r, sms_sent: true, sms_sent_at: new Date().toISOString() }
          : r
      ));
    } catch (err: any) {
      setToast({
        message: err.message || 'Failed to send SMS',
        type: 'error',
        show: true,
      });
    } finally {
      setSendingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(resultId);
        return newSet;
      });
    }
  };

  const filteredResults = results.filter((result) => {
    // Safe checks for optional nested properties
    const participantName = result.booking?.participant?.name?.toLowerCase() || '';
    const participantMyKad = result.booking?.participant?.mykad_id?.toLowerCase() || '';
    const bookingRef = result.booking?.booking_reference?.toLowerCase() || '';
    const category = result.result_category?.toLowerCase() || '';
    const search = searchTerm.toLowerCase();

    const matchesSearch = 
      participantName.includes(search) ||
      participantMyKad.includes(search) ||
      bookingRef.includes(search) ||
      category.includes(search);

    const matchesEvent = 
      selectedEventId === 'all' || result.booking?.event?.id === selectedEventId;

    return matchesSearch && matchesEvent;
  });

  if (loading) {
    return (
      <ProtectedRoute requiredRole="admin">
        <DashboardLayout title="Test Results">
          <p className="text-gray-500 text-center py-12">Loading results...</p>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requiredRole="admin">
      <DashboardLayout title="Test Results">
        <Toast
          message={toast.message}
          type={toast.type}
          show={toast.show}
          onClose={() => setToast({ ...toast, show: false })}
        />

        <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h2 className="text-2xl font-bold">Uploaded Test Results</h2>
          <Button
            onClick={() => router.push('/admin/results/upload')}
            className="bg-emerald-600 hover:bg-emerald-700 w-full sm:w-auto text-white"
          >
            <FileText className="w-4 h-4 mr-2" />
            Upload New Result
          </Button>
        </div>

        {/* Search and Filter */}
        <div className="grid grid-cols-1 md:grid-cols-[70%_30%] gap-2 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
            <Input
              type="text"
              placeholder="Search by name, MyKad ID, booking ref, or result..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-12"
            />
          </div>

          <select
            value={selectedEventId}
            onChange={(e) => setSelectedEventId(e.target.value)}
            className="h-12 px-4 rounded-lg border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            style={{ marginRight: '8px' }}
          >
            <option value="all">All Events</option>
            {events.map((event) => (
              <option key={event.id} value={event.id}>
                {event.name} ({event.event_code})
              </option>
            ))}
          </select>
        </div>

        {results.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <FileText className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-500 mb-4">No results uploaded yet</p>
              <Button
                onClick={() => router.push('/admin/results/upload')}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                Upload First Result
              </Button>
            </CardContent>
          </Card>
        ) : filteredResults.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-gray-500">No results found matching your search</p>
            </CardContent>
          </Card>
        ) : (
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            {/* Table Header */}
            <div className="hidden md:grid md:grid-cols-12 gap-4 p-4 bg-gray-50 border-b font-medium text-sm text-gray-700">
              <div className="col-span-2">Participant</div>
              <div className="col-span-2">MyKad ID</div>
              <div className="col-span-2">Event</div>
              <div className="col-span-1">Result</div>
              <div className="col-span-2">Uploaded</div>
              <div className="col-span-1">SMS</div>
              <div className="col-span-2">Actions</div>
            </div>

            {/* Table Rows */}
            <div className="divide-y">
              {filteredResults.map((result) => {
                const isSending = sendingIds.has(result.id);
                
                return (
                  <div
                    key={result.id}
                    className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 p-4 hover:bg-gray-50 transition-colors"
                  >
                    {/* Participant Name */}
                    <div className="md:col-span-2">
                      <p className="text-xs text-gray-500 md:hidden">Participant</p>
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <span className="font-medium text-gray-900 break-words">
                          {result.booking?.participant?.name || 'N/A'}
                        </span>
                      </div>
                    </div>

                    {/* MyKad ID */}
                    <div className="md:col-span-2">
                      <p className="text-xs text-gray-500 md:hidden">MyKad ID</p>
                      <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <span className="font-mono text-sm text-gray-900">
                          {result.booking?.participant?.mykad_id || 'N/A'}
                        </span>
                      </div>
                    </div>

                    {/* Event */}
                    <div className="md:col-span-2">
                      <p className="text-xs text-gray-500 md:hidden">Event</p>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-gray-900 break-words">
                            {result.booking?.event?.name || 'N/A'}
                          </p>
                          <p className="text-xs text-gray-500">{result.booking?.event?.event_code || ''}</p>
                        </div>
                      </div>
                    </div>

                    {/* Result Category */}
                    <div className="md:col-span-1">
                      <p className="text-xs text-gray-500 md:hidden">Result</p>
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                          result.result_category === 'Normal'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {result.result_category === 'Normal' ? 'Normal' : 'Abnormal'}
                      </span>
                    </div>

                    {/* Uploaded Date */}
                    <div className="md:col-span-2">
                      <p className="text-xs text-gray-500 md:hidden">Uploaded</p>
                      <p className="text-sm text-gray-900">
                        {new Date(result.uploaded_at).toLocaleDateString('en-US', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(result.uploaded_at).toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>

                    {/* SMS Status */}
                    <div className="md:col-span-1">
                      <p className="text-xs text-gray-500 md:hidden">SMS Status</p>
                      {result.sms_sent ? (
                        <div className="flex items-center gap-1 text-emerald-600">
                          <CheckCircle className="w-4 h-4 flex-shrink-0" />
                          <span className="text-xs font-medium">Sent</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-amber-600">
                          <Clock className="w-4 h-4 flex-shrink-0" />
                          <span className="text-xs font-medium">Pending</span>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="md:col-span-2 flex items-center gap-2">
                      {result.result_file_url && (
                        <Button
                          onClick={() => window.open(result.result_file_url!, '_blank')}
                          size="sm"
                          variant="outline"
                          className="border-blue-500 text-blue-600 hover:bg-blue-50"
                        >
                          <ExternalLink className="w-4 h-4 md:mr-0 sm:mr-2" />
                          <span className="hidden sm:inline">View</span>
                        </Button>
                      )}
                      {!result.sms_sent && (
                        <Button
                          onClick={() => handleSendSMS(result.id)}
                          disabled={isSending}
                          size="sm"
                          className="bg-emerald-600 hover:bg-emerald-700"
                        >
                          {isSending ? (
                            <Clock className="w-4 h-4 animate-spin" />
                          ) : (
                            <>
                              <Send className="text-white w-4 h-4 md:mr-0 sm:mr-2" />
                              <span className="text-white hidden sm:inline">Send SMS</span>
                            </>
                          )}
                        </Button>
                      )}
                    </div>

                    {/* Notes (if any) - Full Width */}
                    {result.result_notes && (
                      <div className="md:col-span-12 mt-2 pt-2 border-t border-gray-100">
                        <p className="text-xs text-gray-500 mb-1">Notes:</p>
                        <p className="text-sm text-gray-700 italic">{result.result_notes}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </DashboardLayout>
    </ProtectedRoute>
  );
}