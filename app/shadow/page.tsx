'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useCalendar, useSalesforceAccount } from '@/hooks/useCalendar';
import { AppHeader } from '@/components/AppHeader';
import { MeetingCard } from '@/components/MeetingCard';
import { CalendarEvent } from '@/types';

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

export default function ShadowPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { events, isLoading, refresh } = useCalendar();

  const currentUserEmail = session?.user?.email ?? '';

  // Show this week + next week, exclude the current user's own calls
  const upcoming = useMemo(() => {
    const now = new Date();
    const twoWeeksOut = new Date(now.getTime() + 14 * 86400 * 1000);
    return events.filter(e => {
      const start = new Date(e.startTime);
      return (
        start >= now &&
        start <= twoWeeksOut &&
        e.csmEmail !== currentUserEmail
      );
    });
  }, [events, currentUserEmail]);

  if (status === 'unauthenticated') {
    router.replace('/login');
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader />

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Find a Call to Shadow</h1>
          <p className="text-gray-500 mt-1">
            Browse upcoming customer calls this week and next. Click &quot;Request to Shadow&quot; and the CSM
            will get a Slack message to add you to the invite.
          </p>
        </div>

        {isLoading && (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-36 bg-white rounded-xl border border-gray-200 animate-pulse" />
            ))}
          </div>
        )}

        {!isLoading && upcoming.length === 0 && (
          <div className="text-center py-20 text-gray-400">
            <p className="text-4xl mb-4">🔍</p>
            <p className="text-lg font-medium">No upcoming calls to shadow in the next two weeks.</p>
            <p className="text-sm mt-1">Check back soon — calendars update every 15 minutes.</p>
          </div>
        )}

        {!isLoading && (
          <div className="space-y-3">
            {upcoming.map(event => (
              <EventCardWrapper
                key={event.id}
                event={event}
                currentUserEmail={currentUserEmail}
                onCoverClaimed={refresh}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
