'use client';

import { useCalendar } from '@/hooks/useCalendar';
import { AppHeader } from '@/components/AppHeader';
import { CapacityChart } from '@/components/CapacityChart';

export default function ManagerPage() {
  const { events, isLoading } = useCalendar();

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
