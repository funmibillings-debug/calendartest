'use client';

import useSWR from 'swr';
import { CalendarEvent, SalesforceAccount } from '@/types';

const fetcher = (url: string) => fetch(url).then(r => r.json());

export interface CalendarData {
  events: CalendarEvent[];
  unavailableDates: Record<string, string[]>;
}

export function useCalendar() {
  const { data, error, isLoading, mutate } = useSWR<CalendarData>(
    '/api/calendar',
    fetcher,
    { refreshInterval: 5 * 60 * 1000 } // re-fetch every 5 minutes
  );

  return {
    events: data?.events ?? [],
    unavailableDates: data?.unavailableDates ?? {},
    isLoading,
    error,
    refresh: mutate,
  };
}

export function useSalesforceAccount(emails: string[]) {
  const key = emails.length > 0 ? ['/api/salesforce', emails] : null;
  const { data, isLoading } = useSWR<{ account: SalesforceAccount | null }>(
    key,
    ([url]) =>
      fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emails }),
      }).then(r => r.json()),
    { revalidateOnFocus: false, dedupingInterval: 3600 * 1000 }
  );

  return { account: data?.account ?? null, isLoading };
}
