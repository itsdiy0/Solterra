'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function ParticipantLoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<'credentials' | 'otp'>('credentials');
  const [formData, setFormData] = useState({
    phone: '',
    mykad: '',
    otp: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // TODO: Connect to backend API to send OTP
      console.log('Sending OTP to:', formData.phone);
      
      // Mock: Move to OTP step
      setTimeout(() => {
        setStep('otp');
        setLoading(false);
      }, 1000);
    } catch (err) {
      setError('Failed to send OTP');
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // TODO: Connect to backend API to verify OTP
      console.log('Verifying OTP:', formData.otp);
      
      // Mock success
      setTimeout(() => {
        alert('Login successful! (Mock)');
        setLoading(false);
      }, 1000);
    } catch (err) {
      setError('Invalid OTP code');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-emerald-50 to-white p-4">
      {/* Green header bar */}
      <div className="absolute top-0 left-0 right-0 h-32 bg-emerald-500" />
      
      <Card className="w-full max-w-md relative z-10 shadow-xl">
        <CardHeader className="space-y-4 text-center">
          {/* ROSE Logo */}
          <div className="mx-auto w-24 h-24 bg-emerald-500 rounded-full flex items-center justify-center">
            <div className="text-white text-2xl font-bold">ROSE</div>
          </div>
          
          <div>
            <CardTitle className="text-2xl font-bold">Welcome!</CardTitle>
            <CardDescription>
              {step === 'credentials' 
                ? 'Login to book screening events' 
                : 'Enter the code sent to your phone'}
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent>
          {step === 'credentials' ? (
            // Step 1: Phone + MyKad
            <form onSubmit={handleSendOTP} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+60123456789"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
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
                  onChange={(e) => setFormData({...formData, mykad: e.target.value})}
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
                {loading ? 'Sending code...' : 'Send Verification Code'}
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
          ) : (
            // Step 2: OTP Verification
            <form onSubmit={handleVerifyOTP} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="otp">Verification Code</Label>
                <Input
                  id="otp"
                  type="text"
                  placeholder="Enter 6-digit code"
                  value={formData.otp}
                  onChange={(e) => setFormData({...formData, otp: e.target.value})}
                  maxLength={6}
                  required
                  className="h-12 text-center text-2xl tracking-widest"
                />
                <p className="text-xs text-gray-500 text-center">
                  Code sent to {formData.phone}
                </p>
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
                {loading ? 'Verifying...' : 'Verify & Login'}
              </Button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setStep('credentials')}
                  className="text-sm text-emerald-600 hover:text-emerald-700 hover:underline"
                >
                  ← Back to login
                </button>
              </div>

              <div className="text-center">
                <button
                  type="button"
                  onClick={handleSendOTP}
                  className="text-sm text-gray-600 hover:text-gray-800 hover:underline"
                >
                  Resend code
                </button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>

      {/* Bottom green bar */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-emerald-500" />
    </div>
  );
}