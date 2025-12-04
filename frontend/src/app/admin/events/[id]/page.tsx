'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, MapPin, Users, Edit, Save, X, Trash2 } from 'lucide-react';
import MapPicker from '@/components/maps/MapPicker';
import MapView from '@/components/maps/MapView';
import Toast from '@/components/ui/toast';

interface Event {
  id: string;
  name: string;
  event_date: string;
  event_time: string;
  address: string;
  total_slots: number;
  available_slots: number;
  additional_info: string | null;
  status: string;
  created_by: string;
  latitude: number | null;
  longitude: number | null;
}

export default function AdminEventDetailPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.id as string;

  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Edit form state
  const [editName, setEditName] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editTime, setEditTime] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editLatitude, setEditLatitude] = useState<number>(3.139);
  const [editLongitude, setEditLongitude] = useState<number>(101.6869);
  const [editTotalSlots, setEditTotalSlots] = useState('');
  const [editAdditionalInfo, setEditAdditionalInfo] = useState('');
  const [editStatus, setEditStatus] = useState('');

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
    fetchEvent();
  }, [eventId]);

  const fetchEvent = async () => {
    const token = localStorage.getItem('access_token');
    
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/events/${eventId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error('Failed to fetch event');

      const data = await res.json();
      setEvent(data);
      
      // Initialize edit form
      setEditName(data.name);
      setEditDate(data.event_date);
      setEditTime(data.event_time.slice(0, 5));
      setEditAddress(data.address);
      setEditLatitude(data.latitude || 3.139);
      setEditLongitude(data.longitude || 101.6869);
      setEditTotalSlots(data.total_slots.toString());
      setEditAdditionalInfo(data.additional_info || '');
      setEditStatus(data.status);
    } catch (err: any) {
      setToast({
        message: err.message || 'Failed to load event',
        type: 'error',
        show: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    if (event) {
      setEditName(event.name);
      setEditDate(event.event_date);
      setEditTime(event.event_time.slice(0, 5));
      setEditAddress(event.address);
      setEditLatitude(event.latitude || 3.139);
      setEditLongitude(event.longitude || 101.6869);
      setEditTotalSlots(event.total_slots.toString());
      setEditAdditionalInfo(event.additional_info || '');
      setEditStatus(event.status);
    }
    setIsEditing(false);
  };

  const handleSave = async () => {
    setIsSaving(true);

    const token = localStorage.getItem('access_token');

    const eventData = {
      name: editName,
      event_date: editDate,
      event_time: `${editTime}:00`,
      address: editAddress,
      total_slots: parseInt(editTotalSlots, 10),
      additional_info: editAdditionalInfo,
      status: editStatus,
    };

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/events/${eventId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(eventData),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || 'Failed to update event');
      }

      const updated = await res.json();
      setEvent(updated);
      setIsEditing(false);
      
      setToast({
        message: 'Event updated successfully!',
        type: 'success',
        show: true,
      });
    } catch (err: any) {
      setToast({
        message: err.message || 'Failed to update event',
        type: 'error',
        show: true,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
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

      setToast({
        message: 'Event deleted successfully!',
        type: 'success',
        show: true,
      });

      setTimeout(() => router.push('/admin/events'), 1500);
    } catch (err: any) {
      setToast({
        message: err.message || 'Failed to delete event',
        type: 'error',
        show: true,
      });
    }
  };

  if (loading) {
    return (
      <ProtectedRoute requiredRole="admin">
        <DashboardLayout title="Event Details">
          <p className="text-gray-500 text-center py-12">Loading event...</p>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  if (!event) {
    return (
      <ProtectedRoute requiredRole="admin">
        <DashboardLayout title="Event Details">
          <p className="text-gray-500 text-center py-12">Event not found</p>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  const bookedSlots = event.total_slots - event.available_slots;
  const bookedPercentage = (bookedSlots / event.total_slots) * 100;

  return (
    <ProtectedRoute requiredRole="admin">
      <DashboardLayout title="Event Details">
        <Toast
          message={toast.message}
          type={toast.type}
          show={toast.show}
          onClose={() => setToast({ ...toast, show: false })}
        />

        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="mb-6 flex justify-between items-start">
            <div>
              <Button
                variant="outline"
                onClick={() => router.push('/admin/events')}
                className="mb-4"
              >
                ← Back to Events
              </Button>
              <h2 className="text-2xl font-bold">Event Details</h2>
            </div>
            
            {!isEditing && (
              <div className="flex gap-2">
                <Button
                  onClick={() => router.push(`/admin/events/${eventId}/participants`)}
                  variant="outline"
                >
                  <Users className="w-4 h-4 mr-2" />
                  View Participants
                </Button>
                <Button
                  onClick={handleEdit}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Event
                </Button>
              </div>
            )}
          </div>

          {/* Event Details / Edit Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{isEditing ? 'Edit Event' : event.name}</span>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    event.status === 'published'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {event.status}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {!isEditing ? (
                // VIEW MODE
                <>
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <Label className="text-gray-500 text-sm">Event Name</Label>
                      <p className="text-lg font-medium mt-1">{event.name}</p>
                    </div>
                    <div>
                      <Label className="text-gray-500 text-sm">Status</Label>
                      <p className="text-lg font-medium mt-1 capitalize">{event.status}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <Label className="text-gray-500 text-sm">Date</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <Calendar className="w-4 h-4 text-gray-500" />
                        <p className="text-lg font-medium">
                          {new Date(event.event_date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div>
                      <Label className="text-gray-500 text-sm">Time</Label>
                      <p className="text-lg font-medium mt-1">{event.event_time}</p>
                    </div>
                  </div>

                  <div>
                    <Label className="text-gray-500 text-sm mb-2 block">Location</Label>
                    <div className="flex items-start gap-2 mb-3">
                      <MapPin className="w-4 h-4 text-gray-500 mt-1" />
                      <p className="text-lg font-medium">{event.address}</p>
                    </div>
                    
                    {event.latitude && event.longitude && (
                      <MapView 
                        lat={event.latitude} 
                        lng={event.longitude}
                        title={event.name}
                        height="300px"
                      />
                    )}
                  </div>

                  <div>
                    <Label className="text-gray-500 text-sm mb-2 block">Capacity</Label>
                    <div className="flex items-center gap-3 mb-2">
                      <Users className="w-5 h-5 text-gray-500" />
                      <span className="text-lg font-medium">
                        {bookedSlots} / {event.total_slots} slots booked
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className={`h-3 rounded-full transition-all ${
                          bookedPercentage >= 100
                            ? 'bg-red-500'
                            : bookedPercentage >= 80
                            ? 'bg-amber-500'
                            : 'bg-emerald-500'
                        }`}
                        style={{ width: `${Math.min(bookedPercentage, 100)}%` }}
                      />
                    </div>
                    <p className="text-sm text-gray-600 mt-2">
                      {event.available_slots} slots remaining
                    </p>
                  </div>

                  {event.additional_info && (
                    <div>
                      <Label className="text-gray-500 text-sm">Additional Information</Label>
                      <p className="text-gray-700 mt-1 bg-gray-50 p-4 rounded-lg">
                        {event.additional_info}
                      </p>
                    </div>
                  )}

                  <div className="pt-6 border-t">
                    <Button
                      onClick={handleDelete}
                      variant="outline"
                      className="text-red-600 hover:bg-red-50 border-red-200"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Event
                    </Button>
                  </div>
                </>
              ) : (
                // EDIT MODE
                <form className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="name">Event Name *</Label>
                    <Input
                      id="name"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      required
                      className="h-11"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="date">Date *</Label>
                      <Input
                        id="date"
                        type="date"
                        value={editDate}
                        onChange={(e) => setEditDate(e.target.value)}
                        required
                        className="h-11"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="time">Time *</Label>
                      <Input
                        id="time"
                        type="time"
                        value={editTime}
                        onChange={(e) => setEditTime(e.target.value)}
                        required
                        className="h-11"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Event Location *</Label>
                    <MapPicker
                      address={editAddress}
                      onAddressChange={setEditAddress}
                      onCoordinatesChange={(lat, lng) => {
                        setEditLatitude(lat);
                        setEditLongitude(lng);
                      }}
                      initialLat={Number(event.latitude || 3.139)}   
                      initialLng={Number(event.longitude || 101.6869)} 
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="total_slots">Total Slots *</Label>
                    <Input
                      id="total_slots"
                      type="number"
                      min={bookedSlots}
                      value={editTotalSlots}
                      onChange={(e) => setEditTotalSlots(e.target.value)}
                      required
                      className="h-11"
                    />
                    <p className="text-xs text-gray-500">
                      Minimum: {bookedSlots} (already booked slots)
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="additional_info">Additional Information</Label>
                    <Textarea
                      id="additional_info"
                      value={editAdditionalInfo}
                      onChange={(e) => setEditAdditionalInfo(e.target.value)}
                      rows={3}
                      className="resize-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="status">Status *</Label>
                    <Select value={editStatus} onValueChange={setEditStatus}>
                      <SelectTrigger className="h-11">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="published">Published</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleCancelEdit}
                      className="flex-1 h-12 font-medium"
                      disabled={isSaving}
                    >
                      <X className="w-4 h-4 mr-2" />
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      onClick={handleSave}
                      disabled={isSaving}
                      className="flex-1 h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                    >
                      {isSaving ? 'Saving...' : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          Save Changes
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}