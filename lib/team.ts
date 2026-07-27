import { TeamMember } from '@/types';

export const TEAM: TeamMember[] = [
  { name: 'Josh Brown',    email: 'josh@coderabbit.ai',     role: 'csm', initials: 'JB', color: 'bg-blue-500' },
  { name: 'Darren Molloy', email: 'darren@coderabbit.ai',   role: 'csm', initials: 'DM', color: 'bg-purple-500' },
  { name: 'Matt Parker',   email: 'matt.parker@coderabbit.ai', role: 'csm', initials: 'MP', color: 'bg-green-500' },
  { name: 'Mathias Wetzel',email: 'mathias@coderabbit.ai',  role: 'csm', initials: 'MW', color: 'bg-yellow-500' },
  { name: 'Raf Ayala',     email: 'rafael@coderabbit.ai',   role: 'csm', initials: 'RA', color: 'bg-pink-500' },
  { name: 'Brett Goodman', email: 'brett@coderabbit.ai',    role: 'csm', initials: 'BG', color: 'bg-orange-500' },
  { name: 'Funmi Billings', email: 'funmi@coderabbit.ai',   role: 'csm', initials: 'FB', color: 'bg-teal-500' },
  { name: 'Daniel',        email: 'daniel@coderabbit.ai',   role: 'vp',  initials: 'D',  color: 'bg-indigo-600' },
];

export const APP_OWNER_EMAIL = 'funmi@coderabbit.ai';
export const VP_EMAIL = 'daniel@coderabbit.ai';
export const INTERNAL_DOMAIN = '@coderabbit.ai';

export function getMemberByEmail(email: string): TeamMember | undefined {
  return TEAM.find(m => m.email.toLowerCase() === email.toLowerCase());
}

export function isInternal(email: string): boolean {
  return email.toLowerCase().endsWith(INTERNAL_DOMAIN);
}

export const CSM_EMAILS = TEAM.map(m => m.email);
