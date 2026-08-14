export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { notifyShadowRequest } from '@/lib/slack';
import { formatDate, formatTime } from '@/lib/utils-server';

export async function POST(req: NextRequest) {
  const { csmEmail, meetingTitle, customerName, startTime, requesterEmail, requesterName } =
    await req.json();

  if (!requesterEmail || !csmEmail) {
    return NextResponse.json({ error: 'requesterEmail and csmEmail are required' }, { status: 400 });
  }

  const meetingDate = `${formatDate(startTime)} at ${formatTime(startTime)}`;

  await notifyShadowRequest({
    csmEmail,
    requesterEmail,
    requesterName: requesterName ?? requesterEmail,
    meetingTitle,
    customerName: customerName ?? 'Unknown Account',
    meetingDate,
  });

  return NextResponse.json({ ok: true });
}
