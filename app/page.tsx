'use client';

import { useState, useMemo } from 'react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useCalendar, useSalesforceAccount } from '@/hooks/useCalendar';
import { AppHeader } from '@/components/AppHeader';
import { FilterBar, Filters } from '@/components/FilterBar';
import { MeetingCard } from '@/components/MeetingCard';
import { CalendarEvent } from '@/types';

const today = new Date();
const plus30 = new Date(today.getTime() + 30 * 86400 * 1000);
const defaultFilters: Filters = {
  csms: [],
  dateFrom: today.toISOString().slice(0, 10),
  dateTo: plus30.toISOString().slice(0, 10),
  meetingType: 'All',
};

function toDateLabel(isoString: string): string {
  const d = new Date(isoString);
  return d.toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  });
}

function groupByDate(events: CalendarEvent[]): [string, CalendarEvent[]][] {
  const map = new Map<string, CalendarEvent[]>();
  for (const e of events) {
    const key = new Date(e.startTime).toISOString().slice(0, 10);
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(e);
  }
  return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
}

function EventCardWrapper({
  event,
  currentUserEmail,
  onCoverClaimed,
}: {
  event: CalendarEvent;
  currentUserEmail: string;
  onCoverClaimed: () => void;
}) {
  const { account } = useSalesforceAccount(event.externalAttendees.map(a => a.email));
  return (
    <MeetingCard
      event={event}
      account={account}
      currentUserEmail={currentUserEmail}
      onCoverClaimed={onCoverClaimed}
    />
  );
}

export default function DashboardPage() {
  const { user } = useCurrentUser();
  const { events, isLoading, refresh } = useCalendar();
  const [filters, setFilters] = useState<Filters>(defaultFilters);

  const currentUserEmail = user?.email ?? '';

  const filtered = useMemo(() => {
    return events.filter(e => {
      const eventDate = new Date(e.startTime).toISOString().slice(0, 10);
      if (filters.dateFrom && eventDate < filters.dateFrom) return false;
      if (filters.dateTo && eventDate > filters.dateTo) return false;
      if (filters.csms.length > 0 && !filters.csms.includes(e.csmEmail)) return false;
      if (filters.meetingType !== 'All' && e.meetingType !== filters.meetingType) return false;
      return true;
    });
  }, [events, filters]);

  const grouped = groupByDate(filtered);
  const needsCoverageCount = filtered.filter(e => e.needsCoverage && !e.coveredBy).length;

  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader />
      <FilterBar filters={filters} onChange={setFilters} />

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-6">
        {needsCoverageCount > 0 && (
          <div className="mb-6 flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-5 py-4">
            <span className="text-xl">⚠️</span>
            <div>
              <p className="font-semibold text-red-800">
                {needsCoverageCount} meeting{needsCoverageCount !== 1 ? 's' : ''} need{needsCoverageCount === 1 ? 's' : ''} coverage
              </p>
              <p className="text-sm text-red-600">
                Click &quot;I Can Cover&quot; on any red meeting card to volunteer.
              </p>
            </div>
          </div>
        )}

        {isLoading && (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-36 bg-white rounded-xl border border-gray-200 animate-pulse" />
            ))}
          </div>
        )}

        {!isLoading && filtered.length === 0 && (
          <div className="text-center py-20 text-gray-400">
            <p className="text-4xl mb-4">📅</p>
            <p className="text-lg font-medium">No customer calls match your filters.</p>
            <p className="text-sm mt-1">Try adjusting the date range or CSM selection.</p>
          </div>
        )}

        {!isLoading && grouped.map(([dateKey, dayEvents]) => (
          <section key={dateKey} className="mb-8">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
              {toDateLabel(`${dateKey}T00:00:00`)}
              <span className="ml-2 text-gray-400 font-normal normal-case">
                {dayEvents.length} call{dayEvents.length !== 1 ? 's' : ''}
              </span>
            </h2>
            <div className="space-y-3">
              {dayEvents.map(event => (
                <EventCardWrapper
                  key={event.id}
                  event={event}
                  currentUserEmail={currentUserEmail}
                  onCoverClaimed={refresh}
                />
              ))}
            </div>
          </section>
        ))}
      </main>
    </div>
  );
}
