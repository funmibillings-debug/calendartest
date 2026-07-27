'use client';

import { getMemberByEmail } from '@/lib/team';
import { cn } from '@/lib/utils';

interface Props {
  email: string;
  size?: 'sm' | 'md' | 'lg';
  showName?: boolean;
}

const sizeClass = { sm: 'h-6 w-6 text-xs', md: 'h-8 w-8 text-sm', lg: 'h-10 w-10 text-base' };

export function CSMAvatar({ email, size = 'md', showName = false }: Props) {
  const member = getMemberByEmail(email);
  const initials = member?.initials ?? email[0].toUpperCase();
  const color = member?.color ?? 'bg-gray-500';
  const name = member?.name ?? email;

  return (
    <div className="flex items-center gap-2">
      <div
        className={cn(
          'rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0',
          sizeClass[size],
          color
        )}
        title={name}
      >
        {initials}
      </div>
      {showName && <span className="text-sm font-medium text-gray-700">{name}</span>}
    </div>
  );
}
