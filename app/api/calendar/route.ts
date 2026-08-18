export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { fetchAllEvents } from '@/lib/google-calendar';
import { redis, keys } from '@/lib/redis';
import { CalendarEvent } from '@/types';

const CACHE_TTL = 900; // 15 minutes

export async function GET() {
  try {
    const cacheKey = keys.calendarAll;
    type CachedPayload = { events: CalendarEvent[]; oooByEmail: Record<string, string[]> };
    const cached: CachedPayload | null = await redis.get(cacheKey);

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
