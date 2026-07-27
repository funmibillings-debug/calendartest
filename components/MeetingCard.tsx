'use client';

import { useState } from 'react';
import { CalendarEvent, SalesforceAccount } from '@/types';
import { getMemberByEmail } from '@/lib/team';
import { CSMAvatar } from './CSMAvatar';
import { ShadowRequestModal } from './ShadowRequestModal';
import { CoverageModal } from './CoverageModal';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const TYPE_COLORS: Record<string, string> = {
  QBR: 'bg-purple-100 text-purple-700',
  'Weekly Sync': 'bg-blue-100 text-blue-700',
  'Monthly Sync': 'bg-indigo-100 text-indigo-700',
  Onboarding: 'bg-green-100 text-green-700',
  Renewal: 'bg-yellow-100 text-yellow-700',
  'Office Hours': 'bg-orange-100 text-orange-700',
  Other: 'bg-gray-100 text-gray-600',
};

interface Props {
  event: CalendarEvent;
  account: SalesforceAccount | null;
  currentUserEmail: string;
  onCoverClaimed: () => void;
}

export function MeetingCard({ event, account, currentUserEmail, onCoverClaimed }: Props) {
  const [showShadow, setShowShadow] = useState(false);
  const [showCoverage, setShowCoverage] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);

  const isOwner = event.csmEmail === currentUserEmail;
  const isCovered = !!event.coveredBy;
  const coveringMember = event.coveredBy ? getMemberByEmail(event.coveredBy) : null;

  const startDate = new Date(event.startTime);
  const endDate = new Date(event.endTime);
  const durationMin = Math.round((endDate.getTime() - startDate.getTime()) / 60000);

  const timeLabel = startDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  const renewalLabel = account?.renewalDate
    ? new Date(account.renewalDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    : null;

  return (
    <>
      <Card
        className={cn(
          'border transition-shadow hover:shadow-md',
          event.needsCoverage && !isCovered && 'border-red-300 bg-red-50/40',
          isCovered && 'border-green-300 bg-green-50/40'
        )}
      >
        <CardContent className="p-4">
          {/* Status banners */}
          {event.needsCoverage && !isCovered && (
            <div className="mb-3 flex items-center gap-2 text-sm font-medium text-red-700 bg-red-100 rounded-md px-3 py-1.5">
              <span className="inline-block h-2 w-2 rounded-full bg-red-500 animate-pulse" />
              Needs Coverage
            </div>
          )}
          {isCovered && (
            <div className="mb-3 flex items-center gap-2 text-sm font-medium text-green-700 bg-green-100 rounded-md px-3 py-1.5">
              <span>✓</span>
              Covered by {coveringMember?.name ?? event.coveredBy}
            </div>
          )}

          {/* Header row */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900 truncate">{event.title}</p>
              {account ? (
                <p className="text-sm text-gray-600 mt-0.5">{account.name}</p>
              ) : (
                <p className="text-sm text-gray-400 italic mt-0.5">Unknown Account</p>
              )}
            </div>
            <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap', TYPE_COLORS[event.meetingType])}>
              {event.meetingType}
            </span>
          </div>

          {/* Meta row */}
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-gray-500">
            <span>{timeLabel} · {durationMin}m</span>
            <span>{event.externalAttendees.length} external</span>
            {renewalLabel && (
              <span className="text-yellow-700 font-medium">↻ Renews {renewalLabel}</span>
            )}
          </div>

          {/* Salesforce next step */}
          {account?.nextStep && (
            <div className="mt-3 text-sm text-gray-600 bg-gray-50 rounded-md px-3 py-2">
              <span className="font-medium text-gray-700">Next Step: </span>
              {account.nextStep}
            </div>
          )}

          {/* Next step history (collapsible) */}
          {account?.nextStepHistory && (
            <div className="mt-2">
              <button
                onClick={() => setHistoryOpen(!historyOpen)}
                className="text-xs text-blue-600 hover:underline"
              >
                {historyOpen ? '▲ Hide history' : '▼ Show next step history'}
              </button>
              {historyOpen && (
                <div className="mt-2 text-xs text-gray-500 bg-gray-50 rounded-md px-3 py-2 whitespace-pre-wrap max-h-32 overflow-y-auto">
                  {account.nextStepHistory}
                </div>
              )}
            </div>
          )}

          {/* Owner + actions row */}
          <div className="mt-4 flex items-center justify-between gap-2">
            <CSMAvatar email={event.csmEmail} size="sm" showName />
            <div className="flex items-center gap-2">
              {!isOwner && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowShadow(true)}
                  className="text-xs"
                >
                  Request to Shadow
                </Button>
              )}
              {event.needsCoverage && !isCovered && !isOwner && (
                <Button
                  size="sm"
                  onClick={() => setShowCoverage(true)}
                  className="text-xs bg-red-600 hover:bg-red-700 text-white"
                >
                  I Can Cover
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <ShadowRequestModal
        event={event}
        account={account}
        open={showShadow}
        onClose={() => setShowShadow(false)}
      />
      <CoverageModal
        event={event}
        account={account}
        open={showCoverage}
        onClose={() => setShowCoverage(false)}
        onClaimed={() => {
          setShowCoverage(false);
          onCoverClaimed();
        }}
      />
    </>
  );
}
