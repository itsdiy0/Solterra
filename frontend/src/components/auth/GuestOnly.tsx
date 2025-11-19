'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface GuestOnlyProps {
  children: React.ReactNode;
  redirectPath?: string;
}

export default function GuestOnly({ 
  children,
  redirectPath = '/dashboard' // Default redirect for authenticated users
}: GuestOnlyProps) {
  const router = useRouter();
  const [isGuest, setIsGuest] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('access_token');
      
      if (token) {
        try {
          // Decode JWT to check if valid and not expired
          const payload = JSON.parse(atob(token.split('.')[1]));
          const exp = payload.exp * 1000;
          
          if (Date.now() < exp) {
            // Token valid - redirect to dashboard
            router.push(redirectPath);
            return;
          } else {
            // Token expired - clear it
            localStorage.removeItem('access_token');
          }
        } catch (error) {
          // Invalid token - clear it
          localStorage.removeItem('access_token');
        }
      }
      
      // No valid token - user is guest
      setIsGuest(true);
      setLoading(false);
    };

    checkAuth();
  }, [router, redirectPath]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isGuest) {
    return null; // Will redirect
  }

  return <>{children}</>;
}