import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await context.params;

    if (!username) {
      return NextResponse.json(
        { success: false, error: 'Username is required' },
        { status: 400 }
      );
    }

    // Query user by username
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select(`
        id, email, username, display_name, bio, avatar_url, country, website,
        current_rating, peak_rating, total_games, wins, losses, draws,
        is_verified, created_at, last_seen
      `)
      .eq('username', username)
      .eq('is_active', true)
      .single();

    if (error || !user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Format the user object to match the expected User interface
    const formattedUser = {
      id: user.id,
      email: user.email,
      username: user.username,
      display_name: user.display_name || user.username,
      bio: user.bio,
      avatar_url: user.avatar_url,
      country: user.country,
      website: user.website,
      current_rating: user.current_rating || 1200,
      peak_rating: user.peak_rating || user.current_rating || 1200,
      total_games: user.total_games || 0,
      wins: user.wins || 0,
      losses: user.losses || 0,
      draws: user.draws || 0,
      is_verified: Boolean(user.is_verified),
      created_at: user.created_at,
      last_seen: user.last_seen || user.created_at
    };

    return NextResponse.json({
      success: true,
      data: { user: formattedUser },
      timestamp: Date.now()
    });

  } catch (error) {
    console.error('Profile fetch error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}