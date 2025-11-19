'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'participant' | 'admin';
}

export default function ProtectedRoute({ 
  children, 
  requiredRole
}: ProtectedRouteProps) {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('access_token');
      
      if (!token) {
        // No token - redirect to appropriate login page
        if (requiredRole === 'admin') {
          router.push('/admin/login');
        } else {
          router.push('/auth/login');
        }
        setLoading(false);
        return;
      }

      try {
        // Decode JWT to check role and expiry
        const payload = JSON.parse(atob(token.split('.')[1]));
        const userRole = payload.role;
        
        // Check if token expired
        const exp = payload.exp * 1000;
        if (Date.now() > exp) {
          localStorage.removeItem('access_token');
          localStorage.removeItem('user');
          
          // Redirect to appropriate login
          if (requiredRole === 'admin') {
            router.push('/admin/login');
          } else {
            router.push('/auth/login');
          }
          setLoading(false);
          return;
        }

        // Check role matches requirement
        if (requiredRole && userRole !== requiredRole) {
          // User has wrong role - redirect them to their own dashboard
          if (userRole === 'admin') {
            router.push('/admin/dashboard');
          } else {
            router.push('/dashboard');
          }
          setLoading(false);
          return;
        }

        // All checks passed
        setIsAuthorized(true);
        setLoading(false);
      } catch (error) {
        console.error('Auth check failed:', error);
        localStorage.removeItem('access_token');
        localStorage.removeItem('user');
        
        if (requiredRole === 'admin') {
          router.push('/admin/login');
        } else {
          router.push('/auth/login');
        }
        setLoading(false);
      }
    };

    checkAuth();
  }, [router, requiredRole]);

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
    return null;
  }

  return <>{children}</>;
}