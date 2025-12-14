'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Toast from '@/components/ui/toast';
import { 
  Download, 
  ArrowLeft, 
  Shield, 
  CheckCircle, 
  AlertTriangle,
  FileText,
  Calendar,
  Phone,
  Mail
} from 'lucide-react';

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
  const [phoneNumber, setPhoneNumber] = useState('');
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error';
    show: boolean;
  }>({
    message: '',
    type: 'success',
    show: false,
  });

  const handleRequestOTP = async () => {
    setLoading(true);

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
      setToast({
        message: 'Verification code sent to your phone',
        type: 'success',
        show: true,
      });
    } catch (err: any) {
      setToast({
        message: err.message || 'Failed to send OTP',
        type: 'error',
        show: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

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
      setToast({
        message: 'Result verified successfully',
        type: 'success',
        show: true,
      });
    } catch (err: any) {
      setToast({
        message: err.message || 'Invalid OTP code',
        type: 'error',
        show: true,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute requiredRole="participant">
      <DashboardLayout title="View Result">
        <Toast
          message={toast.message}
          type={toast.type}
          show={toast.show}
          onClose={() => setToast({ ...toast, show: false })}
        />

        <div className="max-w-5xl mx-auto">
          <Button
            variant="outline"
            onClick={() => router.push('/results')}
            className="mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Results
          </Button>

          {!result ? (
            <Card>
              <CardContent className="p-8">
                {step === 'request-otp' ? (
                  // Request OTP
                  <div className="max-w-md mx-auto text-center">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Shield className="w-8 h-8 text-blue-600" />
                    </div>
                    
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Verify Your Identity</h2>
                    <p className="text-gray-600 mb-6">
                      A verification code will be sent to your phone for security.
                    </p>

                    <Button
                      onClick={handleRequestOTP}
                      disabled={loading}
                      className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                    >
                      {loading ? 'Sending...' : 'Send Verification Code'}
                    </Button>
                  </div>
                ) : (
                  // Enter OTP
                  <div className="max-w-md mx-auto">
                    <div className="text-center mb-6">
                      <h2 className="text-2xl font-bold text-gray-900 mb-2">Enter Code</h2>
                      <p className="text-sm text-gray-600">
                        Sent to {phoneNumber}
                      </p>
                    </div>

                    <form onSubmit={handleVerifyOTP} className="space-y-6">
                      <Input
                        type="text"
                        placeholder="000000"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                        maxLength={6}
                        required
                        autoFocus
                        className="h-16 text-center text-3xl tracking-[0.5em] font-mono font-bold"
                      />

                      <Button
                        type="submit"
                        disabled={loading || otp.length !== 6}
                        className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                      >
                        {loading ? 'Verifying...' : 'View Result'}
                      </Button>

                      <button
                        type="button"
                        onClick={handleRequestOTP}
                        className="w-full text-sm text-emerald-600 hover:underline"
                        disabled={loading}
                      >
                        Resend code
                      </button>
                    </form>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            // Single Card Result Display
            <Card>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  
                  {/* Left: Event & Result Info */}
                  <div className="md:col-span-5 space-y-4">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Screening Event</p>
                      <h2 className="text-xl font-bold text-gray-900 mb-1">{result.event_name}</h2>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="w-3 h-3" />
                        <span>{new Date(result.event_date).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <div className="pt-4 border-t">
                      <p className="text-xs text-gray-500 mb-2">Test Result</p>
                      <span
                        className={`inline-block px-4 py-2 rounded-lg text-lg font-bold ${
                          result.result_category === 'Normal'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {result.result_category}
                      </span>
                    </div>

                    {result.result_notes && (
                      <div className="pt-4 border-t">
                        <p className="text-xs text-gray-500 mb-2">Clinical Notes</p>
                        <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg border">
                          {result.result_notes}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Right: Next Steps & Download */}
                  <div className="md:col-span-7 space-y-4">
                    <div>
                      <p className="text-xs text-gray-500 mb-3">What's Next?</p>
                      
                      {result.result_category === 'Normal' ? (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                          <div className="flex items-start gap-3">
                            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                            <div className="text-sm">
                              <p className="font-semibold text-green-900 mb-1">Result is Normal</p>
                              <p className="text-green-700 mb-2">No further action required.</p>
                              <p className="text-green-600 text-xs">
                                Continue regular screening as recommended.
                              </p>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                          <div className="flex items-start gap-3">
                            <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                            <div className="flex-1 text-sm">
                              <p className="font-semibold text-red-900 mb-2">Follow-up Required</p>
                              <p className="text-red-700 mb-3">
                                Please contact ROSE Foundation for consultation.
                              </p>
                              
                              <div className="bg-white rounded-lg p-3 border border-red-200">
                                <p className="font-semibold text-gray-900 text-xs mb-2">Contact Us</p>
                                <div className="space-y-1 text-xs text-gray-700">
                                  <div className="flex items-center gap-2">
                                    <Phone className="w-3 h-3 text-red-600" />
                                    <span>+60-XXX-XXXX</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Mail className="w-3 h-3 text-red-600" />
                                    <span>support@rose.org</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Download Section */}
                    {result.result_file_url && (
                      <div className="pt-4 border-t">
                        <p className="text-xs text-gray-500 mb-3">Full Report</p>
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                              <FileText className="w-5 h-5 text-emerald-600" />
                            </div>
                            <div className="flex-1">
                              <p className="font-semibold text-sm text-gray-900">Medical Report PDF</p>
                              <p className="text-xs text-gray-500">Detailed test results</p>
                            </div>
                          </div>
                          <Button
                            onClick={() => window.open(result.result_file_url!, '_blank')}
                            className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                          >
                            <Download className="w-4 h-4 mr-2" />
                            Download PDF
                          </Button>
                          <p className="text-xs text-gray-500 text-center mt-2">
                            🔒 Secure link • Valid for 1 hour
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}