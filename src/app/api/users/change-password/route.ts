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
 * POST /api/users/change-password
 * Change user password
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await verifyToken(request);
    const body = await request.json();
    
    const { currentPassword, newPassword } = body;

    // Validate input
    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { success: false, error: 'Current password and new password are required' },
        { status: 400 }
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { success: false, error: 'New password must be at least 8 characters long' },
        { status: 400 }
      );
    }

    const supabase = createClient();

    // Get current user data
    const { data: user, error: fetchError } = await supabase
      .from('users')
      .select('password_hash')
      .eq('id', userId)
      .single();

    if (fetchError || !user) {
      console.error('Database error:', fetchError);
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password_hash);
    
    if (!isCurrentPasswordValid) {
      return NextResponse.json(
        { success: false, error: 'Current password is incorrect' },
        { status: 400 }
      );
    }

    // Hash new password
    const saltRounds = 12;
    const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

    // Update password in database
    const { error: updateError } = await supabase
      .from('users')
      .update({ 
        password_hash: newPasswordHash,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (updateError) {
      console.error('Database error:', updateError);
      return NextResponse.json(
        { success: false, error: 'Failed to update password' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Password updated successfully',
      timestamp: Date.now(),
    });

  } catch (error) {
    console.error('Password change error:', error);
    
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