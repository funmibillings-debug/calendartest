'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

export interface CurrentUser {
  email: string;
  name: string;
}

interface CurrentUserContextValue {
  user: CurrentUser | null;
  setUser: (user: CurrentUser | null) => void;
  ready: boolean;
}

const STORAGE_KEY = 'csm_hub_user';

const CurrentUserContext = createContext<CurrentUserContextValue>({
  user: null,
  setUser: () => {},
  ready: false,
});

export function CurrentUserProvider({ children }: { children: ReactNode }) {
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

  return (
    <CurrentUserContext.Provider value={{ user, setUser, ready }}>
      {children}
    </CurrentUserContext.Provider>
  );
}

export function useCurrentUser() {
  return useContext(CurrentUserContext);
}
