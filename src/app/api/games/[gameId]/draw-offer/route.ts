import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getAuthUserId } from '@/lib/server/authUser';

export async function POST(request: NextRequest, { params }: { params: Promise<{ gameId: string }> }) {
  const { gameId } = await params;

  const userId = getAuthUserId(request);
  if (!userId) {
    return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
  }

  const { data: game, error: fetchError } = await supabaseAdmin
    .from('games')
    .select('*')
    .eq('id', gameId)
    .single();

  if (fetchError || !game) {
    return NextResponse.json({ success: false, error: 'Game not found' }, { status: 404 });
  }

  if (game.white_player_id !== userId && game.black_player_id !== userId) {
    return NextResponse.json({ success: false, error: 'You are not a player in this game' }, { status: 403 });
  }

  if (game.status !== 'in_progress') {
    return NextResponse.json({ success: false, error: 'Game is not in progress' }, { status: 409 });
  }

  const { error: updateError } = await supabaseAdmin
    .from('games')
    .update({ draw_offered_by: userId })
    .eq('id', gameId);

  if (updateError) {
    console.error('Failed to record draw offer:', updateError);
    return NextResponse.json({ success: false, error: 'Failed to offer draw' }, { status: 500 });
  }

  return NextResponse.json({ success: true, timestamp: Date.now() });
}
