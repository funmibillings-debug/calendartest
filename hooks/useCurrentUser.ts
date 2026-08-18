'use client';

// Re-export from the shared context so all hook instances share one source of truth.
export { useCurrentUser, type CurrentUser } from '@/contexts/current-user';
export { TEAM } from '@/lib/team';
