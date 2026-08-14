export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { redis, keys } from '@/lib/redis';
import { notifyCoverageOffer, notifyUnavailability } from '@/lib/slack';
import { sendCoverageEmail } from '@/lib/email';
import { getMemberByEmail, APP_OWNER_EMAIL, VP_EMAIL } from '@/lib/team';
import { formatDate, formatTime } from '@/lib/utils-server';

export async function POST(req: NextRequest) {
  const url = new URL(req.url);
  const action = url.searchParams.get('action');

  if (action === 'mark-unavailable') {
    const { email, unavailable, affectedMeetingTitles } = await req.json();
    if (!email) return NextResponse.json({ error: 'email required' }, { status: 400 });

    const member = getMemberByEmail(email);

    if (unavailable) {
      await redis.set(keys.manualUnavailable(email), true, { ex: 86400 });
      await redis.del(keys.calendarAll);

      await notifyUnavailability({
        appOwnerEmail: APP_OWNER_EMAIL,
        csmEmail: email,
        csmName: member?.name ?? email,
        reason: 'manual',
        affectedMeetings: affectedMeetingTitles ?? [],
      });
    } else {
      await redis.del(keys.manualUnavailable(email));
      await redis.del(keys.calendarAll);
    }

    return NextResponse.json({ ok: true });
  }

  if (action === 'claim') {
    const { coveringEmail, eventId, originalCsmEmail, meetingTitle, customerName, startTime } =
      await req.json();
    if (!coveringEmail) return NextResponse.json({ error: 'coveringEmail required' }, { status: 400 });

    await redis.set(keys.coverage(eventId), coveringEmail);
    await redis.del(keys.calendarAll);

    const meetingDate = `${formatDate(startTime)} at ${formatTime(startTime)}`;

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

export async function GET(req: NextRequest) {
  const email = new URL(req.url).searchParams.get('email');
  if (!email) return NextResponse.json({ unavailable: false });

  const isManuallyUnavailable = await redis.get(keys.manualUnavailable(email));
  return NextResponse.json({ unavailable: isManuallyUnavailable === true });
}
