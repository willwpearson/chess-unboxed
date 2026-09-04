// In-memory sliding-window rate limiter. Single-process only — does not
// coordinate across multiple serverless instances, which is a known
// limitation acceptable for now (see docs/MULTIPLAYER_PROGRESS.md).

interface Bucket {
  hits: number[]; // timestamps (ms) within the current window
}

const buckets = new Map<string, Bucket>();

export interface RateLimitResult {
  allowed: boolean;
  retryAfterSeconds?: number;
}

export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  const bucket = buckets.get(key) ?? { hits: [] };
  bucket.hits = bucket.hits.filter((t) => now - t < windowMs);

  if (bucket.hits.length >= limit) {
    const oldestInWindow = bucket.hits[0];
    const retryAfterSeconds = Math.ceil((windowMs - (now - oldestInWindow)) / 1000);
    buckets.set(key, bucket);
    return { allowed: false, retryAfterSeconds };
  }

  bucket.hits.push(now);
  buckets.set(key, bucket);
  return { allowed: true };
}

export function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  return forwardedFor?.split(',')[0]?.trim() || realIp || 'unknown';
}
