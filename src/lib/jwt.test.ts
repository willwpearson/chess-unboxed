import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const ORIGINAL_ENV = { ...process.env };

describe('jwt', () => {
  beforeEach(() => {
    vi.resetModules();
    process.env = { ...ORIGINAL_ENV, JWT_SECRET: 'test-jwt-secret-do-not-use-in-production' };
  });

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
  });

  it('round-trips a signed token', async () => {
    const { signAuthToken, verifyAuthToken } = await import('./jwt');
    const token = signAuthToken({ userId: 'u1', username: 'alice', email: 'a@example.com' });
    const payload = verifyAuthToken(token);
    expect(payload.userId).toBe('u1');
    expect(payload.username).toBe('alice');
    expect(payload.email).toBe('a@example.com');
  });

  it('throws on an invalid token', async () => {
    const { verifyAuthToken } = await import('./jwt');
    expect(() => verifyAuthToken('not-a-real-token')).toThrow();
  });

  it('throws when a token is verified against a different secret', async () => {
    const { signAuthToken } = await import('./jwt');
    const token = signAuthToken({ userId: 'u1', username: 'alice' });

    vi.resetModules();
    process.env = { ...ORIGINAL_ENV, JWT_SECRET: 'a-completely-different-secret' };
    const { verifyAuthToken } = await import('./jwt');

    expect(() => verifyAuthToken(token)).toThrow();
  });

  it('falls back to the insecure dev secret in dev mode when JWT_SECRET is unset', async () => {
    vi.resetModules();
    process.env = { ...ORIGINAL_ENV, JWT_SECRET: undefined, NEXT_PUBLIC_DEV_MODE: 'true' };
    const { JWT_SECRET } = await import('./jwt');
    expect(JWT_SECRET).toBe('dev-mode-insecure-secret-do-not-use-in-production');
  });

  it('throws at import time when JWT_SECRET is unset outside dev mode', async () => {
    vi.resetModules();
    process.env = { ...ORIGINAL_ENV, JWT_SECRET: undefined, NEXT_PUBLIC_DEV_MODE: 'false' };
    await expect(import('./jwt')).rejects.toThrow(/JWT_SECRET/);
  });
});
