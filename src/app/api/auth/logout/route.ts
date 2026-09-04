import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { verifyAuthToken } from '@/lib/jwt';

export async function POST(request: NextRequest) {
  try {
    // Get token from cookie
    const token = request.cookies.get('auth-token')?.value;

    if (token) {
      try {
        // Decode token to get user info
        const decoded = verifyAuthToken(token);

        // Deactivate user sessions
        await supabaseAdmin
          .from('user_sessions')
          .update({ is_active: false })
          .eq('user_id', decoded.userId);

      } catch (jwtError) {
        // Token is invalid, but we'll still clear the cookie
        console.log('Invalid token during logout:', jwtError);
      }
    }

    const response = NextResponse.json({
      success: true,
      data: { message: 'Logged out successfully' },
      timestamp: Date.now(),
    });

    // Clear the auth cookie
    response.cookies.set('auth-token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/',
    });

    return response;

  } catch (error) {
    console.error('Logout error:', error);
    
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}