export type CSMRole = 'csm' | 'vp';

export interface TeamMember {
  name: string;
  email: string;
  role: CSMRole;
  initials: string;
  color: string; // tailwind bg color for avatar
}

export type MeetingType =
  | 'QBR'
  | 'Weekly Sync'
  | 'Monthly Sync'
  | 'Onboarding'
  | 'Renewal'
  | 'Office Hours'
  | 'Other';

export interface Attendee {
  email: string;
  name?: string;
  responseStatus?: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  startTime: string; // ISO string
  endTime: string;   // ISO string
  csmEmail: string;
  externalAttendees: Attendee[];
  meetingType: MeetingType;
  needsCoverage: boolean;
  coveredBy?: string; // email of covering CSM
}

export interface SalesforceAccount {
  id: string;
  name: string;
  renewalDate?: string;
  nextStep?: string;
  nextStepHistory?: string;
}

export interface EnrichedEvent extends CalendarEvent {
  account?: SalesforceAccount;
}

export interface CoverageState {
  unavailableEmails: string[]; // CSMs currently marked unavailable
}
