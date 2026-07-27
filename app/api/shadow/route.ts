export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { notifyShadowRequest } from '@/lib/slack';
import { formatDate, formatTime } from '@/lib/utils-server';

export async function POST(req: NextRequest) {
  const session = await getServerSession();
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { csmEmail, meetingTitle, customerName, startTime } = await req.json();
  const requesterEmail = session.user.email;
  const requesterName = session.user.name ?? requesterEmail;
  const meetingDate = `${formatDate(startTime)} at ${formatTime(startTime)}`;

  await notifyShadowRequest({
    csmEmail,
    requesterEmail,
    requesterName,
    meetingTitle,
    customerName: customerName ?? 'Unknown Account',
    meetingDate,
  });

  return NextResponse.json({ ok: true });
}
