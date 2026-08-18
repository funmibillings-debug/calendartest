'use client';

import { CurrentUserProvider } from '@/contexts/current-user';

export function SessionProvider({ children }: { children: React.ReactNode }) {
  return <CurrentUserProvider>{children}</CurrentUserProvider>;
}
