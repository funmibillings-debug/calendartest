export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { findAccountForEvent } from '@/lib/salesforce';
import { redis } from '@/lib/redis';

const CACHE_TTL = 3600; // 1 hour

export async function POST(req: NextRequest) {
  const { emails } = await req.json();
  if (!Array.isArray(emails) || emails.length === 0) {
    return NextResponse.json({ account: null });
  }

  const cacheKey = `sf:${emails.sort().join(',')}`;
  const cached = await redis.get(cacheKey);
  if (cached !== null) return NextResponse.json({ account: cached });

  const account = await findAccountForEvent(emails);
  await redis.set(cacheKey, account, { ex: CACHE_TTL });
  return NextResponse.json({ account });
}
