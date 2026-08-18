import { CalendarEvent } from '@/types';
import { classifyMeeting } from './meeting-classifier';


interface ScriptAttendee {
  email: string;
  displayName: string | null;
  responseStatus: string;
}

interface ScriptEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  organizer: string | null;
  internalAttendees: ScriptAttendee[];
  externalAttendees: ScriptAttendee[];
  calendarId: string;
}

interface ScriptOOOBlock {
  id: string;
  title: string;
  start: string;
  end: string;
  organizer: string | null;
  calendarId: string;
}

interface ScriptResponse {
  events: ScriptEvent[];
  oooBlocks: ScriptOOOBlock[];
  updatedAt: string;
}

function inferCsmEmail(event: ScriptEvent): string {
  if (event.organizer?.endsWith('@coderabbit.ai')) return event.organizer;
  const internal = event.internalAttendees.find(a => a.email.endsWith('@coderabbit.ai'));
  return internal?.email ?? 'funmi@coderabbit.ai';
}

function expandDateRange(startIso: string, endIso: string): string[] {
  const dates: string[] = [];
  const cursor = new Date(startIso);
  const end = new Date(endIso);
  while (cursor < end) {
    dates.push(cursor.toISOString().slice(0, 10));
    cursor.setDate(cursor.getDate() + 1);
  }
  return dates;
}

export async function fetchAllEvents(daysAhead = 60): Promise<{
  events: CalendarEvent[];
  oooByEmail: Record<string, string[]>;
}> {
  const url = process.env.APPS_SCRIPT_URL;
  const secret = process.env.APPS_SCRIPT_SECRET;
  if (!url || !secret) throw new Error('APPS_SCRIPT_URL and APPS_SCRIPT_SECRET env vars are required');

  const res = await fetch(`${url}?secret=${encodeURIComponent(secret)}&days=${daysAhead}`, {
    cache: 'no-store',
  });

  if (!res.ok) throw new Error(`Apps Script responded with ${res.status}`);

  const data: ScriptResponse = await res.json();

  const events: CalendarEvent[] = data.events.map(e => ({
    id: e.id,
    title: e.title,
    startTime: e.start,
    endTime: e.end,
    csmEmail: inferCsmEmail(e),
    externalAttendees: e.externalAttendees.map(a => ({
      email: a.email,
      name: a.displayName ?? undefined,
      responseStatus: a.responseStatus,
    })),
    meetingType: classifyMeeting(e.title),
    needsCoverage: false,
  }));

  // Build per-CSM OOO date map from all-day OOO blocks
  const oooByEmail: Record<string, string[]> = {};
  for (const block of data.oooBlocks) {
    const ownerEmail = block.organizer?.endsWith('@coderabbit.ai')
      ? block.organizer
      : 'funmi@coderabbit.ai';
    const dates = expandDateRange(block.start, block.end);
    if (!oooByEmail[ownerEmail]) oooByEmail[ownerEmail] = [];
    oooByEmail[ownerEmail].push(...dates);
  }
  for (const email of Object.keys(oooByEmail)) {
    oooByEmail[email] = [...new Set(oooByEmail[email])];
  }

  return { events, oooByEmail };
}

// Backwards-compatible wrappers used by /api/digest and other per-user callers.
// These make a full script fetch each time; fine for low-frequency callers.
export async function fetchEventsForUser(userEmail: string, daysAhead = 60): Promise<CalendarEvent[]> {
  const { events } = await fetchAllEvents(daysAhead);
  return events.filter(e => e.csmEmail === userEmail);
}

export async function detectOOODates(userEmail: string): Promise<string[]> {
  const { oooByEmail } = await fetchAllEvents();
  return oooByEmail[userEmail] ?? [];
}
