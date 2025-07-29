import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET() {
  try {
    // Get all waiting lobbies with host player info
    const { data: lobbies, error } = await supabaseAdmin
      .from('lobbies')
      .select(`
        *,
        host:players!host_id(id, nickname, score),
        guest:players!guest_id(id, nickname, score)
      `)
      .eq('status', 'waiting')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch lobbies' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      lobbies
    });
  } catch (error) {
    console.error('Error fetching lobbies:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { host_id } = await request.json();

    if (!host_id) {
      return NextResponse.json(
        { error: 'Host ID is required' },
        { status: 400 }
      );
    }

    // Create new lobby
    const { data: lobby, error } = await supabaseAdmin
      .from('lobbies')
      .insert({
        host_id,
        status: 'waiting'
      })
      .select(`
        *,
        host:players!host_id(id, nickname, score)
      `)
      .single();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to create lobby' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      lobby
    });
  } catch (error) {
    console.error('Error creating lobby:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const lobbyId = searchParams.get('id');
    const { guest_id, status } = await request.json();

    if (!lobbyId) {
      return NextResponse.json(
        { error: 'Lobby ID is required' },
        { status: 400 }
      );
    }

    // Join lobby or update status
    const updateData: any = {};
    if (guest_id) updateData.guest_id = guest_id;
    if (status) updateData.status = status;

    const { data: lobby, error } = await supabaseAdmin
      .from('lobbies')
      .update(updateData)
      .eq('id', lobbyId)
      .select(`
        *,
        host:players!host_id(id, nickname, score),
        guest:players!guest_id(id, nickname, score)
      `)
      .single();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to update lobby' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      lobby
    });
  } catch (error) {
    console.error('Error updating lobby:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
