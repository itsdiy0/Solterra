'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import MapPicker from '@/components/maps/MapPicker';
import Toast from '@/components/ui/toast';

export default function CreateEventPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [event_date, setEventDate] = useState('');
  const [event_time, setEventTime] = useState('');
  const [address, setAddress] = useState('');
  const [latitude, setLatitude] = useState<number>(3.139);
  const [longitude, setLongitude] = useState<number>(101.6869);
  const [total_slots, setTotalSlots] = useState('');
  const [additional_info, setAdditionalInfo] = useState('');
  const [status, setStatus] = useState('draft');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error';
    show: boolean;
  }>({
    message: '',
    type: 'success',
    show: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const token = localStorage.getItem('access_token');
    if (!token) {
      setToast({
        message: 'You must be logged in to create an event',
        type: 'error',
        show: true,
      });
      setIsSubmitting(false);
      return;
    }

    const eventData = {
      name,
      event_date,
      event_time: event_time ? `${event_time}:00` : '',
      address,
      total_slots: parseInt(total_slots, 10),
      additional_info,
      status,
      latitude, 
      longitude,
    };

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/events/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(eventData),
      });

      if (!res.ok) {
        const errData = await res.json();
        if (Array.isArray(errData.detail)) {
          throw new Error(errData.detail[0].msg);
        }
        throw new Error(errData.detail || 'Failed to create event');
      }

      setToast({
        message: 'Event created successfully!',
        type: 'success',
        show: true,
      });

      setTimeout(() => router.push('/admin/events'), 1500);
    } catch (err: any) {
      setToast({
        message: err.message || 'Failed to create event',
        type: 'error',
        show: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ProtectedRoute requiredRole="admin">
      <DashboardLayout title="Create Event">
        <Toast
          message={toast.message}
          type={toast.type}
          show={toast.show}
          onClose={() => setToast({ ...toast, show: false })}
        />

        <div className="max-w-5xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Create New Event</CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                Fill in the event details and select location on the map
              </p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                
                {/* Basic Info */}
                <div className="space-y-4 p-4 bg-gray-50 rounded-lg border">
                  <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <span className="flex items-center justify-center w-6 h-6 bg-emerald-500 text-white rounded-full text-xs">1</span>
                    Event Details
                  </h3>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2 space-y-2">
                      <Label htmlFor="name">Event Name *</Label>
                      <Input 
                        id="name" 
                        placeholder="e.g., Kampung Sentosa Hall Screening"
                        value={name} 
                        onChange={(e) => setName(e.target.value)} 
                        required 
                        className="h-11"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="event_date">Date *</Label>
                      <Input 
                        id="event_date" 
                        type="date" 
                        value={event_date} 
                        onChange={(e) => setEventDate(e.target.value)} 
                        required 
                        className="h-11"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="event_time">Time *</Label>
                      <Input 
                        id="event_time" 
                        type="time" 
                        value={event_time} 
                        onChange={(e) => setEventTime(e.target.value)} 
                        required 
                        className="h-11"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="total_slots">Total Slots *</Label>
                      <Input 
                        id="total_slots" 
                        type="number" 
                        min="1"
                        placeholder="e.g., 50"
                        value={total_slots} 
                        onChange={(e) => setTotalSlots(e.target.value)} 
                        required 
                        className="h-11"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="status">Status *</Label>
                      <Select value={status} onValueChange={setStatus}>
                        <SelectTrigger className="h-11">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="draft">Draft (Not Visible)</SelectItem>
                          <SelectItem value="published">Published (Visible to Participants)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="col-span-2 space-y-2">
                      <Label htmlFor="additional_info">Additional Information</Label>
                      <Textarea
                        id="additional_info"
                        placeholder="Any additional details participants should know..."
                        value={additional_info}
                        onChange={(e) => setAdditionalInfo(e.target.value)}
                        rows={3}
                        className="resize-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Location Selection */}
                <div className="space-y-4 p-4 bg-gray-50 rounded-lg border">
                  <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <span className="flex items-center justify-center w-6 h-6 bg-emerald-500 text-white rounded-full text-xs">2</span>
                    Event Location
                  </h3>

                  <MapPicker
                    address={address}
                    onAddressChange={setAddress}
                    onCoordinatesChange={(lat, lng) => {
                      setLatitude(lat);
                      setLongitude(lng);
                    }}
                    initialLat={latitude}
                    initialLng={longitude}
                  />
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push('/admin/events')}
                    className="flex-1 h-12 font-medium"
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                  >
                    {isSubmitting ? 'Creating...' : 'Create Event'}
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