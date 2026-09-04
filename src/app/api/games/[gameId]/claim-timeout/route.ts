import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getAuthUserId } from '@/lib/server/authUser';
import { applyRankedResult } from '@/lib/server/applyGameResult';
import type { PieceColor } from '@/types/game';

// Either player can call this once they observe (client-side, purely
// cosmetic ticking) that the opponent's clock has hit zero. The claim is
// only honored if the server's own elapsed-time computation from
// `last_move_at` agrees — a client can't force a timeout that hasn't
// actually happened.
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

  if (game.initial_time_sec == null || game.increment_sec == null) {
    return NextResponse.json({ success: false, error: 'This game has no time control' }, { status: 400 });
  }

  const now = Date.now();
  const lastMoveAt = game.last_move_at ? new Date(game.last_move_at).getTime() : new Date(game.created_at).getTime();
  const elapsed = now - lastMoveAt;
  const toMove: PieceColor = (game.turn as PieceColor) || 'white';
  const storedRemaining = toMove === 'white' ? game.white_time_ms : game.black_time_ms;
  const remainingMs = (storedRemaining ?? game.initial_time_sec * 1000) - elapsed;

  if (remainingMs > 0) {
    return NextResponse.json({ success: false, error: 'Opponent has not timed out' }, { status: 409 });
  }

  const winnerId = toMove === 'white' ? game.black_player_id : game.white_player_id;

  const { error: updateError } = await supabaseAdmin
    .from('games')
    .update({
      status: 'completed',
      winner_id: winnerId,
      ended_at: new Date(now).toISOString(),
    })
    .eq('id', gameId);

  if (updateError) {
    console.error('Failed to persist timeout claim:', updateError);
    return NextResponse.json({ success: false, error: 'Failed to claim timeout' }, { status: 500 });
  }

  await applyRankedResult(game, winnerId);

  return NextResponse.json({ success: true, data: { winnerId }, timestamp: now });
}
