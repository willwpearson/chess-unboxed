import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import crypto from 'crypto';
import { rateLimit, getClientIp } from '@/lib/rateLimit';

const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  newPassword: z.string().min(6, 'Password must be at least 6 characters'),
});

const INVALID_TOKEN_RESPONSE = { success: false, error: 'Invalid or expired reset link.' };

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const { allowed, retryAfterSeconds } = rateLimit(`reset-password:${ip}`, 10, 15 * 60 * 1000);
    if (!allowed) {
      return NextResponse.json(
        { success: false, error: 'Too many requests. Please try again later.' },
        { status: 429, headers: retryAfterSeconds ? { 'Retry-After': String(retryAfterSeconds) } : undefined }
      );
    }

    const body = await request.json();
    const { token, newPassword } = resetPasswordSchema.parse(body);

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const { data: resetToken, error: tokenError } = await supabaseAdmin
      .from('password_reset_tokens')
      .select('*')
      .eq('token_hash', tokenHash)
      .single();

    if (tokenError || !resetToken) {
      return NextResponse.json(INVALID_TOKEN_RESPONSE, { status: 400 });
    }

    if (resetToken.used_at || new Date(resetToken.expires_at) < new Date()) {
      return NextResponse.json(INVALID_TOKEN_RESPONSE, { status: 400 });
    }

    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, is_active, is_guest')
      .eq('id', resetToken.user_id)
      .single();

    if (userError || !user || !user.is_active || user.is_guest) {
      return NextResponse.json(INVALID_TOKEN_RESPONSE, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);

    await supabaseAdmin
      .from('users')
      .update({ password_hash: passwordHash })
      .eq('id', user.id);

    await supabaseAdmin
      .from('password_reset_tokens')
      .update({ used_at: new Date().toISOString() })
      .eq('id', resetToken.id);

    // A password reset is very often triggered by a compromised account —
    // revoke every existing session so a stolen cookie/JWT can't outlive it.
    await supabaseAdmin
      .from('user_sessions')
      .update({ is_active: false })
      .eq('user_id', user.id)
      .eq('is_active', true);

    return NextResponse.json({
      success: true,
      data: { message: 'Password has been reset. Please sign in.' },
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('Reset-password error:', error);

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
