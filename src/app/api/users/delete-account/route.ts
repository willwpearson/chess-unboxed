import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

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
 * DELETE /api/users/delete-account
 * Delete user account and all associated data
 */
export async function DELETE(request: NextRequest) {
  try {
    const userId = await verifyToken(request);
    const body = await request.json();
    
    const { password, confirmText } = body;

    // Validate input
    if (!password) {
      return NextResponse.json(
        { success: false, error: 'Password is required for account deletion' },
        { status: 400 }
      );
    }

    if (confirmText !== 'DELETE') {
      return NextResponse.json(
        { success: false, error: 'Please type DELETE to confirm account deletion' },
        { status: 400 }
      );
    }

    const supabase = createClient();

    // Get current user data
    const { data: user, error: fetchError } = await supabase
      .from('users')
      .select('password_hash, email, username')
      .eq('id', userId)
      .single();

    if (fetchError || !user) {
      console.error('Database error:', fetchError);
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    
    if (!isPasswordValid) {
      return NextResponse.json(
        { success: false, error: 'Incorrect password' },
        { status: 400 }
      );
    }

    // Begin transaction - delete all related data
    try {
      // Delete user sessions first
      await supabase
        .from('user_sessions')
        .delete()
        .eq('user_id', userId);

      // Delete games where user participated
      await supabase
        .from('games')
        .delete()
        .or(`white_player_id.eq.${userId},black_player_id.eq.${userId}`);

      // Delete user profile data, friends, messages, etc.
      // Note: Add more deletion queries as your schema grows
      
      // Finally, delete the user
      const { error: deleteError } = await supabase
        .from('users')
        .delete()
        .eq('id', userId);

      if (deleteError) {
        console.error('Database error during deletion:', deleteError);
        return NextResponse.json(
          { success: false, error: 'Failed to delete account' },
          { status: 500 }
        );
      }

      // Clear the auth cookie
      const response = NextResponse.json({
        success: true,
        message: 'Account deleted successfully',
        timestamp: Date.now(),
      });

      response.cookies.set('auth-token', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 0, // Delete the cookie
        path: '/',
      });

      return response;

    } catch (transactionError) {
      console.error('Transaction error during account deletion:', transactionError);
      return NextResponse.json(
        { success: false, error: 'Failed to delete account completely' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Account deletion error:', error);
    
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