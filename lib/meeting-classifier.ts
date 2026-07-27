import { MeetingType } from '@/types';

const PATTERNS: { type: MeetingType; keywords: string[] }[] = [
  { type: 'QBR',          keywords: ['qbr', 'quarterly business review', 'quarterly review'] },
  { type: 'Onboarding',   keywords: ['onboarding', 'kickoff', 'kick-off', 'kick off', 'implementation'] },
  { type: 'Renewal',      keywords: ['renewal', 'renew', 'contract review', 'contract discussion'] },
  { type: 'Office Hours', keywords: ['office hours', 'open office', 'drop-in', 'drop in'] },
  { type: 'Monthly Sync', keywords: ['monthly sync', 'monthly check', 'monthly meeting', 'monthly call'] },
  { type: 'Weekly Sync',  keywords: ['weekly sync', 'weekly check', 'weekly meeting', 'weekly call', 'weekly standup'] },
];

export function classifyMeeting(title: string): MeetingType {
  const lower = title.toLowerCase();
  for (const { type, keywords } of PATTERNS) {
    if (keywords.some(k => lower.includes(k))) return type;
  }
  return 'Other';
}
