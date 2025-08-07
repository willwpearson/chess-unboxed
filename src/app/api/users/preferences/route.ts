import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';
import jwt from 'jsonwebtoken';
import { UserPreferences } from '@/types/game';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Helper function to verify JWT token
async function verifyToken(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    
    if (!token) {
      throw new Error('No token provided');
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    return decoded.userId;
  } catch (error) {
    throw new Error('Invalid token');
  }
}

/**
 * GET /api/users/preferences
 * Get user preferences
 */
export async function GET(request: NextRequest) {
  try {
    const userId = await verifyToken(request);
    const supabase = createClient();

    // Get user preferences from database
    const { data: user, error } = await supabase
      .from('users')
      .select('preferences')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch preferences' },
        { status: 500 }
      );
    }

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Return preferences or defaults
    const defaultPreferences: UserPreferences = {
      theme: 'light',
      language: 'en',
      timezone: 'UTC',
      dateFormat: 'MM/DD/YYYY',
      boardTheme: 'classic',
      pieceSet: 'classic',
      showCoordinates: true,
      showPossibleMoves: true,
      moveAnimationSpeed: 'normal',
      soundEnabled: true,
      autoQueen: true,
      emailNotifications: {
        gameInvites: true,
        friendRequests: true,
        tournaments: true,
        dailyPuzzles: false,
        weeklyDigest: true,
      },
      pushNotifications: {
        moves: true,
        gameStart: true,
        gameEnd: true,
        friendActivity: false,
      },
      profileVisibility: 'public',
      showOnlineStatus: true,
      allowFriendRequests: true,
      showGameHistory: true,
      showRatingHistory: true,
    };

    const preferences = user.preferences || defaultPreferences;

    return NextResponse.json({
      success: true,
      data: { preferences },
      timestamp: Date.now(),
    });

  } catch (error) {
    console.error('Preferences fetch error:', error);
    
    if (error instanceof Error && error.message === 'Invalid token') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/users/preferences
 * Update user preferences
 */
export async function PUT(request: NextRequest) {
  try {
    const userId = await verifyToken(request);
    const body = await request.json();
    
    // Validate preferences structure
    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { success: false, error: 'Invalid preferences data' },
        { status: 400 }
      );
    }

    const supabase = createClient();

    // Update user preferences in database
    const { data, error } = await supabase
      .from('users')
      .update({ 
        preferences: body,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select('preferences')
      .single();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to update preferences' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { preferences: data.preferences },
      timestamp: Date.now(),
    });

  } catch (error) {
    console.error('Preferences update error:', error);
    
    if (error instanceof Error && error.message === 'Invalid token') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}