
'use client';

import { useEffect } from 'react';

interface ToastProps {
  message: string;
  type: 'success' | 'error';
  show: boolean;
  onClose: () => void;
}

export default function Toast({ message, type, show, onClose }: ToastProps) {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(() => {
        onClose();
      }, 3000); // Auto-hide after 3 seconds
      return () => clearTimeout(timer);
    }
  }, [show, onClose]);

  if (!show) return null;

  const bgColor = type === 'success' ? 'bg-emerald-500' : 'bg-red-500';

  return (
    <div 
      className={`fixed top-5 right-5 z-50 px-6 py-3 text-white rounded-lg shadow-lg ${bgColor} animate-slide-in-right`}
    >
      {message}
    </div>
  );
}
