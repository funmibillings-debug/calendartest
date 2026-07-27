'use client';

import { CalendarEvent } from '@/types';
import { TEAM } from '@/lib/team';
import { cn } from '@/lib/utils';

interface Props {
  events: CalendarEvent[];
}

function getWeekKey(isoString: string): string {
  const d = new Date(isoString);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d.setDate(diff));
  return monday.toISOString().slice(0, 10);
}

function getLoadLabel(count: number): { label: string; color: string } {
  if (count <= 3) return { label: 'Light', color: 'bg-green-100 text-green-700' };
  if (count <= 6) return { label: 'Moderate', color: 'bg-yellow-100 text-yellow-700' };
  return { label: 'Heavy', color: 'bg-red-100 text-red-700' };
}

export function CapacityChart({ events }: Props) {
  const csms = TEAM.filter(m => m.role === 'csm');

  // Compute stats per CSM for the next 4 weeks
  const now = new Date();
  const cutoff = new Date(now.getTime() + 28 * 86400 * 1000);

  const stats = csms.map(csm => {
    const myEvents = events.filter(
      e => e.csmEmail === csm.email && new Date(e.startTime) <= cutoff
    );
    const totalCalls = myEvents.length;
    const totalMinutes = myEvents.reduce((sum, e) => {
      const dur = (new Date(e.endTime).getTime() - new Date(e.startTime).getTime()) / 60000;
      return sum + dur;
    }, 0);
    const totalHours = Math.round((totalMinutes / 60) * 10) / 10;
    const uncovered = myEvents.filter(e => e.needsCoverage && !e.coveredBy).length;

    // Per-week breakdown (next 4 weeks)
    const weekMap: Record<string, number> = {};
    for (let i = 0; i < 4; i++) {
      const d = new Date(now.getTime() + i * 7 * 86400 * 1000);
      weekMap[getWeekKey(d.toISOString())] = 0;
    }
    for (const e of myEvents) {
      const wk = getWeekKey(e.startTime);
      if (wk in weekMap) weekMap[wk] = (weekMap[wk] ?? 0) + 1;
    }
    const weekCounts = Object.values(weekMap);
    const maxCount = Math.max(...weekCounts, 1);

    const { label: loadLabel, color: loadColor } = getLoadLabel(totalCalls);

    return { csm, totalCalls, totalHours, uncovered, weekCounts, maxCount, loadLabel, loadColor };
  });

  const weekLabels = Array.from({ length: 4 }, (_, i) => {
    const d = new Date(now.getTime() + i * 7 * 86400 * 1000);
    return `Wk ${i + 1} (${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})`;
  });

  return (
    <div className="space-y-6">
      {stats.map(({ csm, totalCalls, totalHours, uncovered, weekCounts, maxCount, loadLabel, loadColor }) => (
        <div key={csm.email} className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div
                className={cn('h-10 w-10 rounded-full flex items-center justify-center text-white font-semibold', csm.color)}
              >
                {csm.initials}
              </div>
              <div>
                <p className="font-semibold text-gray-900">{csm.name}</p>
                <p className="text-sm text-gray-500">{csm.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', loadColor)}>{loadLabel}</span>
              <div className="text-right">
                <p className="text-xl font-bold text-gray-900">{totalCalls}</p>
                <p className="text-xs text-gray-500">calls / {totalHours}h</p>
              </div>
            </div>
          </div>

          {uncovered > 0 && (
            <div className="mb-4 text-sm text-red-700 bg-red-50 rounded-md px-3 py-1.5">
              ⚠ {uncovered} meeting{uncovered !== 1 ? 's' : ''} need{uncovered === 1 ? 's' : ''} coverage
            </div>
          )}

          {/* Mini bar chart */}
          <div className="flex items-end gap-2 h-14">
            {weekCounts.map((count, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-xs text-gray-400">{count}</span>
                <div
                  className={cn('w-full rounded-t-sm transition-all', csm.color, 'opacity-70')}
                  style={{ height: `${Math.max((count / maxCount) * 40, count > 0 ? 4 : 0)}px` }}
                />
              </div>
            ))}
          </div>
          <div className="flex gap-2 mt-1">
            {weekLabels.map((label, i) => (
              <p key={i} className="flex-1 text-center text-xs text-gray-400">{label}</p>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
