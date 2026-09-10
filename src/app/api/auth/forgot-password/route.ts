import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { z } from 'zod';
import crypto from 'crypto';
import { rateLimit, getClientIp } from '@/lib/rateLimit';
import { sendPasswordResetEmail } from '@/lib/email';

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

function genericResponse() {
  return NextResponse.json({
    success: true,
    data: { message: 'If that email exists, a reset link was sent.' },
    timestamp: Date.now(),
  });
}

const RESET_TOKEN_TTL_MS = 30 * 60 * 1000; // 30 minutes

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const { allowed, retryAfterSeconds } = rateLimit(`forgot-password:${ip}`, 5, 15 * 60 * 1000);
    if (!allowed) {
      return NextResponse.json(
        { success: false, error: 'Too many requests. Please try again later.' },
        { status: 429, headers: retryAfterSeconds ? { 'Retry-After': String(retryAfterSeconds) } : undefined }
      );
    }

    const body = await request.json();
    const { email } = forgotPasswordSchema.parse(body);

    // Per-email limit protects a specific inbox from being spammed via
    // rotating IPs. Deliberately does NOT surface a 429 here — doing so
    // would itself leak that this email is a valid, targeted account.
    // Falls through to the same generic response as every other case below.
    const { allowed: emailAllowed } = rateLimit(
      `forgot-password-email:${email.toLowerCase()}`,
      3,
      60 * 60 * 1000
    );

    if (emailAllowed) {
      const { data: user } = await supabaseAdmin
        .from('users')
        .select('id, email')
        .eq('email', email)
        .eq('is_guest', false)
        .eq('is_active', true)
        .single();

      if (user) {
        const rawToken = crypto.randomBytes(32).toString('hex');
        const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

        await supabaseAdmin.from('password_reset_tokens').insert({
          user_id: user.id,
          token_hash: tokenHash,
          expires_at: new Date(Date.now() + RESET_TOKEN_TTL_MS).toISOString(),
        });

        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        const resetUrl = `${appUrl}/reset-password?token=${rawToken}`;

        try {
          await sendPasswordResetEmail(user.email, resetUrl);
        } catch (emailError) {
          // Never let an email-delivery failure change the response shape —
          // that would leak account existence. Log for operational visibility.
          console.error('Failed to send password reset email:', emailError);
        }
      }
    }

    return genericResponse();
  } catch (error) {
    console.error('Forgot-password error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.errors[0].message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
