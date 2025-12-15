'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Home, RefreshCw, AlertTriangle } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    console.error('Error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        {/* Error Icon */}
        <div className="mb-8">
          <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="w-12 h-12 text-red-600" />
          </div>
        </div>

        {/* Message */}
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          Something Went Wrong
        </h2>
        <p className="text-gray-600 mb-2">
          We encountered an unexpected error. Don't worry, it's not your fault!
        </p>
        
        {process.env.NODE_ENV === 'development' && (
          <details className="mt-4 mb-8 text-left">
            <summary className="text-sm text-gray-500 cursor-pointer hover:text-gray-700 mb-2">
              Error Details (Development Only)
            </summary>
            <pre className="text-xs bg-gray-100 p-4 rounded-lg overflow-auto text-red-600">
              {error.message}
            </pre>
          </details>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center mt-8">
          <Button
            onClick={reset}
            variant="outline"
            className="w-full sm:w-auto"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
          <Button
            onClick={() => router.push('/')}
            className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700"
          >
            <Home className="w-4 h-4 mr-2" />
            Go Home
          </Button>
        </div>

        {/* Help Text */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <p className="text-sm text-gray-500">
            If this problem persists, please contact support or try refreshing the page.
          </p>
        </div>
      </div>
    </div>
  );
}