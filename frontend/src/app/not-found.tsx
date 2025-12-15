'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Home, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        {/* 404 Animation */}
        <div className="mb-8">
          <h1 className="text-9xl font-bold text-emerald-600 mb-4">404</h1>
          <div className="w-24 h-1 bg-emerald-600 mx-auto mb-6 rounded-full"></div>
        </div>

        {/* Message */}
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          Page Not Found
        </h2>
        <p className="text-gray-600 mb-8">
          Oops! The page you're looking for doesn't exist. It might have been moved or deleted.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            onClick={() => router.back()}
            variant="outline"
            className="w-full sm:w-auto"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </Button>
          <Button
            onClick={() => router.push('/')}
            className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700"
          >
            <Home className="w-4 h-4 mr-2" />
            Go Home
          </Button>
        </div>

        {/* Helpful Links */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <p className="text-sm text-gray-500 mb-4">Maybe try one of these:</p>
          <div className="flex flex-wrap gap-2 justify-center">
            <button
              onClick={() => router.push('/events')}
              className="text-sm text-emerald-600 hover:text-emerald-700 underline"
            >
              Browse Events
            </button>
            <span className="text-gray-300">•</span>
            <button
              onClick={() => router.push('/bookings')}
              className="text-sm text-emerald-600 hover:text-emerald-700 underline"
            >
              My Bookings
            </button>
            <span className="text-gray-300">•</span>
            <button
              onClick={() => router.push('/calendar')}
              className="text-sm text-emerald-600 hover:text-emerald-700 underline"
            >
              Calendar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}