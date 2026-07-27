import { google } from 'googleapis';
import { CalendarEvent } from '@/types';
import { isInternal } from './team';
import { classifyMeeting } from './meeting-classifier';

const SCOPES = ['https://www.googleapis.com/auth/calendar.readonly'];
const OOO_KEYWORDS = ['ooo', 'out of office', 'vacation', 'pto', 'holiday', 'sick', 'leave'];

function getAuthForUser(userEmail: string) {
  const privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, '\n');
  return new google.auth.JWT({
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: privateKey,
    scopes: SCOPES,
    subject: userEmail,
  });
}

export async function fetchEventsForUser(
  userEmail: string,
  daysAhead = 60
): Promise<CalendarEvent[]> {
  const auth = getAuthForUser(userEmail);
  const calendar = google.calendar({ version: 'v3', auth });

  const timeMin = new Date().toISOString();
  const timeMax = new Date(Date.now() + daysAhead * 86400 * 1000).toISOString();

  const res = await calendar.events.list({
    calendarId: 'primary',
    timeMin,
    timeMax,
    singleEvents: true,
    orderBy: 'startTime',
    maxResults: 250,
  });

  const items = res.data.items ?? [];

  return items
    .filter(event => {
      if (event.status === 'cancelled') return false;
      const attendees = event.attendees ?? [];
      const selfAttendee = attendees.find(a => a.self);
      if (selfAttendee?.responseStatus === 'declined') return false;
      const hasExternal = attendees.some(a => a.email && !isInternal(a.email));
      return hasExternal;
    })
    .map(event => {
      const attendees = (event.attendees ?? []).filter(
        a => a.email && !isInternal(a.email)
      );
      const start = event.start?.dateTime ?? event.start?.date ?? '';
      const end = event.end?.dateTime ?? event.end?.date ?? '';
      return {
        id: event.id ?? '',
        title: event.summary ?? 'Untitled',
        startTime: start,
        endTime: end,
        csmEmail: userEmail,
        externalAttendees: attendees.map(a => ({
          email: a.email!,
          name: a.displayName ?? undefined,
          responseStatus: a.responseStatus ?? undefined,
        })),
        meetingType: classifyMeeting(event.summary ?? ''),
        needsCoverage: false,
      };
    });
}

export async function detectOOODates(userEmail: string): Promise<string[]> {
  const auth = getAuthForUser(userEmail);
  const calendar = google.calendar({ version: 'v3', auth });

  const timeMin = new Date().toISOString();
  const timeMax = new Date(Date.now() + 60 * 86400 * 1000).toISOString();

  const res = await calendar.events.list({
    calendarId: 'primary',
    timeMin,
    timeMax,
    singleEvents: true,
    orderBy: 'startTime',
    maxResults: 100,
  });

  const oooEvents = (res.data.items ?? []).filter(event => {
    const title = (event.summary ?? '').toLowerCase();
    return (
      (event.start?.date || (event.eventType === 'outOfOffice')) &&
      OOO_KEYWORDS.some(k => title.includes(k))
    );
  });

  // Collect all dates covered by OOO events
  const dates: string[] = [];
  for (const event of oooEvents) {
    const start = event.start?.date ? new Date(event.start.date) : null;
    const end = event.end?.date ? new Date(event.end.date) : null;
    if (!start || !end) continue;
    const cursor = new Date(start);
    while (cursor < end) {
      dates.push(cursor.toISOString().slice(0, 10));
      cursor.setDate(cursor.getDate() + 1);
    }
  }
  return [...new Set(dates)];
}
