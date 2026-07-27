import { Redis } from '@upstash/redis';

let _redis: Redis | null = null;

function getRedis(): Redis {
  if (!_redis) {
    _redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    });
  }
  return _redis;
}

export const redis = new Proxy({} as Redis, {
  get(_target, prop) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (getRedis() as any)[prop];
  },
});

export const keys = {
  calendarCache: (email: string) => `calendar:${email}`,
  oooCache: (email: string) => `ooo:${email}`,
  manualUnavailable: (email: string) => `unavailable:${email}`,
  coverage: (eventId: string) => `coverage:${eventId}`,
};
