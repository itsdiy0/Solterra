'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';

export default function AdminRegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
  });
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!agreedToTerms) {
      setError('Please agree to Terms and Conditions');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // TODO: Connect to backend API
      console.log('Registration attempt:', formData);
      
      // Mock success
      setTimeout(() => {
        alert('Registration successful! (Mock)');
        router.push('/admin/login');
      }, 1000);
    } catch (err) {
      setError('Registration failed');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-emerald-50 to-white p-4">
      {/* Green header bar */}
      <div className="absolute top-0 left-0 right-0 h-32 bg-emerald-500" />
      
      <Card className="w-full max-w-md relative z-10 shadow-xl">
        <CardHeader className="space-y-2 text-center">
          <CardTitle className="text-2xl font-bold">Sign up</CardTitle>
          <CardDescription>Create a ROSE Admin account to get started</CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="Enter full name"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                required
                className="h-11"
              />
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">ROSE Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter ROSE email address"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                required
                className="h-11"
              />
            </div>

            {/* Telephone */}
            <div className="space-y-2">
              <Label htmlFor="phone">Telephone Number</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="Enter telephone number"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                required
                className="h-11"
              />
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Create a password"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                required
                className="h-11"
              />
            </div>

            {/* Terms Checkbox */}
            <div className="flex items-start space-x-2">
              <Checkbox
                id="terms"
                checked={agreedToTerms}
                onCheckedChange={(checked) => setAgreedToTerms(checked as boolean)}
              />
              <label
                htmlFor="terms"
                className="text-sm text-gray-600 leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                I've read and agree with the{' '}
                <button type="button" className="text-emerald-600 hover:underline">
                  Terms and Conditions
                </button>{' '}
                and the{' '}
                <button type="button" className="text-emerald-600 hover:underline">
                  Privacy Policy
                </button>
              </label>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* Create Button */}
            <Button
              type="submit"
              disabled={loading || !agreedToTerms}
              className="w-full h-11 bg-emerald-500 hover:bg-emerald-600 text-white font-medium"
            >
              {loading ? 'Creating account...' : 'Create'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Bottom green bar */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-emerald-500" />
    </div>
  );
}