'use client';

import { useRouter } from 'next/navigation';
import { User, Settings } from 'lucide-react';

interface HeaderProps {
  title: string;
}

export default function Header({ title }: HeaderProps) {
  const router = useRouter();

  return (
    <header className="h-16 bg-emerald-700 flex items-center justify-between px-6">
      <h1 className="text-2xl font-bold text-white">{title}</h1>
      
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.push('/profile')}
          className="p-2 hover:bg-white/10 rounded-full transition-colors"
        >
          <User className="w-6 h-6 text-white" />
        </button>
        <button
          onClick={() => router.push('/settings')}
          className="p-2 hover:bg-white/10 rounded-full transition-colors"
        >
          <Settings className="w-6 h-6 text-white" />
        </button>
      </div>
    </header>
  );
}
