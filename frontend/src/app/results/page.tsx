'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Eye, Clock, CheckCircle } from 'lucide-react';

interface ParticipantResult {
  id: string;
  event_name: string;
  event_date: string;
  result_category: string;
  result_available: boolean;
  uploaded_at: string;
}

export default function MyResultsPage() {
  const router = useRouter();
  const [results, setResults] = useState<ParticipantResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchResults();
  }, []);

  const fetchResults = async () => {
    const token = localStorage.getItem('access_token');
    
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/participant/results`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error('Failed to fetch results');

      const data = await res.json();
      setResults(data);
    } catch (err) {
      console.error(err);
      setError('Failed to load results');
    } finally {
      setLoading(false);
    }
  };

  const handleViewResult = (resultId: string) => {
    router.push(`/results/${resultId}`);
  };

  if (loading) {
    return (
      <ProtectedRoute requiredRole="participant">
        <DashboardLayout title="My Results">
          <p className="text-gray-500 text-center py-12">Loading results...</p>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  if (error) {
    return (
      <ProtectedRoute requiredRole="participant">
        <DashboardLayout title="My Results">
          <p className="text-red-600 text-center py-12">{error}</p>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requiredRole="participant">
      <DashboardLayout title="My Results">
        <h2 className="text-2xl font-bold mb-6">My Screening Results</h2>

        {results.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <FileText className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-500 mb-4">No results available yet</p>
              <p className="text-sm text-gray-400">
                Results will appear here after you attend a screening event
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4 max-w-3xl">
            {results.map((result) => (
              <Card key={result.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold mb-2">{result.event_name}</h3>
                      
                      <div className="space-y-1 text-sm text-gray-600">
                        <p>Date: {new Date(result.event_date).toLocaleDateString()}</p>
                        <p>
                          Uploaded: {new Date(result.uploaded_at).toLocaleDateString()}
                        </p>
                      </div>

                      <div className="mt-3">
                        {result.result_available ? (
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-3 py-1 rounded-full text-sm font-medium ${
                                result.result_category === 'Normal'
                                  ? 'bg-green-100 text-green-700'
                                  : result.result_category === 'Pending'
                                  ? 'bg-amber-100 text-amber-700'
                                  : 'bg-red-100 text-red-700'
                              }`}
                            >
                              {result.result_category}
                            </span>
                            <CheckCircle className="w-4 h-4 text-emerald-600" />
                            <span className="text-sm text-emerald-600">Available</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-amber-600" />
                            <span className="text-sm text-amber-600">Results Pending</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="ml-6">
                      {result.result_available ? (
                        <Button
                          onClick={() => handleViewResult(result.id)}
                          className="bg-emerald-500 hover:bg-emerald-600"
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          View Details
                        </Button>
                      ) : (
                        <Button disabled className="bg-gray-300 text-gray-500">
                          Not Available
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </DashboardLayout>
    </ProtectedRoute>
  );
}