import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { createSupabaseAdminMock, ok } from '@/lib/supabase.test-utils';

const supabaseAdminMock = createSupabaseAdminMock();
vi.mock('@/lib/supabase', () => ({ supabaseAdmin: supabaseAdminMock }));

vi.mock('@/lib/rateLimit', () => ({
  rateLimit: vi.fn(() => ({ allowed: true })),
  getClientIp: vi.fn(() => 'test-ip'),
}));

const { POST } = await import('./route');
const { rateLimit } = await import('@/lib/rateLimit');

function registerRequest(body: unknown) {
  return new NextRequest('http://localhost/api/auth/register', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

const validPayload = { email: 'alice@example.com', username: 'alice123', password: 'hunter22' };

describe('POST /api/auth/register', () => {
  beforeEach(() => {
    supabaseAdminMock.reset();
    vi.mocked(rateLimit).mockReturnValue({ allowed: true });
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('returns 429 once the caller has exceeded the registration rate limit', async () => {
    vi.mocked(rateLimit).mockReturnValue({ allowed: false, retryAfterSeconds: 10 });
    const res = await POST(registerRequest(validPayload));
    expect(res.status).toBe(429);
  });

  it('rejects an invalid email', async () => {
    const res = await POST(registerRequest({ ...validPayload, email: 'not-an-email' }));
    expect(res.status).toBe(400);
  });

  it('rejects a too-short password', async () => {
    const res = await POST(registerRequest({ ...validPayload, password: '123' }));
    expect(res.status).toBe(400);
  });

  it('rejects a duplicate email/username', async () => {
    supabaseAdminMock.queueResult(ok({ id: 'existing-user' }));
    const res = await POST(registerRequest(validPayload));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/already exists/i);
  });

  it('creates a new user and never returns the password hash', async () => {
    supabaseAdminMock.queueResults([
      { data: null, error: null }, // no existing user
      ok({
        id: 'new-user',
        email: validPayload.email,
        username: validPayload.username,
        password_hash: 'hashed',
      }),
    ]);

    const res = await POST(registerRequest(validPayload));
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.user.username).toBe(validPayload.username);
    expect(body.data.user.password_hash).toBeUndefined();
  });

  it('returns 500 when user creation fails', async () => {
    supabaseAdminMock.queueResults([
      { data: null, error: null },
      { data: null, error: { message: 'insert failed' } },
    ]);

    const res = await POST(registerRequest(validPayload));
    expect(res.status).toBe(500);
  });
});
