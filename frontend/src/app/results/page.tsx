'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Toast from '@/components/ui/toast';
import { FileText, Eye, Clock, CheckCircle, Calendar, Search, AlertCircle } from 'lucide-react';

interface ParticipantResult {
  id: string;
  event_name: string;
  event_date: string;
  result_category: string;
  result_available: boolean;
  uploaded_at: string;
}

type FilterType = 'all' | 'available' | 'pending';

export default function MyResultsPage() {
  const router = useRouter();
  const [results, setResults] = useState<ParticipantResult[]>([]);
  const [filteredResults, setFilteredResults] = useState<ParticipantResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error';
    show: boolean;
  }>({
    message: '',
    type: 'success',
    show: false,
  });

  useEffect(() => {
    fetchResults();
  }, []);

  useEffect(() => {
    filterResults();
  }, [searchTerm, activeFilter, results]);

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
      setFilteredResults(data);
    } catch (err: any) {
      console.error(err);
      setToast({
        message: err.message || 'Failed to load results',
        type: 'error',
        show: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const filterResults = () => {
    let filtered = [...results];

    // Filter by status
    if (activeFilter === 'available') {
      filtered = filtered.filter(r => r.result_available);
    } else if (activeFilter === 'pending') {
      filtered = filtered.filter(r => !r.result_available);
    }

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(r =>
        r.event_name.toLowerCase().includes(term) ||
        r.result_category.toLowerCase().includes(term)
      );
    }

    setFilteredResults(filtered);
  };

  const getResultConfig = (result: ParticipantResult) => {
    if (!result.result_available) {
      return {
        icon: Clock,
        color: 'bg-amber-100 text-amber-700 border-amber-200',
        text: 'Pending',
      };
    }

    if (result.result_category === 'Normal') {
      return {
        icon: CheckCircle,
        color: 'bg-green-100 text-green-700 border-green-200',
        text: 'Normal',
      };
    }

    return {
      icon: AlertCircle,
      color: 'bg-red-100 text-red-700 border-red-200',
      text: result.result_category,
    };
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

  const availableCount = results.filter(r => r.result_available).length;
  const pendingCount = results.filter(r => !r.result_available).length;

  return (
    <ProtectedRoute requiredRole="participant">
      <DashboardLayout title="My Results">
        <Toast
          message={toast.message}
          type={toast.type}
          show={toast.show}
          onClose={() => setToast({ ...toast, show: false })}
        />

        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-4">My Screening Results</h2>


          {/* Filters */}
          {results.length > 0 && (
            <div className="flex gap-4 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search by event name or result category..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-11"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => setActiveFilter('all')}
                  variant={activeFilter === 'all' ? 'default' : 'outline'}
                  className={activeFilter === 'all' ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
                  size="sm"
                >
                  All
                </Button>
                <Button
                  onClick={() => setActiveFilter('available')}
                  variant={activeFilter === 'available' ? 'default' : 'outline'}
                  className={activeFilter === 'available' ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
                  size="sm"
                >
                  Available
                </Button>
                <Button
                  onClick={() => setActiveFilter('pending')}
                  variant={activeFilter === 'pending' ? 'default' : 'outline'}
                  className={activeFilter === 'pending' ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
                  size="sm"
                >
                  Pending
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Results List */}
        {results.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-500 mb-2">No results available yet</p>
              <p className="text-sm text-gray-400 mb-4">
                Results will appear here after you attend a screening event
              </p>
              <Button
                onClick={() => router.push('/events')}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                Browse Events
              </Button>
            </CardContent>
          </Card>
        ) : filteredResults.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-gray-500">No results match your search</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredResults.map((result) => {
              const config = getResultConfig(result);
              const ResultIcon = config.icon;

              return (
                <Card key={result.id} className="hover:shadow-md transition-shadow">
                  <CardContent>

                    {/* Mobile: Stack Layout */}
                    <div className="flex flex-col md:hidden gap-3">
                      {/* Status Badge */}
                      <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${config.color} self-start`}>
                        <ResultIcon className="w-4 h-4" />
                        <span className="text-sm font-medium">
                          {config.text}
                        </span>
                      </div>

                      {/* Event Info */}
                      <div>
                        <p className="font-medium text-gray-900 mb-2">{result.event_name}</p>
                        <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                          <Calendar className="w-3 h-3" />
                          <span>{new Date(result.event_date).toLocaleDateString()}</span>
                        </div>
                        <p className="text-xs text-gray-500">
                          {result.result_available ? 'Uploaded' : 'Attended'}: {new Date(result.uploaded_at).toLocaleDateString()}
                        </p>
                      </div>

                      {/* Action Button */}
                      {result.result_available ? (
                        <Button
                          onClick={() => router.push(`/results/${result.id}`)}
                          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold h-11"
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          View Result
                        </Button>
                      ) : (
                        <Button
                          disabled
                          className="w-full bg-gray-200 text-gray-500 cursor-not-allowed h-11"
                        >
                          Result Pending
                        </Button>
                      )}
                    </div>

                    {/* Desktop: Row Layout */}
                    <div className="hidden md:flex items-center gap-6">

                      {/* Status Badge */}
                      <div className="flex-shrink-0">
                        <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${config.color}`}>
                          <ResultIcon className="w-4 h-4" />
                          <span className="text-sm font-medium whitespace-nowrap">
                            {config.text}
                          </span>
                        </div>
                      </div>

                      {/* Event Info */}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 mb-1 truncate">{result.event_name}</p>
                        <div className="flex items-center gap-3 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            <span>Event: {new Date(result.event_date).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>

                      {/* Upload Date */}
                      <div className="flex-shrink-0 w-32">
                        <p className="text-xs text-gray-500 mb-1">
                          {result.result_available ? 'Uploaded On' : 'Event Attended'}
                        </p>
                        <p className="text-sm text-gray-700">
                          {new Date(result.uploaded_at).toLocaleDateString()}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(result.uploaded_at).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>

                      {/* Action */}
                      <div className="flex-shrink-0 w-32">
                        {result.result_available ? (
                          <Button
                            onClick={() => router.push(`/results/${result.id}`)}
                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                            size="sm"
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            View
                          </Button>
                        ) : (
                          <Button
                            disabled
                            className="w-full bg-gray-200 text-gray-500 cursor-not-allowed"
                            size="sm"
                          >
                            Pending
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