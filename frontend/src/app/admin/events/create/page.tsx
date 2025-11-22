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

export default function CreateEventPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [event_date, setEventDate] = useState('');
  const [event_time, setEventTime] = useState('');
  const [address, setAddress] = useState('');
  const [total_slots, setTotalSlots] = useState('');
  const [additional_info, setAdditionalInfo] = useState('');
  const [status, setStatus] = useState('draft');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const token = localStorage.getItem('access_token');
    if (!token) {
      setError('You must be logged in to create an event.');
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

      alert('Event created successfully!');
      router.push('/admin/events'); // ✅ Redirect to admin events list
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ProtectedRoute requiredRole="admin">
      <DashboardLayout title="Create Event">
        <Card className="w-full max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Create New Event</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="name">Event Name *</Label>
                <Input 
                  id="name" 
                  placeholder="e.g., Kampung Sentosa Hall Screening"
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  required 
                  className="h-12"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="event_date">Date *</Label>
                  <Input 
                    id="event_date" 
                    type="date" 
                    value={event_date} 
                    onChange={(e) => setEventDate(e.target.value)} 
                    required 
                    className="h-12"
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
                    className="h-12"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Address *</Label>
                <Input 
                  id="address"
                  placeholder="e.g., Dewan Kampung Sentosa, Jalan Sultan, KL"
                  value={address} 
                  onChange={(e) => setAddress(e.target.value)} 
                  required 
                  className="h-12"
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
                  className="h-12"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="additional_info">Additional Information</Label>
                <Textarea
                  id="additional_info"
                  placeholder="Any additional details participants should know..."
                  value={additional_info}
                  onChange={(e) => setAdditionalInfo(e.target.value)}
                  rows={4}
                  className="resize-none"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status *</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger className="h-12">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft (Not Visible)</SelectItem>
                    <SelectItem value="published">Published (Visible to Participants)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-3 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => router.push('/admin/events')}
                  className="flex-1 h-12"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="flex-1 h-12 bg-emerald-500 hover:bg-emerald-600"
                >
                  {isSubmitting ? 'Creating...' : 'Create Event'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </DashboardLayout>
    </ProtectedRoute>
  );
}