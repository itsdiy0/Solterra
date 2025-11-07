'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // TODO: Connect to backend API
      console.log('Login attempt:', { email, password });
      
      // Mock success for now
      setTimeout(() => {
        alert('Login successful! (Mock)');
        setLoading(false);
      }, 1000);
    } catch (err) {
      setError('Invalid credentials');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-emerald-50 to-white p-4">
      {/* Green header bar (matching design) */}
      <div className="absolute top-0 left-0 right-0 h-32 bg-emerald-500" />
      
      <Card className="w-full max-w-md relative z-10 shadow-xl">
        <CardHeader className="space-y-4 text-center">
          {/* ROSE Logo */}
          <div className="mx-auto w-24 h-24 bg-emerald-500 rounded-full flex items-center justify-center">
            <div className="text-white text-2xl font-bold">ROSE</div>
          </div>
          
          <div>
            <CardTitle className="text-2xl font-bold">Welcome Admin!</CardTitle>
            <CardDescription>Sign in to your admin account</CardDescription>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Input */}
            <div className="space-y-2">
              <Label htmlFor="email">ROSE Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@rose.org"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-12"
              />
            </div>

            {/* Password Input */}
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-12"
              />
            </div>

            {/* Forgot Password Link */}
            <div className="text-right">
              <button
                type="button"
                className="text-sm text-emerald-600 hover:text-emerald-700 hover:underline"
                onClick={() => alert('Forgot password feature coming soon')}
              >
                Forgot password?
              </button>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* Login Button */}
            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-emerald-500 hover:bg-emerald-600 text-white font-medium"
            >
              {loading ? 'Signing in...' : 'Login'}
            </Button>

            {/* Register Link */}
            <div className="text-center text-sm text-gray-600">
              Don't have an admin account?{' '}
              <button
                type="button"
                onClick={() => router.push('/admin/register')}
                className="text-emerald-600 hover:text-emerald-700 font-medium hover:underline"
              >
                Register now
              </button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Bottom green bar (matching design) */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-emerald-500" />
    </div>
  );
}