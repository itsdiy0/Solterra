'use client';

import { useRouter, usePathname } from 'next/navigation';
import { Home, Calendar, Package, BookOpen, ClipboardList } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function BottomNav() {
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
  }, [pathname]);

  const adminNavItems = [
    { icon: Home, label: 'Home', path: '/admin/dashboard' },
    { icon: ClipboardList, label: 'Events', path: '/admin/events' },
    { icon: Package, label: 'Results', path: '/admin/results' },
    { icon: BookOpen, label: 'Bookings', path: '/admin/bookings' },
    { icon: Calendar, label: 'Calendar', path: '/admin/calendar' },
  ];

  const participantNavItems = [
    { icon: Home, label: 'Home', path: '/dashboard' },
    { icon: ClipboardList, label: 'Events', path: '/events' },
    { icon: Package, label: 'Results', path: '/results' },
    { icon: BookOpen, label: 'Bookings', path: '/bookings' },
    { icon: Calendar, label: 'Calendar', path: '/calendar' },
  ];

  const navItems = userRole === 'admin' ? adminNavItems : participantNavItems;

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-emerald-500 shadow-lg z-50">
      <div className="flex items-center justify-around h-16 px-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.path;

          return (
            <button
              key={item.path}
              onClick={() => router.push(item.path)}
              className={`flex flex-col items-center justify-center flex-1 h-full gap-1 transition-all ${
                isActive
                  ? 'text-white'
                  : 'text-white/60 hover:text-white/90'
              }`}
            >
              <div className={`${isActive ? 'bg-white/20 p-2 rounded-lg' : 'p-2'}`}>
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : ''}`} />
              </div>
              <span className={`text-[10px] ${isActive ? 'font-bold' : 'font-medium'}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}