import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

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
      decoded = jwt.verify(token, JWT_SECRET) as { userId: string; username: string; email: string };
    } catch (jwtError) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired token' },
        { status: 401 }
      );
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

    // Remove sensitive data from response
    const { password_hash, ...userWithoutPassword } = user;

    return NextResponse.json({
      success: true,
      data: { user: userWithoutPassword },
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