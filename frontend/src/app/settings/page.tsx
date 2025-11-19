'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { User, Shield, FileText, LifeBuoy, Info } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface UserData {
  id: string;
  name: string;
  phone_number?: string;
  mykad_id?: string;
  phone_verified?: boolean;
  created_at: string;
  email?: string;
}

export default function SettingsPage() {
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUserRole(payload.role);
        fetchUser(token, payload.role);
      } catch (e) {
        console.error('Failed to decode token:', e);
        setLoading(false);
        router.push('/auth/login');
      }
    } else {
      router.push('/auth/login');
    }
  }, [router]);

  const fetchUser = async (token: string, role: string) => {
    const endpoint = role === 'admin' ? '/admin/profile' : '/participant/profile';
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${endpoint}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) throw new Error('Failed to fetch user profile');

      const data: UserData = await res.json();
      setUser(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    const logoutRedirect = userRole === 'admin' ? '/admin/login' : '/auth/login';
    window.location.href = logoutRedirect;
  };

  if (loading) {
    return (
        <DashboardLayout title="Settings">
          <p className="text-gray-500 text-center py-12">Loading user data...</p>
        </DashboardLayout>
    );
  }

  return (
      <DashboardLayout title="Settings">
        <div className="space-y-6 max-w-3xl mx-auto">

          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-2">Account</h2>
              <p className="text-gray-700">Name: {user?.name || 'Not provided'}</p>
              <p className="text-gray-700">Email: {user?.email || 'Not provided'}</p>
              {userRole === 'participant' && (
                <>
                  <p className="text-gray-700">Phone: {user?.phone_number || 'Not provided'}</p>
                  <p className="text-gray-700">MyKad ID: {user?.mykad_id || 'Not provided'}</p>
                  <p className="text-gray-700">
                    Phone Verified: {user?.phone_verified ? 'Yes' : 'No'}
                  </p>
                </>
              )}
              <p className="text-gray-700">
                Account Created: {new Date(user?.created_at || '').toLocaleDateString()}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 space-y-2">
              <h3 className="text-lg font-semibold mb-2">Account Settings</h3>
              <Button className="w-full text-left bg-gray-50 hover:bg-gray-100 flex items-center gap-2">
                <User className="w-4 h-4" /> Edit Profile
              </Button>
              <Button className="w-full text-left bg-gray-50 hover:bg-gray-100 flex items-center gap-2">
                <Shield className="w-4 h-4" /> Update Password
              </Button>
              <Button
                className="w-full text-left bg-gray-50 hover:bg-gray-100 flex items-center gap-2"
                onClick={() =>
                  window.open(
                    'https://www.programrose.org/wp-content/uploads/2024/11/ROSE-Privacy-Policy-202411-v1.1.pdf',
                    '_blank'
                  )
                }
              >
                <Shield className="w-4 h-4" /> Security & Privacy
              </Button>
              <Button
                className="w-full text-left bg-gray-50 hover:bg-gray-100 flex items-center gap-2"
                onClick={() =>
                  window.open(
                    'https://www.programrose.org/wp-content/uploads/2024/10/ROSE-Terms-of-Service-202409-v1.0.pdf',
                    '_blank'
                  )
                }
              >
                <FileText className="w-4 h-4" /> Terms of Service
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 space-y-2">
              <h3 className="text-lg font-semibold mb-2">Support</h3>
              <Button className="w-full text-left bg-gray-50 hover:bg-gray-100 flex items-center gap-2">
                <LifeBuoy className="w-4 h-4" /> Help & Support
              </Button>
              <Button className="w-full text-left bg-gray-50 hover:bg-gray-100 flex items-center gap-2">
                <Info className="w-4 h-4" /> About
              </Button>
            </CardContent>
          </Card>

          <div className="mt-8">
            <Button
              onClick={handleLogout}
              className="w-full bg-red-500 hover:bg-red-600 text-white"
            >
              Log Out
            </Button>
          </div>
        </div>
      </DashboardLayout>
  );
}