import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

interface JWTPayload {
  userId: string;
  email: string;
  username: string;
  iat: number;
  exp: number;
}

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';

// Avatar upload configuration
const AVATAR_MAX_SIZE = 5 * 1024 * 1024; // 5MB
const AVATAR_ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

// Helper function to verify JWT and get user
async function getAuthenticatedUser(request: NextRequest): Promise<{ userId: string; error?: string }> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token')?.value;

    if (!token) {
      return { userId: '', error: 'No authentication token found' };
    }

    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    
    if (!decoded.userId) {
      return { userId: '', error: 'Invalid token payload' };
    }

    return { userId: decoded.userId };
  } catch (error) {
    console.error('JWT verification error:', error);
    return { userId: '', error: 'Invalid or expired token' };
  }
}

// Helper function to validate profile data
function validateProfileData(data: any): { isValid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};

  // Username validation
  if (!data.username || typeof data.username !== 'string') {
    errors.username = 'Username is required';
  } else if (data.username.length < 3) {
    errors.username = 'Username must be at least 3 characters';
  } else if (data.username.length > 20) {
    errors.username = 'Username must be less than 20 characters';
  } else if (!/^[a-zA-Z0-9_-]+$/.test(data.username)) {
    errors.username = 'Username can only contain letters, numbers, underscores, and hyphens';
  }

  // Display name validation
  if (!data.display_name || typeof data.display_name !== 'string') {
    errors.display_name = 'Display name is required';
  } else if (data.display_name.length < 2) {
    errors.display_name = 'Display name must be at least 2 characters';
  } else if (data.display_name.length > 50) {
    errors.display_name = 'Display name must be less than 50 characters';
  }

  // Bio validation (optional)
  if (data.bio && typeof data.bio === 'string' && data.bio.length > 500) {
    errors.bio = 'Bio must be less than 500 characters';
  }

  // Country validation (optional)
  if (data.country && typeof data.country === 'string' && data.country.length > 100) {
    errors.country = 'Country must be less than 100 characters';
  }

  // Website validation (optional)
  if (data.website && typeof data.website === 'string') {
    if (data.website.length > 200) {
      errors.website = 'Website URL must be less than 200 characters';
    } else if (data.website.length > 0) {
      try {
        new URL(data.website);
      } catch {
        errors.website = 'Please enter a valid website URL';
      }
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

// Helper function to upload avatar to Supabase Storage
async function uploadAvatar(file: File, userId: string): Promise<{ url?: string; error?: string }> {
  try {
    // Generate unique filename
    const fileExtension = file.name.split('.').pop();
    const fileName = `${userId}_${Date.now()}.${fileExtension}`;
    
    // Convert File to ArrayBuffer for Supabase
    const arrayBuffer = await file.arrayBuffer();
    const fileBuffer = new Uint8Array(arrayBuffer);

    // Upload to Supabase Storage
    const { data, error } = await supabaseAdmin.storage
      .from('avatars')
      .upload(fileName, fileBuffer, {
        contentType: file.type,
        upsert: true
      });

    if (error) {
      console.error('Avatar upload error:', error);
      return { error: 'Failed to upload avatar' };
    }

    // Get public URL
    const { data: urlData } = supabaseAdmin.storage
      .from('avatars')
      .getPublicUrl(fileName);

    return { url: urlData.publicUrl };
  } catch (error) {
    console.error('Avatar upload error:', error);
    return { error: 'Failed to upload avatar' };
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Authenticate user
    const { userId, error: authError } = await getAuthenticatedUser(request);
    if (authError || !userId) {
      return NextResponse.json(
        { success: false, error: authError || 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse form data
    const formData = await request.formData();
    
    // Extract profile data
    const profileData = {
      username: formData.get('username') as string,
      display_name: formData.get('display_name') as string,
      bio: (formData.get('bio') as string) || '',
      country: (formData.get('country') as string) || '',
      website: (formData.get('website') as string) || '',
    };

    // Validate profile data
    const validation = validateProfileData(profileData);
    if (!validation.isValid) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', errors: validation.errors },
        { status: 400 }
      );
    }

    // Check if username is already taken (if changed)
    const { data: currentUser } = await supabaseAdmin
      .from('users')
      .select('username')
      .eq('id', userId)
      .single();

    if (profileData.username !== currentUser?.username) {
      const { data: existingUser } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('username', profileData.username)
        .neq('id', userId)
        .single();

      if (existingUser) {
        return NextResponse.json(
          { success: false, error: 'Username is already taken' },
          { status: 409 }
        );
      }
    }

    // Handle avatar upload if provided
    let avatarUrl: string | undefined;
    const avatarFile = formData.get('avatar') as File;
    
    if (avatarFile && avatarFile.size > 0) {
      // Validate avatar file
      if (avatarFile.size > AVATAR_MAX_SIZE) {
        return NextResponse.json(
          { success: false, error: 'Avatar file size must be less than 5MB' },
          { status: 400 }
        );
      }

      if (!AVATAR_ALLOWED_TYPES.includes(avatarFile.type)) {
        return NextResponse.json(
          { success: false, error: 'Avatar must be a JPEG, PNG, WebP, or GIF image' },
          { status: 400 }
        );
      }

      // Upload avatar
      const uploadResult = await uploadAvatar(avatarFile, userId);
      if (uploadResult.error) {
        return NextResponse.json(
          { success: false, error: uploadResult.error },
          { status: 500 }
        );
      }

      avatarUrl = uploadResult.url;
    }

    // Update user profile in database
    const updateData: any = {
      username: profileData.username,
      display_name: profileData.display_name,
      bio: profileData.bio || null,
      country: profileData.country || null,
      website: profileData.website || null,
      updated_at: new Date().toISOString(),
    };

    if (avatarUrl) {
      updateData.avatar_url = avatarUrl;
    }

    const { data: updatedUser, error: updateError } = await supabaseAdmin
      .from('users')
      .update(updateData)
      .eq('id', userId)
      .select(`
        id, email, username, display_name, bio, avatar_url, country, website,
        current_rating, peak_rating, total_games, wins, losses, draws,
        is_verified, created_at, last_seen
      `)
      .single();

    if (updateError) {
      console.error('Profile update error:', updateError);
      return NextResponse.json(
        { success: false, error: 'Failed to update profile' },
        { status: 500 }
      );
    }

    // Format the response to match User interface
    const formattedUser = {
      id: updatedUser.id,
      email: updatedUser.email,
      username: updatedUser.username,
      display_name: updatedUser.display_name || updatedUser.username,
      bio: updatedUser.bio,
      avatar_url: updatedUser.avatar_url,
      country: updatedUser.country,
      website: updatedUser.website,
      current_rating: updatedUser.current_rating || 1200,
      peak_rating: updatedUser.peak_rating || updatedUser.current_rating || 1200,
      total_games: updatedUser.total_games || 0,
      wins: updatedUser.wins || 0,
      losses: updatedUser.losses || 0,
      draws: updatedUser.draws || 0,
      is_verified: Boolean(updatedUser.is_verified),
      created_at: updatedUser.created_at,
      last_seen: updatedUser.last_seen || updatedUser.created_at
    };

    return NextResponse.json({
      success: true,
      data: { user: formattedUser },
      timestamp: Date.now()
    });

  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}