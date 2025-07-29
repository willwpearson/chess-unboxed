import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { nickname } = await request.json();

    if (!nickname || typeof nickname !== 'string' || nickname.trim().length === 0) {
      return NextResponse.json(
        { error: 'Nickname is required' },
        { status: 400 }
      );
    }

    // Create new player in Supabase
    const { data: player, error } = await supabaseAdmin
      .from('players')
      .insert({
        nickname: nickname.trim(),
        score: 0,
        is_active: true
      })
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to create player' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      player
    });
  } catch (error) {
    console.error('Error creating player:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const playerId = searchParams.get('id');

    if (playerId) {
      // Get specific player
      const { data: player, error } = await supabaseAdmin
        .from('players')
        .select('*')
        .eq('id', playerId)
        .single();

      if (error) {
        return NextResponse.json(
          { error: 'Player not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({ player });
    } else {
      // Get all active players
      const { data: players, error } = await supabaseAdmin
        .from('players')
        .select('*')
        .eq('is_active', true)
        .order('score', { ascending: false });

      if (error) {
        console.error('Database error:', error);
        return NextResponse.json(
          { error: 'Failed to fetch players' },
          { status: 500 }
        );
      }

      return NextResponse.json({ players });
    }
  } catch (error) {
    console.error('Error fetching players:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
