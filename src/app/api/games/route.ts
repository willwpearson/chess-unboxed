import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const gameId = searchParams.get('id');
    const playerId = searchParams.get('player');

    if (gameId) {
      // Get specific game
      const { data: game, error } = await supabaseAdmin
        .from('games')
        .select(`
          *,
          player1:players!player1_id(id, nickname, score),
          player2:players!player2_id(id, nickname, score),
          winner:players!winner_id(id, nickname, score)
        `)
        .eq('id', gameId)
        .single();

      if (error) {
        return NextResponse.json(
          { error: 'Game not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({ game });
    } else if (playerId) {
      // Get games for a specific player
      const { data: games, error } = await supabaseAdmin
        .from('games')
        .select(`
          *,
          player1:players!player1_id(id, nickname, score),
          player2:players!player2_id(id, nickname, score),
          winner:players!winner_id(id, nickname, score)
        `)
        .or(`player1_id.eq.${playerId},player2_id.eq.${playerId}`)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Database error:', error);
        return NextResponse.json(
          { error: 'Failed to fetch games' },
          { status: 500 }
        );
      }

      return NextResponse.json({ games });
    } else {
      // Get recent games
      const { data: games, error } = await supabaseAdmin
        .from('games')
        .select(`
          *,
          player1:players!player1_id(id, nickname, score),
          player2:players!player2_id(id, nickname, score),
          winner:players!winner_id(id, nickname, score)
        `)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) {
        console.error('Database error:', error);
        return NextResponse.json(
          { error: 'Failed to fetch games' },
          { status: 500 }
        );
      }

      return NextResponse.json({ games });
    }
  } catch (error) {
    console.error('Error fetching games:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { mode, player1_id, player2_id } = await request.json();

    if (!mode || !player1_id) {
      return NextResponse.json(
        { error: 'Mode and player1_id are required' },
        { status: 400 }
      );
    }

    // Create new game
    const { data: game, error } = await supabaseAdmin
      .from('games')
      .insert({
        mode,
        player1_id,
        player2_id,
        status: 'in_progress',
        moves: []
      })
      .select(`
        *,
        player1:players!player1_id(id, nickname, score),
        player2:players!player2_id(id, nickname, score)
      `)
      .single();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to create game' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      game
    });
  } catch (error) {
    console.error('Error creating game:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const gameId = searchParams.get('id');
    const body = await request.json();

    if (!gameId) {
      return NextResponse.json(
        { error: 'Game ID is required' },
        { status: 400 }
      );
    }

    // Update game
    const { data: game, error } = await supabaseAdmin
      .from('games')
      .update(body)
      .eq('id', gameId)
      .select(`
        *,
        player1:players!player1_id(id, nickname, score),
        player2:players!player2_id(id, nickname, score),
        winner:players!winner_id(id, nickname, score)
      `)
      .single();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to update game' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      game
    });
  } catch (error) {
    console.error('Error updating game:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
