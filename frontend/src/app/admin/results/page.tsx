'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Send, CheckCircle, Clock } from 'lucide-react';

interface Result {
  id: string;
  booking_id: string;
  result_category: string;
  result_notes: string | null;
  uploaded_at: string;
  sms_sent: boolean;
  sms_sent_at: string | null;
}

export default function AdminResultsPage() {
  const router = useRouter();
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(true);
  const [sendingIds, setSendingIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchResults();
  }, []);

  const fetchResults = async () => {
    const token = localStorage.getItem('access_token');
    
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/results`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error('Failed to fetch results');

      const data = await res.json();
      setResults(data.results || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSendSMS = async (resultId: string) => {
    if (!confirm('Send result notification SMS to participant?')) return;

    setSendingIds(prev => new Set(prev).add(resultId));

    try {
      const token = localStorage.getItem('access_token');
      
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/results/${resultId}/send-sms`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || 'Failed to send SMS');
      }

      const data = await res.json();
      alert(data.message || 'SMS sent successfully!');

      // Update local state
      setResults(prev => prev.map(r => 
        r.id === resultId 
          ? { ...r, sms_sent: true, sms_sent_at: new Date().toISOString() }
          : r
      ));
    } catch (err: any) {
      alert(err.message || 'Failed to send SMS');
    } finally {
      setSendingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(resultId);
        return newSet;
      });
    }
  };

  if (loading) {
    return (
      <ProtectedRoute requiredRole="admin">
        <DashboardLayout title="Test Results">
          <p className="text-gray-500 text-center py-12">Loading results...</p>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requiredRole="admin">
      <DashboardLayout title="Test Results">
        <div className="mb-6 flex justify-between items-center">
          <h2 className="text-2xl font-bold">Uploaded Test Results</h2>
          <Button
            onClick={() => router.push('/admin/results/upload')}
            className="bg-emerald-500 hover:bg-emerald-600"
          >
            Upload New Result
          </Button>
        </div>

        {results.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <FileText className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-500 mb-4">No results uploaded yet</p>
              <Button
                onClick={() => router.push('/admin/results/upload')}
                className="bg-emerald-500 hover:bg-emerald-600"
              >
                Upload First Result
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {results.map((result) => {
              const isSending = sendingIds.has(result.id);
              
              return (
                <Card key={result.id}>
                  <CardContent>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold">
                            Result #{result.id.slice(0, 8)}
                          </h3>
                          <span
                            className={`text-xs px-2 py-1 rounded-full ${
                              result.result_category === 'Normal'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-red-100 text-red-700'
                            }`}
                          >
                            {result.result_category}
                          </span>
                        </div>

                        <div className="space-y-1 text-sm text-gray-600">
                          <p>Booking ID: {result.booking_id.slice(0, 8)}...</p>
                          {result.result_notes && (
                            <p>Notes: {result.result_notes}</p>
                          )}
                          <p>
                            Uploaded: {new Date(result.uploaded_at).toLocaleString()}
                          </p>
                          
                          {result.sms_sent ? (
                            <div className="flex items-center gap-2 text-emerald-600">
                              <CheckCircle className="w-4 h-4" />
                              <span>
                                SMS Sent: {new Date(result.sms_sent_at!).toLocaleString()}
                              </span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 text-amber-600">
                              <Clock className="w-4 h-4" />
                              <span>SMS Not Sent</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="ml-6 flex flex-col gap-2">
                        {!result.sms_sent && (
                          <Button
                            onClick={() => handleSendSMS(result.id)}
                            disabled={isSending}
                            className="bg-emerald-500 hover:bg-emerald-600"
                          >
                            {isSending ? (
                              <span className="flex items-center gap-2">
                                <Clock className="w-4 h-4 animate-spin" />
                                Sending...
                              </span>
                            ) : (
                              <span className="flex items-center gap-2">
                                <Send className="w-4 h-4" />
                                Send SMS
                              </span>
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </DashboardLayout>
    </ProtectedRoute>
  );
}