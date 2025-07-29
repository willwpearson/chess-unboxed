import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const playerId = searchParams.get('player');
    const active = searchParams.get('active');

    let query = supabaseAdmin
      .from('endless_sessions')
      .select(`
        *,
        player:players!player_id(id, nickname, score)
      `);

    if (playerId) {
      query = query.eq('player_id', playerId);
    }

    if (active === 'true') {
      query = query.eq('active', true);
    }

    const { data: sessions, error } = await query
      .order('score', { ascending: false })
      .limit(20);

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch endless sessions' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      sessions
    });
  } catch (error) {
    console.error('Error fetching endless sessions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { player_id } = await request.json();

    if (!player_id) {
      return NextResponse.json(
        { error: 'Player ID is required' },
        { status: 400 }
      );
    }

    // End any existing active sessions for this player
    await supabaseAdmin
      .from('endless_sessions')
      .update({ 
        active: false, 
        ended_at: new Date().toISOString() 
      })
      .eq('player_id', player_id)
      .eq('active', true);

    // Create new endless session
    const { data: session, error } = await supabaseAdmin
      .from('endless_sessions')
      .insert({
        player_id,
        score: 0,
        active: true
      })
      .select(`
        *,
        player:players!player_id(id, nickname, score)
      `)
      .single();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to create endless session' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      session
    });
  } catch (error) {
    console.error('Error creating endless session:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('id');
    const body = await request.json();

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    // Update endless session
    const { data: session, error } = await supabaseAdmin
      .from('endless_sessions')
      .update(body)
      .eq('id', sessionId)
      .select(`
        *,
        player:players!player_id(id, nickname, score)
      `)
      .single();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to update endless session' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      session
    });
  } catch (error) {
    console.error('Error updating endless session:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
