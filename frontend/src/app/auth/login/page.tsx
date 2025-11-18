'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import GuestOnly from '@/components/auth/GuestOnly';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function ParticipantLoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    phone: '',
    mykad: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/participant/auth/login`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            phone_number: formData.phone,
            mykad_id: formData.mykad,
          }),
        }
      );

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail?.[0]?.msg || 'Login failed');
      }

      const data = await response.json();

      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('user', JSON.stringify(data.user));

      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed to login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <GuestOnly>
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-emerald-50 to-white p-4">
        <div className="absolute top-0 left-0 right-0 h-32 bg-emerald-500" />

        <Card className="w-full max-w-md relative z-10 shadow-xl">
          <CardHeader className="space-y-4 text-center">
            <div className="mx-auto">
              <img
                src="/images/ROSE_LOGO.svg"
                alt="ROSE Foundation Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold">Welcome!</CardTitle>
              <CardDescription>Login to book your screening events</CardDescription>
            </div>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+60123456789"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required
                  className="h-12"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="mykad">MyKad ID</Label>
                <Input
                  id="mykad"
                  type="text"
                  placeholder="YYMMDD-PB-####"
                  value={formData.mykad}
                  onChange={(e) => setFormData({ ...formData, mykad: e.target.value })}
                  required
                  className="h-12"
                />
                <p className="text-xs text-gray-500">Format: 850101-01-1234</p>
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 bg-emerald-500 hover:bg-emerald-600 text-white font-medium"
              >
                {loading ? 'Logging in...' : 'Login'}
              </Button>

              <div className="text-center text-sm text-gray-600">
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => router.push('/auth/register')}
                  className="text-emerald-600 hover:text-emerald-700 font-medium hover:underline"
                >
                  Register now
                </button>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="absolute bottom-0 left-0 right-0 h-32 bg-emerald-500" />
      </div>
    </GuestOnly>
  );
}