'use client';

import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useCalendar } from '@/hooks/useCalendar';
import { AppHeader } from '@/components/AppHeader';
import { CapacityChart } from '@/components/CapacityChart';

export default function ManagerPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { events, isLoading } = useCalendar();

  if (status === 'unauthenticated') {
    router.replace('/login');
    return null;
  }

  // Only accessible by VP or app owner
  const email = session?.user?.email ?? '';
  const role = (session?.user as { role?: string })?.role ?? 'csm';
  if (status === 'authenticated' && role !== 'vp' && email !== 'funmi@coderabbit.ai') {
    router.replace('/');
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader />

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Team Capacity</h1>
          <p className="text-gray-500 mt-1">
            Customer call load per CSM for the next 4 weeks.
          </p>
        </div>

        {isLoading && (
          <div className="space-y-4">
            {[...Array(7)].map((_, i) => (
              <div key={i} className="h-40 bg-white rounded-xl border border-gray-200 animate-pulse" />
            ))}
          </div>
        )}

        {!isLoading && <CapacityChart events={events} />}
      </main>
    </div>
  );
}
