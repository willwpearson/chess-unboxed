// Thin wrapper around Resend's HTTP API (https://resend.com) — called
// directly via fetch rather than pulling in their SDK, keeping this
// dependency-free like src/lib/rateLimit.ts and trivial to mock in tests.
// Free tier (3,000 emails/month / 100/day) is enough for this app's
// password-reset volume without adopting a paid provider.

const isDevMode = process.env.NEXT_PUBLIC_DEV_MODE === 'true';

function resolveConfig(): { apiKey: string; from: string } {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (apiKey && from) return { apiKey, from };
  if (isDevMode) return { apiKey: '', from: '' };
  throw new Error(
    'RESEND_API_KEY / EMAIL_FROM environment variables are not set. Refusing to silently skip sending email.'
  );
}

export async function sendPasswordResetEmail(to: string, resetUrl: string): Promise<void> {
  const { apiKey, from } = resolveConfig();

  if (isDevMode) {
    // Mirrors this codebase's existing dev-mode convention (e.g. devDb) of
    // never making live network/third-party calls outside a real deployment.
    console.log(`[dev-mode] Password reset link for ${to}: ${resetUrl}`);
    return;
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to,
      subject: 'Reset your password',
      html: `<p>We received a request to reset your password.</p><p><a href="${resetUrl}">Click here to reset your password</a></p><p>This link expires in 30 minutes. If you didn't request this, you can safely ignore this email.</p>`,
    }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(`Resend API error (${response.status}): ${body}`);
  }
}
