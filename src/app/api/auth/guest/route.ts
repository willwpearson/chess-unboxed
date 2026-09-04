import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { nanoid } from 'nanoid';
import { signAuthToken } from '@/lib/jwt';
import { rateLimit, getClientIp } from '@/lib/rateLimit';

interface CreateGuestUserRequest {
  username?: string;
}

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const { allowed, retryAfterSeconds } = rateLimit(`guest:${ip}`, 10, 60 * 60 * 1000);
    if (!allowed) {
      return NextResponse.json(
        { success: false, error: 'Too many guest accounts created. Please try again later.' },
        { status: 429, headers: retryAfterSeconds ? { 'Retry-After': String(retryAfterSeconds) } : undefined }
      );
    }

    const body = await request.json().catch(() => ({})) as CreateGuestUserRequest;

    // Generate guest username if not provided
    const guestUsername = body.username || `Guest_${nanoid(8)}`;

    // Create guest user in database
    const { data: user, error: insertError } = await supabaseAdmin
      .from('users')
      .insert({
        username: guestUsername,
        display_name: guestUsername,
        email: null, // Guests don't have email
        is_verified: false,
        is_active: true,
        is_guest: true, // Mark as guest user
        profile_visibility: 'public',
        allow_friend_requests: false, // Guests can't have friends by default
        show_online_status: true,
        password_hash: null, // No password for guests
        last_seen: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      console.error('Failed to create guest user:', insertError);
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to create guest account' 
      }, { status: 500 });
    }

    if (!user) {
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to create guest user' 
      }, { status: 500 });
    }

    // Per-time-control user_ratings rows are created lazily, only when a
    // ranked game actually completes (see src/lib/server/applyGameResult.ts)
    // — guests aren't eligible for ranked anyway (see
    // src/app/api/matchmaking/join/route.ts), so there's nothing to seed here.

    // Generate JWT token for guest session
    const token = signAuthToken({
      userId: user.id,
      username: user.username,
      isGuest: true,
    });

    // Create session record
    const { error: sessionError } = await supabaseAdmin
      .from('user_sessions')
      .insert({
        user_id: user.id,
        device_info: {},
        ip_address: request.headers.get('x-forwarded-for') || 
                   request.headers.get('x-real-ip') || 
                   'unknown',
        user_agent: request.headers.get('user-agent') || 'unknown',
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
        is_active: true,
      });

    if (sessionError) {
      console.error('Failed to create guest session:', sessionError);
      // Continue anyway - session tracking is not critical for guests
    }

    // Create response with HTTP-only cookie
    const response = NextResponse.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          display_name: user.display_name,
          bio: user.bio,
          avatar_url: user.avatar_url,
          country: user.country,
          website: null,
          current_rating: 1200, // Default rating for new guests
          peak_rating: 1200,
          total_games: 0,
          wins: 0,
          losses: 0,
          draws: 0,
          is_verified: user.is_verified,
          created_at: user.created_at,
          last_seen: user.last_seen,
        },
        isGuest: true,
      }
    });

    // Set HTTP-only cookie for authentication
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
      path: '/',
    });

    return response;

  } catch (error) {
    console.error('Guest access error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}