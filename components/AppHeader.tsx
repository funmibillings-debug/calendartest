'use client';

import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useMyAvailability } from '@/hooks/useCoverage';
import { useCalendar } from '@/hooks/useCalendar';
import { UserPicker } from './UserPicker';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

export function AppHeader() {
  const { user } = useCurrentUser();
  const email = user?.email ?? '';
  const { isUnavailable, toggleUnavailable, loading } = useMyAvailability(email);
  const { events, refresh } = useCalendar();
  const pathname = usePathname();

  const myTodayMeetings = events
    .filter(e => {
      const today = new Date().toISOString().slice(0, 10);
      return (
        e.csmEmail === email &&
        new Date(e.startTime).toISOString().slice(0, 10) === today
      );
    })
    .map(e => e.title);

  async function handleToggle() {
    if (!email) return;
    await toggleUnavailable(!isUnavailable, myTodayMeetings);
    refresh();
  }

  const navLinks = [
    { href: '/', label: 'All Calls' },
    { href: '/shadow', label: 'Find a Call to Shadow' },
    { href: '/manager', label: 'Team Capacity' },
  ];

  return (
    <header className="bg-gray-900 text-white sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 bg-white rounded-md flex items-center justify-center">
              <span className="text-gray-900 font-bold text-xs">CR</span>
            </div>
            <span className="font-semibold text-sm hidden sm:block">CSM Hub</span>
          </div>
          <nav className="flex items-center gap-1">
            {navLinks.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'px-3 py-1.5 rounded-md text-sm transition-colors',
                  pathname === link.href
                    ? 'bg-white/10 text-white'
                    : 'text-gray-300 hover:text-white hover:bg-white/5'
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {email && (
            <button
              onClick={handleToggle}
              disabled={loading}
              className={cn(
                'text-xs px-3 py-1.5 rounded-full border font-medium transition-colors',
                isUnavailable
                  ? 'bg-red-500 border-red-400 text-white hover:bg-red-600'
                  : 'bg-transparent border-gray-600 text-gray-300 hover:border-gray-400 hover:text-white'
              )}
            >
              {isUnavailable ? '🔴 Unavailable Today' : '🟢 Available'}
            </button>
          )}
          <UserPicker />
        </div>
      </div>
    </header>
  );
}
