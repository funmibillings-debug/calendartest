export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { fetchEventsForUser, detectOOODates } from '@/lib/google-calendar';
import { redis, keys } from '@/lib/redis';
import { CSM_EMAILS } from '@/lib/team';
import { CalendarEvent } from '@/types';

const CACHE_TTL = 900; // 15 minutes

export async function GET() {
  const session = await getServerSession();
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const allEvents: CalendarEvent[] = [];
    const unavailableDates: Record<string, string[]> = {};

    await Promise.all(
      CSM_EMAILS.map(async (email) => {
        // Try cache first
        let events: CalendarEvent[] | null = await redis.get(keys.calendarCache(email));
        let oooDates: string[] | null = await redis.get(keys.oooCache(email));

        if (!events) {
          events = await fetchEventsForUser(email);
          await redis.set(keys.calendarCache(email), events, { ex: CACHE_TTL });
        }

        if (!oooDates) {
          oooDates = await detectOOODates(email);
          await redis.set(keys.oooCache(email), oooDates, { ex: CACHE_TTL });
        }

        // Check manual unavailability
        const manualUnavailable: boolean | null = await redis.get(keys.manualUnavailable(email));
        const today = new Date().toISOString().slice(0, 10);
        unavailableDates[email] = oooDates ?? [];

        // Mark events needing coverage
        const enrichedEvents = events.map(event => {
          const eventDate = new Date(event.startTime).toISOString().slice(0, 10);
          const needsCoverage =
            oooDates?.includes(eventDate) ||
            (manualUnavailable === true && eventDate === today);
          return { ...event, needsCoverage: needsCoverage ?? false };
        });

        // Check coverage claims
        const eventsWithCoverage = await Promise.all(
          enrichedEvents.map(async event => {
            const coveredBy: string | null = await redis.get(keys.coverage(event.id));
            return coveredBy ? { ...event, coveredBy } : event;
          })
        );

        allEvents.push(...eventsWithCoverage);
      })
    );

    // Sort by start time
    allEvents.sort(
      (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    );

    return NextResponse.json({ events: allEvents, unavailableDates });
  } catch (err) {
    console.error('Calendar fetch error:', err);
    return NextResponse.json({ error: 'Failed to fetch calendar data' }, { status: 500 });
  }
}
