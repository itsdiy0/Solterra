'use client';

import { useEffect, useState } from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface UserProfile {
  id: string;
  name: string;
  phone_number?: string;
  mykad_id?: string;
  phone_verified?: boolean;
  created_at: string;
  email?: string;
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem('access_token');
      if (!token) return;
      
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUserRole(payload.role);

        const endpoint = payload.role === 'admin' ? '/admin/profile' : '/participant/profile';
        
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${endpoint}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) throw new Error('Failed to fetch profile');

        const data: UserProfile = await res.json();
        setProfile(data);
      } catch (err: any) {
        setError(err.message || 'Error fetching profile');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  if (loading) {
    return (
      <ProtectedRoute>
        <DashboardLayout title="Profile">
          <p className="text-gray-500 text-center py-12">Loading profile...</p>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  if (error) {
    return (
      <ProtectedRoute>
        <DashboardLayout title="Profile">
          <p className="text-red-600 text-center py-12">{error}</p>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  if (!profile) {
    return (
      <ProtectedRoute>
        <DashboardLayout title="Profile">
          <p className="text-gray-500 text-center py-12">Profile not found.</p>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <DashboardLayout title="Profile">
        <Card className="max-w-3xl mx-auto">
          <CardContent className="p-6 space-y-4">
            <h2 className="text-2xl font-bold mb-4">{profile.name}</h2>

            <div className="space-y-2 text-gray-700">
              {userRole === 'admin' && (
                <p><span className="font-medium">Email:</span> {profile.email}</p>
              )}
              {userRole === 'participant' && (
                <>
                  <p><span className="font-medium">Phone Number:</span> {profile.phone_number}</p>
                  <p><span className="font-medium">MyKad ID:</span> {profile.mykad_id}</p>
                  <p>
                    <span className="font-medium">Phone Verified:</span> {profile.phone_verified ? 'Yes' : 'No'}
                  </p>
                </>
              )}
              <p>
                <span className="font-medium">Member Since:</span> {new Date(profile.created_at).toLocaleDateString()}
              </p>
            </div>

            {userRole === 'participant' && (
              <Button
                className="mt-4 bg-emerald-500 hover:bg-emerald-600"
                onClick={() => window.location.href = '/events'}
              >
                Browse Events
              </Button>
            )}
          </CardContent>
        </Card>
      </DashboardLayout>
    </ProtectedRoute>
  );
}