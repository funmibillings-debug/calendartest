'use client';

import { useState } from 'react';
import { CalendarEvent, SalesforceAccount } from '@/types';
import { getMemberByEmail } from '@/lib/team';
import { claimCoverage } from '@/hooks/useCoverage';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface Props {
  event: CalendarEvent;
  account: SalesforceAccount | null;
  currentUserEmail: string;
  open: boolean;
  onClose: () => void;
  onClaimed: () => void;
}

export function CoverageModal({ event, account, currentUserEmail, open, onClose, onClaimed }: Props) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const originalCSM = getMemberByEmail(event.csmEmail);

  async function handleClaim() {
    setStatus('loading');
    const ok = await claimCoverage({
      coveringEmail: currentUserEmail,
      eventId: event.id,
      originalCsmEmail: event.csmEmail,
      meetingTitle: event.title,
      customerName: account?.name,
      startTime: event.startTime,
    });
    setStatus(ok ? 'success' : 'error');
    if (ok) onClaimed();
  }

  const meetingDate = new Date(event.startTime).toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  });
  const meetingTime = new Date(event.startTime).toLocaleTimeString('en-US', {
    hour: 'numeric', minute: '2-digit',
  });

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) { setStatus('idle'); onClose(); } }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Cover This Meeting</DialogTitle>
          <DialogDescription>
            {originalCSM?.name ?? event.csmEmail} is unavailable. Confirming will notify them and
            Daniel via Slack and email.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-1">
            <p className="font-semibold text-gray-900">{event.title}</p>
            {account && <p className="text-sm text-gray-600">{account.name}</p>}
            <p className="text-sm text-gray-500">{meetingDate} at {meetingTime}</p>
            <p className="text-sm text-gray-500">Original CSM: {originalCSM?.name ?? event.csmEmail}</p>
          </div>

          {status === 'success' && (
            <p className="text-sm text-green-700 bg-green-50 rounded-md px-3 py-2">
              Covered! {originalCSM?.name ?? 'The CSM'} and Daniel have been notified.
            </p>
          )}
          {status === 'error' && (
            <p className="text-sm text-red-700 bg-red-50 rounded-md px-3 py-2">
              Something went wrong. Please try again.
            </p>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          {status !== 'success' && (
            <Button
              onClick={handleClaim}
              disabled={status === 'loading'}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {status === 'loading' ? 'Confirming…' : 'I Can Cover This'}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
