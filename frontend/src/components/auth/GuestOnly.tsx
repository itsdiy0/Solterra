'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export default function GuestOnly({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isGuest, setIsGuest] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('access_token');
      
      if (!token) {
        // No token - user is guest
        setIsGuest(true);
        setLoading(false);
        return;
      }

      try {
        // Decode JWT to check role and expiry
        const payload = JSON.parse(atob(token.split('.')[1]));
        const role = payload.role;
        const exp = payload.exp * 1000;
        
        // Check if token expired
        if (Date.now() > exp) {
          // Token expired - clear it and allow access to auth pages
          localStorage.removeItem('access_token');
          localStorage.removeItem('user');
          setIsGuest(true);
          setLoading(false);
          return;
        }
        
        // Token is valid - redirect to appropriate dashboard
        if (role === 'admin') {
          router.push('/admin/dashboard');
        } else if (role === 'participant') {
          router.push('/dashboard');
        }
        setLoading(false);
      } catch (error) {
        // Invalid token - clear it
        localStorage.removeItem('access_token');
        localStorage.removeItem('user');
        setIsGuest(true);
        setLoading(false);
      }
    };

    checkAuth();
  }, [router, pathname]);

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