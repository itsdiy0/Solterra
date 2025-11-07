'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function ParticipantRegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<'registration' | 'otp'>('registration');
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    mykad: '',
    otp: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // TODO: Connect to backend API to register and send OTP
      console.log('Registration attempt:', {
        name: formData.name,
        phone: formData.phone,
        mykad: formData.mykad,
      });
      
      // Mock: Move to OTP verification
      setTimeout(() => {
        setStep('otp');
        setLoading(false);
      }, 1000);
    } catch (err) {
      setError('Registration failed');
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
        alert('Registration successful! (Mock)');
        router.push('/events');
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
            <CardTitle className="text-2xl font-bold">
              {step === 'registration' ? 'Create Account' : 'Verify Your Phone'}
            </CardTitle>
            <CardDescription>
              {step === 'registration' 
                ? 'Register to book free screening events' 
                : 'Enter the code sent to your phone'}
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent>
          {step === 'registration' ? (
            // Step 1: Registration Form
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Enter your full name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                  className="h-12"
                />
              </div>

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
                <p className="text-xs text-gray-500">Format: +60XXXXXXXXX or 01XXXXXXXX</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="mykad">MyKad ID Number</Label>
                <Input
                  id="mykad"
                  type="text"
                  placeholder="YYMMDD-PB-####"
                  value={formData.mykad}
                  onChange={(e) => setFormData({...formData, mykad: e.target.value})}
                  required
                  className="h-12"
                />
                <p className="text-xs text-gray-500">Example: 850101-01-1234</p>
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
                {loading ? 'Sending code...' : 'Register'}
              </Button>

              <div className="text-center text-sm text-gray-600">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => router.push('/auth/login')}
                  className="text-emerald-600 hover:text-emerald-700 font-medium hover:underline"
                >
                  Login here
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
                  placeholder="000000"
                  value={formData.otp}
                  onChange={(e) => setFormData({...formData, otp: e.target.value})}
                  maxLength={6}
                  required
                  className="h-12 text-center text-2xl tracking-widest font-mono"
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
                {loading ? 'Verifying...' : 'Verify & Continue'}
              </Button>

              <div className="flex justify-between text-sm">
                <button
                  type="button"
                  onClick={() => setStep('registration')}
                  className="text-emerald-600 hover:text-emerald-700 hover:underline"
                >
                  ← Change details
                </button>
                <button
                  type="button"
                  onClick={handleRegister}
                  className="text-gray-600 hover:text-gray-800 hover:underline"
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