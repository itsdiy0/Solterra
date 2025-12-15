'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Home, RefreshCw, AlertTriangle } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Global Error:', error);
  }, [error]);

  return (
    <html>
      <body>
        <div className="min-h-screen bg-gradient-to-br from-red-50 to-gray-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full text-center">
            <div className="mb-8">
              <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertTriangle className="w-12 h-12 text-red-600" />
              </div>
            </div>

            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Critical Error
            </h2>
            <p className="text-gray-600 mb-8">
              A critical error occurred. Please try reloading the page.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                onClick={reset}
                variant="outline"
                className="w-full sm:w-auto"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
              <Button
                onClick={() => window.location.href = '/'}
                className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700"
              >
                <Home className="w-4 h-4 mr-2" />
                Go Home
              </Button>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}