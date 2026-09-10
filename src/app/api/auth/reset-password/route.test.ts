import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import crypto from 'crypto';
import { createSupabaseAdminMock, ok, fail } from '@/lib/supabase.test-utils';

const supabaseAdminMock = createSupabaseAdminMock();
vi.mock('@/lib/supabase', () => ({ supabaseAdmin: supabaseAdminMock }));

vi.mock('@/lib/rateLimit', () => ({
  rateLimit: vi.fn(() => ({ allowed: true })),
  getClientIp: vi.fn(() => 'test-ip'),
}));

const { POST } = await import('./route');
const { rateLimit } = await import('@/lib/rateLimit');

function resetPasswordRequest(body: unknown) {
  return new NextRequest('http://localhost/api/auth/reset-password', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function hashOf(token: string) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function tokenRow(overrides: Record<string, any> = {}) {
  return {
    id: 'token-1',
    user_id: 'user-1',
    token_hash: hashOf('valid-token'),
    expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    used_at: null,
    ...overrides,
  };
}

describe('POST /api/auth/reset-password', () => {
  beforeEach(() => {
    supabaseAdminMock.reset();
    vi.mocked(rateLimit).mockReturnValue({ allowed: true });
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('returns 429 once the caller has exceeded the rate limit', async () => {
    vi.mocked(rateLimit).mockReturnValue({ allowed: false, retryAfterSeconds: 10 });
    const res = await POST(resetPasswordRequest({ token: 'x', newPassword: 'newpassword' }));
    expect(res.status).toBe(429);
  });

  it('rejects a too-short password', async () => {
    const res = await POST(resetPasswordRequest({ token: 'x', newPassword: 'short' }));
    expect(res.status).toBe(400);
  });

  it('rejects an unknown token', async () => {
    supabaseAdminMock.queueResult(fail('not found'));
    const res = await POST(resetPasswordRequest({ token: 'bogus-token', newPassword: 'newpassword' }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/invalid or expired/i);
  });

  it('rejects an expired token', async () => {
    supabaseAdminMock.queueResult(
      ok(tokenRow({ expires_at: new Date(Date.now() - 60 * 1000).toISOString() }))
    );
    const res = await POST(resetPasswordRequest({ token: 'valid-token', newPassword: 'newpassword' }));
    expect(res.status).toBe(400);
  });

  it('rejects an already-used token', async () => {
    supabaseAdminMock.queueResult(ok(tokenRow({ used_at: new Date().toISOString() })));
    const res = await POST(resetPasswordRequest({ token: 'valid-token', newPassword: 'newpassword' }));
    expect(res.status).toBe(400);
  });

  it('rejects a token whose user is inactive or a guest', async () => {
    supabaseAdminMock.queueResults([
      ok(tokenRow()),
      ok({ id: 'user-1', is_active: false, is_guest: false }),
    ]);
    const res = await POST(resetPasswordRequest({ token: 'valid-token', newPassword: 'newpassword' }));
    expect(res.status).toBe(400);
  });

  it('resets the password, marks the token used, and deactivates sessions on success', async () => {
    supabaseAdminMock.queueResults([
      ok(tokenRow()), // token lookup
      ok({ id: 'user-1', is_active: true, is_guest: false }), // user lookup
      ok(null), // password_hash update
      ok(null), // mark token used
      ok(null), // deactivate sessions
    ]);

    const res = await POST(resetPasswordRequest({ token: 'valid-token', newPassword: 'newpassword' }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(res.cookies.get('auth-token')).toBeUndefined();
  });
});
