import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getAuthUserId } from '@/lib/server/authUser';
import { applyRankedResult } from '@/lib/server/applyGameResult';
import type { PieceColor } from '@/types/game';

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

  let myColor: PieceColor;
  if (game.white_player_id === userId) {
    myColor = 'white';
  } else if (game.black_player_id === userId) {
    myColor = 'black';
  } else {
    return NextResponse.json({ success: false, error: 'You are not a player in this game' }, { status: 403 });
  }

  if (game.status !== 'in_progress') {
    return NextResponse.json({ success: false, error: 'Game is not in progress' }, { status: 409 });
  }

  const winnerId = myColor === 'white' ? game.black_player_id : game.white_player_id;

  const { error: updateError } = await supabaseAdmin
    .from('games')
    .update({
      status: 'completed',
      winner_id: winnerId,
      ended_at: new Date().toISOString(),
    })
    .eq('id', gameId);

  if (updateError) {
    console.error('Failed to persist resignation:', updateError);
    return NextResponse.json({ success: false, error: 'Failed to resign' }, { status: 500 });
  }

  await applyRankedResult(game, winnerId);

  return NextResponse.json({ success: true, data: { winnerId }, timestamp: Date.now() });
}
