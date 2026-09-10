import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import { createSupabaseAdminMock, ok } from '@/lib/supabase.test-utils';

const supabaseAdminMock = createSupabaseAdminMock();
vi.mock('@/lib/supabase', () => ({ supabaseAdmin: supabaseAdminMock }));

// rateLimit is an in-memory module-level singleton shared across every test
// in this file (keyed by client IP, which is constant here); mock it out so
// test count/order can never brush up against its 5-attempts/15min ceiling.
vi.mock('@/lib/rateLimit', () => ({
  rateLimit: vi.fn(() => ({ allowed: true })),
  getClientIp: vi.fn(() => 'test-ip'),
}));

const { POST } = await import('./route');
const { rateLimit } = await import('@/lib/rateLimit');

function loginRequest(body: unknown) {
  return new NextRequest('http://localhost/api/auth/login', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

async function userRow(overrides: Record<string, any> = {}) {
  return {
    id: 'user-1',
    username: 'alice',
    email: 'alice@example.com',
    password_hash: await bcrypt.hash('correct-password', 4),
    is_active: true,
    ...overrides,
  };
}

describe('POST /api/auth/login', () => {
  beforeEach(() => {
    supabaseAdminMock.reset();
    vi.mocked(rateLimit).mockReturnValue({ allowed: true });
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('returns 429 once the caller has exceeded the login rate limit', async () => {
    vi.mocked(rateLimit).mockReturnValue({ allowed: false, retryAfterSeconds: 42 });
    const res = await POST(loginRequest({ identifier: 'alice', password: 'x' }));
    expect(res.status).toBe(429);
    expect(res.headers.get('Retry-After')).toBe('42');
  });

  it('rejects a malformed body', async () => {
    const res = await POST(loginRequest({ identifier: '' }));
    expect(res.status).toBe(400);
  });

  it('rejects an unknown identifier', async () => {
    supabaseAdminMock.queueResult({ data: null, error: { message: 'not found' } });
    const res = await POST(loginRequest({ identifier: 'nobody', password: 'whatever' }));
    expect(res.status).toBe(401);
  });

  it('rejects a deactivated account', async () => {
    supabaseAdminMock.queueResult(ok(await userRow({ is_active: false })));
    const res = await POST(loginRequest({ identifier: 'alice', password: 'correct-password' }));
    expect(res.status).toBe(401);
  });

  it('rejects an incorrect password', async () => {
    supabaseAdminMock.queueResult(ok(await userRow()));
    const res = await POST(loginRequest({ identifier: 'alice', password: 'wrong-password' }));
    expect(res.status).toBe(401);
  });

  it('logs in successfully with the correct password, sets a cookie, and never returns the password hash', async () => {
    supabaseAdminMock.queueResults([
      ok(await userRow()), // user lookup
      ok(null), // last_seen update
      ok(null), // session insert
    ]);

    const res = await POST(loginRequest({ identifier: 'alice', password: 'correct-password' }));
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.user.password_hash).toBeUndefined();
    expect(typeof body.data.token).toBe('string');
    expect(res.cookies.get('auth-token')?.value).toBe(body.data.token);
  });
});
