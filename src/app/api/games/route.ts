import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// Reconciled against the real `games` schema (white_player_id/black_player_id).
// The previous version of this route joined a `players` table with
// player1_id/player2_id/nickname/score columns that don't exist anywhere in
// the actual schema — leftover from a prior, removed iteration of the
// multiplayer system. See docs/MULTIPLAYER_PROGRESS.md for context.

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const gameId = searchParams.get('id');
    const playerId = searchParams.get('player');

    if (gameId) {
      const { data: game, error } = await supabaseAdmin
        .from('games')
        .select('*')
        .eq('id', gameId)
        .single();

      if (error) {
        return NextResponse.json({ error: 'Game not found' }, { status: 404 });
      }

      return NextResponse.json({ game });
    } else if (playerId) {
      const { data: games, error } = await supabaseAdmin
        .from('games')
        .select('*')
        .or(`white_player_id.eq.${playerId},black_player_id.eq.${playerId}`)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Database error:', error);
        return NextResponse.json({ error: 'Failed to fetch games' }, { status: 500 });
      }

      return NextResponse.json({ games });
    } else {
      const { data: games, error } = await supabaseAdmin
        .from('games')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) {
        console.error('Database error:', error);
        return NextResponse.json({ error: 'Failed to fetch games' }, { status: 500 });
      }

      return NextResponse.json({ games });
    }
  } catch (error) {
    console.error('Error fetching games:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { mode, white_player_id, black_player_id } = await request.json();

    if (!mode || !white_player_id) {
      return NextResponse.json(
        { error: 'mode and white_player_id are required' },
        { status: 400 }
      );
    }

    const { data: game, error } = await supabaseAdmin
      .from('games')
      .insert({
        mode,
        white_player_id,
        black_player_id,
        status: 'in_progress',
        moves: [],
      })
      .select('*')
      .single();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: 'Failed to create game' }, { status: 500 });
    }

    return NextResponse.json({ success: true, game });
  } catch (error) {
    console.error('Error creating game:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const gameId = searchParams.get('id');
    const body = await request.json();

    if (!gameId) {
      return NextResponse.json({ error: 'Game ID is required' }, { status: 400 });
    }

    const { data: game, error } = await supabaseAdmin
      .from('games')
      .update(body)
      .eq('id', gameId)
      .select('*')
      .single();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: 'Failed to update game' }, { status: 500 });
    }

    return NextResponse.json({ success: true, game });
  } catch (error) {
    console.error('Error updating game:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
