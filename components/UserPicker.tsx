'use client';

import { useState } from 'react';
import { TEAM } from '@/lib/team';
import { useCurrentUser, CurrentUser } from '@/hooks/useCurrentUser';
import { CSMAvatar } from './CSMAvatar';

export function UserPicker() {
  const { user, setUser } = useCurrentUser();
  const [open, setOpen] = useState(false);

  function select(member: CurrentUser) {
    setUser(member);
    setOpen(false);
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 text-sm text-gray-300 hover:text-white transition-colors"
      >
        {user ? (
          <>
            <CSMAvatar email={user.email} size="sm" />
            <span className="hidden sm:block">{user.name.split(' ')[0]}</span>
          </>
        ) : (
          <span className="text-xs border border-gray-600 rounded-md px-2 py-1 hover:border-gray-400">
            Who are you? ▾
          </span>
        )}
        {user && <span className="text-xs text-gray-500">▾</span>}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-9 z-50 bg-gray-800 border border-gray-700 rounded-xl shadow-xl w-52 py-1 overflow-hidden">
            <p className="px-3 py-2 text-xs text-gray-400 font-medium uppercase tracking-wide">
              Select yourself
            </p>
            {TEAM.map(member => (
              <button
                key={member.email}
                onClick={() => select({ email: member.email, name: member.name })}
                className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-gray-700 transition-colors ${
                  user?.email === member.email ? 'bg-gray-700 text-white' : 'text-gray-300'
                }`}
              >
                <CSMAvatar email={member.email} size="sm" />
                <div>
                  <p className="font-medium leading-none">{member.name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{member.role.toUpperCase()}</p>
                </div>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
