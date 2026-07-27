import { WebClient } from '@slack/web-api';
import { getMemberByEmail } from './team';

const slack = new WebClient(process.env.SLACK_BOT_TOKEN);

async function getSlackUserId(email: string): Promise<string | null> {
  try {
    const res = await slack.users.lookupByEmail({ email });
    return res.user?.id ?? null;
  } catch {
    return null;
  }
}

async function dmUser(email: string, message: string): Promise<void> {
  const userId = await getSlackUserId(email);
  if (!userId) return;
  await slack.chat.postMessage({ channel: userId, text: message, mrkdwn: true });
}

export async function notifyCoverageOffer({
  originalCsmEmail,
  coveringCsmEmail,
  vpEmail,
  meetingTitle,
  customerName,
  meetingDate,
}: {
  originalCsmEmail: string;
  coveringCsmEmail: string;
  vpEmail: string;
  meetingTitle: string;
  customerName: string;
  meetingDate: string;
}) {
  const coveringMember = getMemberByEmail(coveringCsmEmail);
  const coveringName = coveringMember?.name ?? coveringCsmEmail;

  const message =
    `✅ *Coverage offer* — <@${await getSlackUserId(coveringCsmEmail) ?? coveringName}> has offered to cover your meeting:\n` +
    `*${meetingTitle}* with *${customerName}* on *${meetingDate}*\n\n` +
    `Please coordinate directly to confirm handoff.`;

  await Promise.all([
    dmUser(originalCsmEmail, message),
    dmUser(vpEmail, message),
  ]);
}

export async function notifyShadowRequest({
  csmEmail,
  requesterEmail,
  requesterName,
  meetingTitle,
  customerName,
  meetingDate,
}: {
  csmEmail: string;
  requesterEmail: string;
  requesterName: string;
  meetingTitle: string;
  customerName: string;
  meetingDate: string;
}) {
  const message =
    `👋 *Shadow request* — *${requesterName}* (${requesterEmail}) would like to shadow your call:\n` +
    `*${meetingTitle}* with *${customerName}* on *${meetingDate}*\n\n` +
    `Please add them to the calendar invite if you're happy to have them join.`;

  await dmUser(csmEmail, message);
}

export async function notifyUnavailability({
  appOwnerEmail,
  csmEmail,
  csmName,
  reason,
  affectedMeetings,
}: {
  appOwnerEmail: string;
  csmEmail: string;
  csmName: string;
  reason: 'ooo' | 'manual';
  affectedMeetings: string[];
}) {
  const reasonLabel = reason === 'ooo' ? 'PTO/OOO calendar block' : 'manual sick-day toggle';
  const meetingList = affectedMeetings.map(m => `• ${m}`).join('\n');
  const message =
    `🔴 *Unavailability alert* — *${csmName}* (${csmEmail}) is marked unavailable via ${reasonLabel}.\n\n` +
    `*Meetings needing coverage:*\n${meetingList || 'None in the next 24 hours.'}`;

  await dmUser(appOwnerEmail, message);
}
