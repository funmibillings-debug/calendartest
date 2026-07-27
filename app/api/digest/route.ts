export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { fetchEventsForUser } from '@/lib/google-calendar';
import { findAccountForEvent } from '@/lib/salesforce';
import { sendWeeklyDigest } from '@/lib/email';
import { CSM_EMAILS } from '@/lib/team';
import { EnrichedEvent } from '@/types';

// Called by Vercel cron (or manually to test): GET /api/digest
// Protect with a secret header so it can't be triggered publicly
export async function GET(req: NextRequest) {
  const secret = req.headers.get('x-cron-secret');
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const allEnriched: EnrichedEvent[] = [];

  // Fetch the coming week's events for all CSMs
  await Promise.all(
    CSM_EMAILS.map(async (email) => {
      const events = await fetchEventsForUser(email, 7);
      const enriched = await Promise.all(
        events.map(async (event) => {
          const emails = event.externalAttendees.map(a => a.email);
          const account = await findAccountForEvent(emails);
          return { ...event, account: account ?? undefined };
        })
      );
      allEnriched.push(...enriched);
    })
  );

  allEnriched.sort(
    (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
  );

  await sendWeeklyDigest(allEnriched);

  return NextResponse.json({ ok: true, count: allEnriched.length });
}
