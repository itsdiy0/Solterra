'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const CreateEventPage = () => {
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

      router.push('/events');
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
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && <p className="text-red-500">{error}</p>}
              
              <div>
                <Label htmlFor="name">Event Name</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="event_date">Date</Label>
                  <Input id="event_date" type="date" value={event_date} onChange={(e) => setEventDate(e.target.value)} required />
                </div>
                <div>
                  <Label htmlFor="event_time">Time</Label>
                  <Input id="event_time" type="time" value={event_time} onChange={(e) => setEventTime(e.target.value)} required />
                </div>
              </div>

              <div>
                <Label htmlFor="address">Address</Label>
                <Input id="address" value={address} onChange={(e) => setAddress(e.target.value)} required />
              </div>

              <div>
                <Label htmlFor="total_slots">Total Slots</Label>
                <Input id="total_slots" type="number" value={total_slots} onChange={(e) => setTotalSlots(e.target.value)} required />
              </div>

              <div>
                <Label htmlFor="additional_info">Additional Info</Label>
                <Input id="additional_info" value={additional_info} onChange={(e) => setAdditionalInfo(e.target.value)} />
              </div>

              <div>
                <Label htmlFor="status">Status</Label>
                <select id="status" value={status} onChange={(e) => setStatus(e.target.value)} className="w-full p-2 border rounded">
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </select>
              </div>

              <div className="flex justify-end gap-4">
                <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Creating...' : 'Create Event'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </DashboardLayout>
    </ProtectedRoute>
  );
};

export default CreateEventPage;
