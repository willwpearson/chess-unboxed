import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const originalEnv = { ...process.env };

async function importEmail() {
  vi.resetModules();
  return import('./email');
}

describe('sendPasswordResetEmail', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('in dev mode, logs the link and never calls fetch', async () => {
    process.env.NEXT_PUBLIC_DEV_MODE = 'true';
    delete process.env.RESEND_API_KEY;
    delete process.env.EMAIL_FROM;
    const fetchSpy = vi.spyOn(global, 'fetch');
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    const { sendPasswordResetEmail } = await importEmail();
    await sendPasswordResetEmail('user@example.com', 'https://app.test/reset-password?token=abc');

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('user@example.com'));
  });

  it('outside dev mode, throws if RESEND_API_KEY/EMAIL_FROM are unset', async () => {
    process.env.NEXT_PUBLIC_DEV_MODE = 'false';
    delete process.env.RESEND_API_KEY;
    delete process.env.EMAIL_FROM;

    const { sendPasswordResetEmail } = await importEmail();
    await expect(
      sendPasswordResetEmail('user@example.com', 'https://app.test/reset-password?token=abc')
    ).rejects.toThrow();
  });

  it('outside dev mode, POSTs to the Resend API with the right payload', async () => {
    process.env.NEXT_PUBLIC_DEV_MODE = 'false';
    process.env.RESEND_API_KEY = 'test-key';
    process.env.EMAIL_FROM = 'noreply@example.com';

    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ id: 'email-1' }), { status: 200 })
    );

    const { sendPasswordResetEmail } = await importEmail();
    await sendPasswordResetEmail('user@example.com', 'https://app.test/reset-password?token=abc');

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [url, init] = fetchSpy.mock.calls[0];
    expect(url).toBe('https://api.resend.com/emails');
    expect(init?.headers).toMatchObject({ Authorization: 'Bearer test-key' });
    const body = JSON.parse(init?.body as string);
    expect(body.from).toBe('noreply@example.com');
    expect(body.to).toBe('user@example.com');
    expect(body.html).toContain('https://app.test/reset-password?token=abc');
  });

  it('throws when the Resend API returns a non-2xx response', async () => {
    process.env.NEXT_PUBLIC_DEV_MODE = 'false';
    process.env.RESEND_API_KEY = 'test-key';
    process.env.EMAIL_FROM = 'noreply@example.com';

    vi.spyOn(global, 'fetch').mockResolvedValue(
      new Response('bad request', { status: 400 })
    );

    const { sendPasswordResetEmail } = await importEmail();
    await expect(
      sendPasswordResetEmail('user@example.com', 'https://app.test/reset-password?token=abc')
    ).rejects.toThrow(/Resend API error/);
  });
});
