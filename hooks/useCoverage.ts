'use client';

import { useState } from 'react';
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then(r => r.json());

export function useMyAvailability(email: string) {
  const { data, mutate } = useSWR<{ unavailable: boolean }>(
    email ? `/api/coverage?email=${encodeURIComponent(email)}` : null,
    fetcher,
    { refreshInterval: 60 * 1000 }
  );

  const [loading, setLoading] = useState(false);

  async function toggleUnavailable(unavailable: boolean, affectedMeetingTitles: string[] = []) {
    setLoading(true);
    await fetch('/api/coverage?action=mark-unavailable', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, unavailable, affectedMeetingTitles }),
    });
    await mutate();
    setLoading(false);
  }

  return {
    isUnavailable: data?.unavailable ?? false,
    toggleUnavailable,
    loading,
  };
}

export async function claimCoverage({
  coveringEmail,
  eventId,
  originalCsmEmail,
  meetingTitle,
  customerName,
  startTime,
}: {
  coveringEmail: string;
  eventId: string;
  originalCsmEmail: string;
  meetingTitle: string;
  customerName?: string;
  startTime: string;
}) {
  const res = await fetch('/api/coverage?action=claim', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      coveringEmail,
      eventId,
      originalCsmEmail,
      meetingTitle,
      customerName,
      startTime,
    }),
  });
  return res.ok;
}
