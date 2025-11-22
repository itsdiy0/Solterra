'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, CheckCircle, User, Phone, CreditCard, Calendar, FileText } from 'lucide-react';
import Toast from '@/components/ui/toast';

interface Event {
  id: string;
  name: string;
  event_date: string;
  event_time: string;
}

interface Booking {
  id: string;
  booking_reference: string;
  booking_status: string;
  has_result: boolean;
  participant: {
    name: string;
    phone_number: string;
    mykad_id: string;
  };
  event: {
    id: string;
    name: string;
    event_date: string;
  };
}

export default function UploadResultPage() {
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
  
  const [selectedEvent, setSelectedEvent] = useState<string>('');
  const [selectedBooking, setSelectedBooking] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [resultCategory, setResultCategory] = useState<string>('');
  const [resultNotes, setResultNotes] = useState<string>('');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
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
    fetchEventsAndBookings();
  }, []);

  useEffect(() => {
    if (selectedEvent) {
      filterBookingsByEvent(selectedEvent);
      setSelectedBooking('');
      setSearchTerm('');
    } else {
      setFilteredBookings([]);
    }
  }, [selectedEvent]);

  useEffect(() => {
    if (selectedEvent) {
      filterBookingsBySearch(searchTerm);
    }
  }, [searchTerm]);

  const fetchEventsAndBookings = async () => {
    const token = localStorage.getItem('access_token');
    
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/bookings`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error('Failed to fetch bookings');

      const data = await res.json();
      
      const checkedIn = data.bookings?.filter(
        (b: any) => b.booking_status === 'checked_in'
      ) || [];
      
      setBookings(checkedIn);

      const uniqueEvents = Array.from(
        new Map(
          checkedIn.map((b: Booking) => [
            b.event.id,
            {
              id: b.event.id,
              name: b.event.name,
              event_date: b.event.event_date,
              event_time: (b.event as any).event_time || '00:00',
            }
          ])
        ).values()
      );
      
      setEvents(uniqueEvents);
    } catch (err: any) {
      console.error(err);
      setError('Failed to load data');
      setToast({
        message: err.message || 'Failed to load data',
        type: 'error',
        show: true,
      });
    }
  };

  const filterBookingsByEvent = (eventId: string) => {
    const filtered = bookings.filter(b => b.event.id === eventId);
    setFilteredBookings(filtered);
  };

  const filterBookingsBySearch = (term: string) => {
    if (!term) {
      filterBookingsByEvent(selectedEvent);
      return;
    }

    const searchLower = term.toLowerCase();
    const filtered = bookings.filter(
      b => 
        b.event.id === selectedEvent &&
        (b.participant.name.toLowerCase().includes(searchLower) ||
         b.participant.phone_number.includes(searchLower) ||
         b.participant.mykad_id.includes(searchLower) ||
         b.booking_reference.toLowerCase().includes(searchLower))
    );
    setFilteredBookings(filtered);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedBooking || !resultCategory || !file) {
      setError('Please fill all required fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('access_token');
      
      const formData = new FormData();
      formData.append('booking_id', selectedBooking);
      formData.append('result_category', resultCategory);
      if (resultNotes) formData.append('result_notes', resultNotes);
      formData.append('file', file);

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/results`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || 'Failed to upload result');
      }

      setToast({
        message: 'Result uploaded successfully!',
        type: 'success',
        show: true,
      });

      setTimeout(() => router.push('/admin/results'), 1500);
    } catch (err: any) {
      setError(err.message || 'Upload failed');
      setToast({
        message: err.message || 'Upload failed',
        type: 'error',
        show: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const selectedEventData = events.find(e => e.id === selectedEvent);
  const selectedBookingData = filteredBookings.find(b => b.id === selectedBooking);

  return (
    <ProtectedRoute requiredRole="admin">
      <DashboardLayout title="Upload Test Results">
        <Toast
          message={toast.message}
          type={toast.type}
          show={toast.show}
          onClose={() => setToast({ ...toast, show: false })}
        />

        <div className="max-w-5xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Upload Test Result</CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                Upload test results for checked-in participants
              </p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                
                {/* Step 1: Event & Participant Selection */}
                <div className="space-y-4 p-4 bg-gray-50 rounded-lg border">
                  <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <span className="flex items-center justify-center w-6 h-6 bg-emerald-500 text-white rounded-full text-xs">1</span>
                    Select Event & Participant
                  </h3>
                  
                  <div className="grid grid-cols-12 gap-4">
                    {/* Event Selection */}
                    <div className="col-span-5 space-y-2">
                      <Label htmlFor="event" className="text-xs font-medium text-gray-700">
                        Event *
                      </Label>
                      <Select value={selectedEvent} onValueChange={setSelectedEvent}>
                        <SelectTrigger className={`h-11 bg-white w-full ${selectedEvent ? 'p-7' : ''}`}>
                          <SelectValue placeholder="Choose event..." />
                        </SelectTrigger>
                        <SelectContent>
                          {events.length === 0 ? (
                            <div className="p-4 text-sm text-gray-500 text-center">
                              No events with checked-in participants
                            </div>
                          ) : (
                            events.map((event) => (
                              <SelectItem key={event.id} value={event.id}>
                                <div className="py-1">
                                  <div className="font-medium text-sm">{event.name}</div>
                                  <div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                                    <Calendar className="w-3 h-3" />
                                    {new Date(event.event_date).toLocaleDateString()} • {event.event_time}
                                  </div>
                                </div>
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      {selectedEventData && (
                        <p className="text-xs text-gray-500">
                          {filteredBookings.length} checked-in participant(s)
                        </p>
                      )}
                    </div>

                    {/* Participant Selection */}
                    <div className="col-span-7 space-y-2">
                      <Label htmlFor="participant" className="text-xs font-medium text-gray-700">
                        Participant *
                      </Label>
                      
                      {selectedEvent && (
                        <div className="relative mb-2">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <Input
                            type="text"
                            placeholder="Search by name, phone, MyKad..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9 h-9 text-sm bg-white"
                          />
                        </div>
                      )}

                      <Select 
                        value={selectedBooking} 
                        onValueChange={setSelectedBooking}
                        disabled={!selectedEvent}
                      >
                        <SelectTrigger className={`h-11 bg-white w-full ${selectedBooking ? 'py-7' : ''}`}>
                          <SelectValue placeholder={
                            !selectedEvent 
                              ? "Select event first..." 
                              : "Choose participant..."
                          } />
                        </SelectTrigger>
                        <SelectContent className="max-h-[350px]">
                          {filteredBookings.length === 0 ? (
                            <div className="p-4 text-sm text-gray-500 text-center">
                              {searchTerm 
                                ? 'No matching participants' 
                                : 'No checked-in participants'}
                            </div>
                          ) : (
                            filteredBookings.map((booking) => {
                              const hasResult = booking.has_result;
                              
                              return (
                                <SelectItem 
                                  key={booking.id} 
                                  value={booking.id}
                                  disabled={hasResult}
                                  className={hasResult ? 'opacity-60' : ''}
                                >
                                  <div className="py-1.5 w-full">
                                    <div className="flex items-center justify-between gap-2 mb-1">
                                      <span className="font-medium text-sm">
                                        {booking.participant.name}
                                      </span>
                                      {hasResult && (
                                        <span className="flex items-center gap-1 text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full whitespace-nowrap">
                                          <CheckCircle className="w-3 h-3" />
                                          Uploaded
                                        </span>
                                      )}
                                    </div>
                                    <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-gray-600">
                                      <span className="flex items-center gap-1">
                                        <Phone className="w-3 h-3" />
                                        {booking.participant.phone_number}
                                      </span>
                                      <span className="flex items-center gap-1">
                                        <CreditCard className="w-3 h-3" />
                                        {booking.participant.mykad_id}
                                      </span>
                                      <span className="text-xs text-gray-500 mt-0.5 font-mono">
                                        {booking.booking_reference}
                                      </span>
                                    </div>
                                  </div>
                                </SelectItem>
                              );
                            })
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Selected Participant Summary */}
                  {selectedBookingData && (
                    <div className="mt-4 p-3 bg-white border border-emerald-200 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle className="w-4 h-4 text-emerald-600" />
                        <span className="text-xs font-semibold text-emerald-700">Selected Participant</span>
                      </div>
                      <div className="grid grid-cols-4 gap-3 text-sm">
                        <div>
                          <p className="text-xs text-gray-500 mb-0.5">Name</p>
                          <p className="font-medium text-gray-900">{selectedBookingData.participant.name}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-0.5">Phone</p>
                          <p className="font-medium text-gray-900">{selectedBookingData.participant.phone_number}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-0.5">MyKad ID</p>
                          <p className="font-medium text-gray-900 font-mono text-xs">{selectedBookingData.participant.mykad_id}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-0.5">Booking Ref</p>
                          <p className="font-medium text-gray-900 font-mono text-xs">{selectedBookingData.booking_reference}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Step 2: Result Details */}
                <div className="space-y-4 p-4 bg-gray-50 rounded-lg border">
                  <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <span className="flex items-center justify-center w-6 h-6 bg-emerald-500 text-white rounded-full text-xs">2</span>
                    Result Details
                  </h3>

                  <div className="space-y-4">
                    {/* Result Category */}
                    <div className="space-y-2">
                      <Label htmlFor="category" className="text-xs font-medium text-gray-700">
                        Result Category *
                      </Label>
                      <Select value={resultCategory} onValueChange={setResultCategory}>
                        <SelectTrigger className={`h-11 bg-white ${resultCategory ? 'py-2' : ''}`}>
                          <SelectValue placeholder="Select result category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Normal">
                            <div className="flex items-center gap-2 py-1">
                              <div className="w-3 h-3 rounded-full bg-green-500"></div>
                              <span>Normal</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="Abnormal - follow up required">
                            <div className="flex items-center gap-2 py-1">
                              <div className="w-3 h-3 rounded-full bg-red-500"></div>
                              <span>Abnormal - Follow up Required</span>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Result Notes */}
                    <div className="space-y-2">
                      <Label htmlFor="notes" className="text-xs font-medium text-gray-700">
                        Result Notes <span className="text-gray-400 font-normal">(Optional)</span>
                      </Label>
                      <Textarea
                        id="notes"
                        placeholder="Enter any additional notes or observations..."
                        value={resultNotes}
                        onChange={(e) => setResultNotes(e.target.value)}
                        rows={3}
                        className="resize-none bg-white text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Step 3: File Upload */}
                <div className="space-y-4 p-4 bg-gray-50 rounded-lg border">
                  <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <span className="flex items-center justify-center w-6 h-6 bg-emerald-500 text-white rounded-full text-xs">3</span>
                    Upload PDF Document
                  </h3>

                  <div className="space-y-2">
                    <Label htmlFor="file" className="text-xs font-medium text-gray-700">
                      Result PDF File *
                    </Label>
                    <Input
                      id="file"
                      type="file"
                      accept=".pdf"
                      onChange={(e) => setFile(e.target.files?.[0] || null)}
                      required
                      className="h-11 bg-white cursor-pointer file:mr-4 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 file:cursor-pointer"
                    />
                    {file && (
                      <div className="flex items-center gap-3 p-3 bg-white border border-emerald-200 rounded-lg">
                        <div className="flex items-center justify-center w-10 h-10 bg-emerald-100 rounded-lg flex-shrink-0">
                          <FileText className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {file.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {(file.size / 1024).toFixed(2)} KB • PDF Document
                          </p>
                        </div>
                        <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push('/admin/results')}
                    className="flex-1 h-12 font-medium"
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={loading || !selectedBooking || !resultCategory || !file}
                    className="flex-1 h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Uploading...
                      </span>
                    ) : (
                      'Upload Result'
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}