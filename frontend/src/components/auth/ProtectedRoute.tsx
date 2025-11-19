'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'participant' | 'admin';
  redirectPath?: string;
}

export default function ProtectedRoute({ 
  children, 
  requiredRole,
  redirectPath = '/auth/login' // Default redirect path
}: ProtectedRouteProps) {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('access_token');
      
      if (!token) {
        // No token - redirect to login
        router.push(redirectPath);
        return;
      }

      try {
        // Decode JWT to check role (basic client-side check)
        const payload = JSON.parse(atob(token.split('.')[1]));
        const role = payload.role;
        
        // Check if token expired
        const exp = payload.exp * 1000; // Convert to milliseconds
        if (Date.now() > exp) {
          localStorage.removeItem('access_token');
          router.push(redirectPath);
          return;
        }

        // Check role if required
        if (requiredRole && role !== requiredRole) {
          router.push(redirectPath);
          return;
        }

        setIsAuthorized(true);
      } catch (error) {
        console.error('Auth check failed:', error);
        localStorage.removeItem('access_token');
        router.push(redirectPath);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router, requiredRole, redirectPath]);

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

  if (!isAuthorized) {
    return null; // Will redirect, so show nothing
  }

  return <>{children}</>;
}