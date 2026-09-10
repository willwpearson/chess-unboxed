import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getClientIp, rateLimit } from './rateLimit';

describe('rateLimit', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(0);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('allows requests under the limit', () => {
    const key = `test-${Math.random()}`;
    expect(rateLimit(key, 3, 1000).allowed).toBe(true);
    expect(rateLimit(key, 3, 1000).allowed).toBe(true);
    expect(rateLimit(key, 3, 1000).allowed).toBe(true);
  });

  it('denies requests once the limit is reached within the window', () => {
    const key = `test-${Math.random()}`;
    rateLimit(key, 2, 1000);
    rateLimit(key, 2, 1000);
    const result = rateLimit(key, 2, 1000);
    expect(result.allowed).toBe(false);
    expect(result.retryAfterSeconds).toBeGreaterThan(0);
  });

  it('allows requests again once the window has fully elapsed', () => {
    const key = `test-${Math.random()}`;
    rateLimit(key, 1, 1000);
    expect(rateLimit(key, 1, 1000).allowed).toBe(false);

    vi.setSystemTime(1001);
    expect(rateLimit(key, 1, 1000).allowed).toBe(true);
  });

  it('tracks separate buckets per key', () => {
    const keyA = `a-${Math.random()}`;
    const keyB = `b-${Math.random()}`;
    rateLimit(keyA, 1, 1000);
    expect(rateLimit(keyA, 1, 1000).allowed).toBe(false);
    expect(rateLimit(keyB, 1, 1000).allowed).toBe(true);
  });
});

describe('getClientIp', () => {
  function requestWithHeaders(headers: Record<string, string>): Request {
    return new Request('http://localhost', { headers });
  }

  it('prefers the first entry of x-forwarded-for', () => {
    const req = requestWithHeaders({ 'x-forwarded-for': '1.2.3.4, 5.6.7.8' });
    expect(getClientIp(req)).toBe('1.2.3.4');
  });

  it('falls back to x-real-ip when x-forwarded-for is absent', () => {
    const req = requestWithHeaders({ 'x-real-ip': '9.9.9.9' });
    expect(getClientIp(req)).toBe('9.9.9.9');
  });

  it('falls back to "unknown" when no IP headers are present', () => {
    const req = requestWithHeaders({});
    expect(getClientIp(req)).toBe('unknown');
  });
});
