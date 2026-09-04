import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { verifyAuthToken } from '@/lib/jwt';
import { sweepAbandonedGamesForUser } from '@/lib/server/abandonment';

export async function GET(request: NextRequest) {
  try {
    // Get token from cookie or Authorization header
    const cookieToken = request.cookies.get('auth-token')?.value;
    const authHeader = request.headers.get('authorization');
    const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

    const token = cookieToken || bearerToken;

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'No authentication token provided' },
        { status: 401 }
      );
    }

    // Verify and decode token
    let decoded;
    try {
      decoded = verifyAuthToken(token);
    } catch (jwtError) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    // Confirm the session backing this token hasn't been revoked (logout,
    // admin action, etc.) — a valid JWT signature alone is not sufficient.
    const { data: sessions, error: sessionError } = await supabaseAdmin
      .from('user_sessions')
      .select('id, is_active, expires_at')
      .eq('user_id', decoded.userId)
      .eq('is_active', true);

    if (sessionError) {
      console.error('Session lookup error:', sessionError);
    } else if (sessions) {
      const now = Date.now();
      const hasValidSession = sessions.some(
        (s: any) => s.is_active && (!s.expires_at || new Date(s.expires_at).getTime() > now)
      );
      if (!hasValidSession) {
        return NextResponse.json(
          { success: false, error: 'Session has been revoked' },
          { status: 401 }
        );
      }
    }

    // Get user from database
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', decoded.userId)
      .single();

    if (error || !user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if user is still active
    if (!user.is_active) {
      return NextResponse.json(
        { success: false, error: 'Account is deactivated' },
        { status: 401 }
      );
    }

    // Update last seen
    await supabaseAdmin
      .from('users')
      .update({ last_seen: new Date().toISOString() })
      .eq('id', user.id);

    // Best-effort: sweep any of this user's own in_progress games where the
    // opponent has gone stale. Closes most of the "both players abandoned
    // simultaneously" gap (see src/lib/server/abandonment.ts) — never lets a
    // sweep failure break the /me response itself.
    try {
      await sweepAbandonedGamesForUser(user.id);
    } catch (sweepError) {
      console.error('Abandonment sweep error:', sweepError);
    }

    // Remove sensitive data from response
    const { password_hash, ...userWithoutPassword } = user;

    return NextResponse.json({
      success: true,
      data: { 
        user: userWithoutPassword,
        isGuest: decoded.isGuest || false 
      },
      timestamp: Date.now(),
    });

  } catch (error) {
    console.error('Auth me error:', error);
    
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}