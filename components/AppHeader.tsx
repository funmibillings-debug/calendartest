'use client';

import { useSession, signOut } from 'next-auth/react';
import { useMyAvailability } from '@/hooks/useCoverage';
import { useCalendar } from '@/hooks/useCalendar';
import { CSMAvatar } from './CSMAvatar';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

export function AppHeader() {
  const { data: session } = useSession();
  const { isUnavailable, toggleUnavailable, loading } = useMyAvailability();
  const { events, refresh } = useCalendar();
  const pathname = usePathname();

  const email = session?.user?.email ?? '';
  const role = (session?.user as { role?: string })?.role ?? 'csm';

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
    await toggleUnavailable(!isUnavailable, myTodayMeetings);
    refresh();
  }

  const navLinks = [
    { href: '/', label: 'All Calls' },
    { href: '/shadow', label: 'Find a Call to Shadow' },
    ...(role === 'vp' || email === 'funmi@coderabbit.ai'
      ? [{ href: '/manager', label: 'Team Capacity' }]
      : []),
  ];

  return (
    <header className="bg-gray-900 text-white sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo + nav */}
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

        {/* Right side: unavailability toggle + user */}
        <div className="flex items-center gap-3">
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

          {email && (
            <div className="flex items-center gap-2">
              <CSMAvatar email={email} size="sm" />
              <button
                onClick={() => signOut({ callbackUrl: '/login' })}
                className="text-xs text-gray-400 hover:text-white transition-colors"
              >
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
