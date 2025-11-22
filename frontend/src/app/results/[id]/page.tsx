'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FileText, Download, ArrowLeft } from 'lucide-react';

interface ResultDetail {
  result_category: string;
  result_notes: string | null;
  result_file_url: string | null;
  event_name: string;
  event_date: string;
}

export default function ViewResultPage() {
  const params = useParams();
  const router = useRouter();
  const resultId = params.id as string;

  const [step, setStep] = useState<'request-otp' | 'view-result'>('request-otp');
  const [otp, setOtp] = useState('');
  const [result, setResult] = useState<ResultDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');

  const handleRequestOTP = async () => {
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('access_token');
      
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/participant/results/${resultId}/request-otp`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || 'Failed to send OTP');
      }

      const data = await res.json();
      setPhoneNumber(data.phone_number);
      setStep('view-result');
    } catch (err: any) {
      setError(err.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('access_token');
      
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/participant/results/${resultId}/view`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ otp_code: otp }),
        }
      );

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || 'Invalid OTP');
      }

      const data: ResultDetail = await res.json();
      setResult(data);
    } catch (err: any) {
      setError(err.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute requiredRole="participant">
      <DashboardLayout title="View Result">
        <Button
          variant="outline"
          onClick={() => router.push('/results')}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Results
        </Button>

        {!result ? (
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle>
                {step === 'request-otp' ? 'Verify Your Identity' : 'Enter Verification Code'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {step === 'request-otp' ? (
                <div className="space-y-4">
                  <p className="text-gray-600">
                    For security purposes, we need to verify your identity before showing your medical results.
                  </p>
                  <p className="text-sm text-gray-500">
                    A verification code will be sent to your registered phone number via SMS.
                  </p>

                  {error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                      <p className="text-sm text-red-600">{error}</p>
                    </div>
                  )}

                  <Button
                    onClick={handleRequestOTP}
                    disabled={loading}
                    className="w-full h-12 bg-emerald-500 hover:bg-emerald-600"
                  >
                    {loading ? 'Sending code...' : 'Send Verification Code'}
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleVerifyOTP} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="otp">Verification Code</Label>
                    <Input
                      id="otp"
                      type="text"
                      placeholder="000000"
                      value={otp}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '');
                        setOtp(value);
                      }}
                      maxLength={6}
                      required
                      autoFocus
                      className="h-12 text-center text-2xl tracking-widest font-mono"
                    />
                    <p className="text-xs text-gray-500 text-center">
                      Code sent to {phoneNumber}
                    </p>
                  </div>

                  {error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                      <p className="text-sm text-red-600">{error}</p>
                    </div>
                  )}

                  <Button
                    type="submit"
                    disabled={loading || otp.length !== 6}
                    className="w-full h-12 bg-emerald-500 hover:bg-emerald-600"
                  >
                    {loading ? 'Verifying...' : 'View Result'}
                  </Button>

                  <div className="text-center">
                    <button
                      type="button"
                      onClick={handleRequestOTP}
                      className="text-sm text-gray-600 hover:text-gray-800 hover:underline"
                      disabled={loading}
                    >
                      Resend code
                    </button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card className="max-w-3xl mx-auto">
            <CardHeader>
              <CardTitle>Test Result Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              
              {/* Event Info */}
              <div>
                <h3 className="font-semibold mb-2">Screening Event</h3>
                <p className="text-gray-700">{result.event_name}</p>
                <p className="text-sm text-gray-500">
                  Date: {new Date(result.event_date).toLocaleDateString()}
                </p>
              </div>

              {/* Result Status */}
              <div>
                <h3 className="font-semibold mb-2">Result</h3>
                <span
                  className={`inline-block px-4 py-2 rounded-lg text-lg font-medium ${
                    result.result_category === 'Normal'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-700'
                  }`}
                >
                  {result.result_category}
                </span>
              </div>

              {/* Result Notes */}
              {result.result_notes && (
                <div>
                  <h3 className="font-semibold mb-2">Notes</h3>
                  <p className="text-gray-700 bg-gray-50 p-4 rounded-lg">
                    {result.result_notes}
                  </p>
                </div>
              )}

              {/* Next Steps */}
              <div>
                <h3 className="font-semibold mb-2">Next Steps</h3>
                {result.result_category === 'Normal' ? (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="text-green-700">
                      Your test result is normal. No further action is required at this time.
                    </p>
                    <p className="text-sm text-green-600 mt-2">
                      Continue regular screening as recommended by your healthcare provider.
                    </p>
                  </div>
                ) : (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-red-700 font-medium mb-2">
                      Follow-up Required
                    </p>
                    <p className="text-red-700 mb-3">
                      Please contact ROSE Foundation for further consultation and next steps.
                    </p>
                    <div className="space-y-1 text-sm">
                      <p>Phone: +60-XXX-XXXX</p>
                      <p>Email: support@rose.org</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Download PDF */}
              {result.result_file_url && (
                <div>
                  <Button
                    onClick={() => window.open(result.result_file_url!, '_blank')}
                    className="w-full bg-emerald-500 hover:bg-emerald-600"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download Full Report (PDF)
                  </Button>
                  <p className="text-xs text-gray-500 text-center mt-2">
                    Download link valid for 1 hour
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </DashboardLayout>
    </ProtectedRoute>
  );
}