'use client';

import { useState } from 'react';
import { CalendarEvent, SalesforceAccount } from '@/types';
import { getMemberByEmail } from '@/lib/team';
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
  open: boolean;
  onClose: () => void;
}

export function ShadowRequestModal({ event, account, open, onClose }: Props) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const csm = getMemberByEmail(event.csmEmail);

  async function handleRequest() {
    setStatus('loading');
    const res = await fetch('/api/shadow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        csmEmail: event.csmEmail,
        meetingTitle: event.title,
        customerName: account?.name,
        startTime: event.startTime,
      }),
    });
    setStatus(res.ok ? 'success' : 'error');
  }

  const meetingDate = new Date(event.startTime).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
  const meetingTime = new Date(event.startTime).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) { setStatus('idle'); onClose(); } }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Request to Shadow</DialogTitle>
          <DialogDescription>
            A Slack message will be sent to {csm?.name ?? event.csmEmail} asking them to add you
            to the calendar invite.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <div className="bg-gray-50 rounded-lg p-4 space-y-1">
            <p className="font-semibold text-gray-900">{event.title}</p>
            {account && <p className="text-sm text-gray-600">{account.name}</p>}
            <p className="text-sm text-gray-500">{meetingDate} at {meetingTime}</p>
            <p className="text-sm text-gray-500">Owner: {csm?.name ?? event.csmEmail}</p>
          </div>

          {status === 'success' && (
            <p className="text-sm text-green-700 bg-green-50 rounded-md px-3 py-2">
              Request sent! {csm?.name ?? 'The CSM'} will receive a Slack message.
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
            <Button onClick={handleRequest} disabled={status === 'loading'}>
              {status === 'loading' ? 'Sending…' : 'Send Request'}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
