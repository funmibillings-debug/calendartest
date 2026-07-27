export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { redis, keys } from '@/lib/redis';
import { notifyCoverageOffer, notifyUnavailability } from '@/lib/slack';
import { sendCoverageEmail } from '@/lib/email';
import { getMemberByEmail, APP_OWNER_EMAIL, VP_EMAIL } from '@/lib/team';
import { formatDate, formatTime } from '@/lib/utils-server';

// POST /api/coverage/mark-unavailable  — toggle manual sick-day unavailability
// POST /api/coverage/claim             — claim coverage for a meeting

export async function POST(req: NextRequest) {
  const session = await getServerSession();
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = new URL(req.url);
  const action = url.searchParams.get('action');

  if (action === 'mark-unavailable') {
    const { unavailable, affectedMeetingTitles } = await req.json();
    const email = session.user.email;
    const member = getMemberByEmail(email);

    if (unavailable) {
      await redis.set(keys.manualUnavailable(email), true, { ex: 86400 }); // expires end of day

      // Invalidate calendar cache so UI reflects the change immediately
      await redis.del(keys.calendarCache(email));

      // Notify app owner
      await notifyUnavailability({
        appOwnerEmail: APP_OWNER_EMAIL,
        csmEmail: email,
        csmName: member?.name ?? email,
        reason: 'manual',
        affectedMeetings: affectedMeetingTitles ?? [],
      });
    } else {
      await redis.del(keys.manualUnavailable(email));
      await redis.del(keys.calendarCache(email));
    }

    return NextResponse.json({ ok: true });
  }

  if (action === 'claim') {
    const { eventId, originalCsmEmail, meetingTitle, customerName, startTime } = await req.json();
    const coveringEmail = session.user.email;

    // Record coverage
    await redis.set(keys.coverage(eventId), coveringEmail);

    // Invalidate cache so the covering CSM shows up immediately
    await redis.del(keys.calendarCache(originalCsmEmail));

    const meetingDate = `${formatDate(startTime)} at ${formatTime(startTime)}`;

    // Notify via Slack + email
    await Promise.all([
      notifyCoverageOffer({
        originalCsmEmail,
        coveringCsmEmail: coveringEmail,
        vpEmail: VP_EMAIL,
        meetingTitle,
        customerName: customerName ?? 'Unknown Account',
        meetingDate,
      }),
      sendCoverageEmail({
        originalCsmEmail,
        coveringCsmEmail: coveringEmail,
        vpEmail: VP_EMAIL,
        meetingTitle,
        customerName: customerName ?? 'Unknown Account',
        meetingDate,
      }),
    ]);

    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}

// GET /api/coverage?email=... — check if a CSM is currently marked unavailable
export async function GET(req: NextRequest) {
  const session = await getServerSession();
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const email = new URL(req.url).searchParams.get('email') ?? session.user.email;
  const isManuallyUnavailable = await redis.get(keys.manualUnavailable(email));
  return NextResponse.json({ unavailable: isManuallyUnavailable === true });
}
