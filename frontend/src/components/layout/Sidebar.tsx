'use client';

import { useRouter, usePathname } from 'next/navigation';
import { Home, Calendar, Package, BookOpen, ClipboardList, Shield } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUserRole(payload.role);
      } catch (e) {
        console.error('Failed to decode token:', e);
      }
    }
  }, [pathname]); // Re-check on route change

  const baseNavItems = [
    { icon: ClipboardList, label: 'Events', path: '/events' },
    { icon: Package, label: 'Results', path: '/results' },
    { icon: BookOpen, label: 'Bookings', path: '/bookings' },
    { icon: Calendar, label: 'Calendar', path: '/calendar' },
  ];

  const navItems =
    userRole === 'admin'
      ? [
          { icon: Home, label: 'Home', path: '/admin/dashboard' },
          ...baseNavItems,
        ]
      : [
          { icon: Home, label: 'Home', path: '/dashboard' },
          ...baseNavItems,
        ];


  return (
    <aside className="w-20 bg-emerald-500 min-h-screen fixed left-0 top-0 flex flex-col items-center py-6 space-y-8">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.path;
        
        return (
          <button
            key={item.path}
            onClick={() => router.push(item.path)}
            className={`flex font-bold flex-col items-center gap-1 p-3 rounded-lg transition-colors ${
              isActive 
                ? 'bg-white/20 text-white' 
                : 'text-white/70 hover:text-white hover:bg-white/10'
            }`}
            title={item.label}
          >
            <Icon className="w-6 h-6" />
            <span className="text-xs">{item.label}</span>
          </button>
        );
      })}
    </aside>
  );
}