'use client';

import { useState, useEffect, useCallback } from 'react';
import { TEAM } from '@/lib/team';

export interface CurrentUser {
  email: string;
  name: string;
}

const STORAGE_KEY = 'csm_hub_user';

export function useCurrentUser() {
  const [user, setUserState] = useState<CurrentUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setUserState(JSON.parse(stored));
    } catch {}
    setReady(true);
  }, []);

  const setUser = useCallback((next: CurrentUser | null) => {
    setUserState(next);
    if (next) localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    else localStorage.removeItem(STORAGE_KEY);
  }, []);

  return { user, setUser, ready };
}

export { TEAM };
