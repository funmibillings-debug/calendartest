export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { fetchAllEvents } from '@/lib/google-calendar';
import { redis, keys } from '@/lib/redis';
import { CalendarEvent } from '@/types';

const CACHE_TTL = 900; // 15 minutes

export async function GET() {
  const session = await getServerSession();
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Try a single unified cache entry for all events + OOO data
    const cacheKey = 'calendar:all';
    type CachedPayload = { events: CalendarEvent[]; oooByEmail: Record<string, string[]> };
    let cached: CachedPayload | null = await redis.get(cacheKey);

    let events: CalendarEvent[];
    let oooByEmail: Record<string, string[]>;

    if (cached) {
      ({ events, oooByEmail } = cached);
    } else {
      ({ events, oooByEmail } = await fetchAllEvents());
      await redis.set(cacheKey, { events, oooByEmail }, { ex: CACHE_TTL });
    }

    const today = new Date().toISOString().slice(0, 10);
    const unavailableDates: Record<string, string[]> = {};

    // Merge OOO calendar dates + manual unavailability per CSM
    const uniqueEmails = [...new Set(events.map(e => e.csmEmail))];
    await Promise.all(
      uniqueEmails.map(async (email) => {
        const manualUnavailable: boolean | null = await redis.get(keys.manualUnavailable(email));
        const oooDates = oooByEmail[email] ?? [];
        unavailableDates[email] = manualUnavailable
          ? [...new Set([...oooDates, today])]
          : oooDates;
      })
    );

    // Apply coverage flags and claimed coverage to each event
    const enrichedEvents = await Promise.all(
      events.map(async (event) => {
        const eventDate = new Date(event.startTime).toISOString().slice(0, 10);
        const needsCoverage = unavailableDates[event.csmEmail]?.includes(eventDate) ?? false;
        const coveredBy: string | null = await redis.get(keys.coverage(event.id));
        return {
          ...event,
          needsCoverage,
          ...(coveredBy ? { coveredBy } : {}),
        };
      })
    );

    return NextResponse.json({ events: enrichedEvents, unavailableDates });
  } catch (err) {
    console.error('Calendar fetch error:', err);
    return NextResponse.json({ error: 'Failed to fetch calendar data' }, { status: 500 });
  }
}
