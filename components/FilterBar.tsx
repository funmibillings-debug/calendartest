'use client';

import { TEAM } from '@/lib/team';
import { MeetingType } from '@/types';
import { CSMAvatar } from './CSMAvatar';
import { cn } from '@/lib/utils';

export interface Filters {
  csms: string[];        // selected CSM emails (empty = all)
  dateFrom: string;
  dateTo: string;
  meetingType: MeetingType | 'All';
}

interface Props {
  filters: Filters;
  onChange: (f: Filters) => void;
}

const MEETING_TYPES: (MeetingType | 'All')[] = [
  'All', 'QBR', 'Weekly Sync', 'Monthly Sync', 'Onboarding', 'Renewal', 'Office Hours', 'Other',
];

const csms = TEAM.filter(m => m.role === 'csm');

export function FilterBar({ filters, onChange }: Props) {
  function toggleCSM(email: string) {
    const next = filters.csms.includes(email)
      ? filters.csms.filter(e => e !== email)
      : [...filters.csms, email];
    onChange({ ...filters, csms: next });
  }

  return (
    <div className="bg-white border-b border-gray-200 px-6 py-4 space-y-4">
      {/* CSM filter */}
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">CSM</p>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => onChange({ ...filters, csms: [] })}
            className={cn(
              'px-3 py-1 rounded-full text-sm border transition-colors',
              filters.csms.length === 0
                ? 'bg-gray-900 text-white border-gray-900'
                : 'bg-white text-gray-600 border-gray-300 hover:border-gray-500'
            )}
          >
            All
          </button>
          {csms.map(m => (
            <button
              key={m.email}
              onClick={() => toggleCSM(m.email)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1 rounded-full text-sm border transition-colors',
                filters.csms.includes(m.email)
                  ? 'bg-gray-900 text-white border-gray-900'
                  : 'bg-white text-gray-600 border-gray-300 hover:border-gray-500'
              )}
            >
              <CSMAvatar email={m.email} size="sm" />
              {m.name.split(' ')[0]}
            </button>
          ))}
        </div>
      </div>

      {/* Date range + meeting type */}
      <div className="flex flex-wrap gap-4 items-end">
        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">
            From
          </label>
          <input
            type="date"
            value={filters.dateFrom}
            onChange={e => onChange({ ...filters, dateFrom: e.target.value })}
            className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">
            To
          </label>
          <input
            type="date"
            value={filters.dateTo}
            onChange={e => onChange({ ...filters, dateTo: e.target.value })}
            className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">
            Meeting type
          </label>
          <select
            value={filters.meetingType}
            onChange={e => onChange({ ...filters, meetingType: e.target.value as MeetingType | 'All' })}
            className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
          >
            {MEETING_TYPES.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
