import { Resend } from 'resend';
import { EnrichedEvent } from '@/types';
import { getMemberByEmail } from './team';
import { formatDate } from './utils-server';

function getResend() {
  return new Resend(process.env.RESEND_API_KEY!);
}
const FROM = 'CSM Hub <noreply@coderabbit.ai>';

export async function sendCoverageEmail({
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
  const coveringName = getMemberByEmail(coveringCsmEmail)?.name ?? coveringCsmEmail;

  const html = `
    <p><strong>${coveringName}</strong> has offered to cover your meeting:</p>
    <p><strong>${meetingTitle}</strong> with <strong>${customerName}</strong> on <strong>${meetingDate}</strong></p>
    <p>Please coordinate directly to confirm the handoff.</p>
  `;

  await getResend().emails.send({
    from: FROM,
    to: [originalCsmEmail, vpEmail],
    subject: `Coverage offer: ${meetingTitle} (${meetingDate})`,
    html,
  });
}

export async function sendWeeklyDigest(events: EnrichedEvent[]) {
  const recipient = process.env.DIGEST_RECIPIENT!;

  // Group by CSM
  const byCSM: Record<string, EnrichedEvent[]> = {};
  for (const event of events) {
    if (!byCSM[event.csmEmail]) byCSM[event.csmEmail] = [];
    byCSM[event.csmEmail].push(event);
  }

  let rows = '';
  for (const [email, csEvents] of Object.entries(byCSM)) {
    const member = getMemberByEmail(email);
    rows += `<h3 style="margin-top:24px">${member?.name ?? email}</h3><table style="width:100%;border-collapse:collapse">`;
    rows += `<tr style="background:#f4f4f4"><th style="padding:8px;text-align:left">Meeting</th><th>Customer</th><th>Date</th><th>Renewal</th></tr>`;
    for (const e of csEvents) {
      rows += `<tr>
        <td style="padding:8px;border-bottom:1px solid #eee">${e.title}</td>
        <td style="padding:8px;border-bottom:1px solid #eee">${e.account?.name ?? '—'}</td>
        <td style="padding:8px;border-bottom:1px solid #eee">${formatDate(e.startTime)}</td>
        <td style="padding:8px;border-bottom:1px solid #eee">${e.account?.renewalDate ?? '—'}</td>
      </tr>`;
    }
    rows += '</table>';
  }

  const html = `
    <h2>CSM Team — Upcoming Customer Calls</h2>
    <p>Week of ${formatDate(new Date().toISOString())}</p>
    ${rows || '<p>No customer calls scheduled this week.</p>'}
  `;

  await getResend().emails.send({
    from: FROM,
    to: recipient,
    subject: `CSM Weekly Digest — ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
    html,
  });
}
