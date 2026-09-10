import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { createSupabaseAdminMock, ok, fail } from '@/lib/supabase.test-utils';

const supabaseAdminMock = createSupabaseAdminMock();
vi.mock('@/lib/supabase', () => ({ supabaseAdmin: supabaseAdminMock }));

vi.mock('@/lib/rateLimit', () => ({
  rateLimit: vi.fn(() => ({ allowed: true })),
  getClientIp: vi.fn(() => 'test-ip'),
}));

const sendPasswordResetEmail = vi.fn();
vi.mock('@/lib/email', () => ({ sendPasswordResetEmail: (...args: unknown[]) => sendPasswordResetEmail(...args) }));

const { POST } = await import('./route');
const { rateLimit } = await import('@/lib/rateLimit');

function forgotPasswordRequest(body: unknown) {
  return new NextRequest('http://localhost/api/auth/forgot-password', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/auth/forgot-password', () => {
  beforeEach(() => {
    supabaseAdminMock.reset();
    sendPasswordResetEmail.mockReset();
    vi.mocked(rateLimit).mockReturnValue({ allowed: true });
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('returns 429 once the caller has exceeded the per-IP rate limit', async () => {
    vi.mocked(rateLimit).mockReturnValue({ allowed: false, retryAfterSeconds: 42 });
    const res = await POST(forgotPasswordRequest({ email: 'user@example.com' }));
    expect(res.status).toBe(429);
    expect(res.headers.get('Retry-After')).toBe('42');
    expect(sendPasswordResetEmail).not.toHaveBeenCalled();
  });

  it('rejects a malformed email', async () => {
    const res = await POST(forgotPasswordRequest({ email: 'not-an-email' }));
    expect(res.status).toBe(400);
  });

  it('returns the generic success message for an unknown email, without sending anything', async () => {
    supabaseAdminMock.queueResult(fail('not found'));
    const res = await POST(forgotPasswordRequest({ email: 'nobody@example.com' }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(sendPasswordResetEmail).not.toHaveBeenCalled();
  });

  it('returns the generic success message and sends an email for a real active, non-guest account', async () => {
    supabaseAdminMock.queueResults([
      ok({ id: 'user-1', email: 'user@example.com' }), // user lookup
      ok(null), // token insert
    ]);

    const res = await POST(forgotPasswordRequest({ email: 'user@example.com' }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.message).toMatch(/if that email exists/i);
    // The response must never confirm the account exists or leak the token.
    expect(JSON.stringify(body)).not.toContain('user-1');

    expect(sendPasswordResetEmail).toHaveBeenCalledTimes(1);
    const [to, resetUrl] = sendPasswordResetEmail.mock.calls[0];
    expect(to).toBe('user@example.com');
    expect(resetUrl).toContain('/reset-password?token=');
  });

  it('does not fail the request if sending the email throws', async () => {
    supabaseAdminMock.queueResults([
      ok({ id: 'user-1', email: 'user@example.com' }),
      ok(null),
    ]);
    sendPasswordResetEmail.mockRejectedValue(new Error('Resend is down'));

    const res = await POST(forgotPasswordRequest({ email: 'user@example.com' }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });
});
