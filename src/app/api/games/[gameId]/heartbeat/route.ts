import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getAuthUserId } from '@/lib/server/authUser';
import { recordHeartbeatAndCheckAbandonment } from '@/lib/server/abandonment';
import type { PieceColor } from '@/types/game';

// Unrate-limited, like GET /api/matchmaking/status and GET
// /api/lobbies/[lobbyId] — this is the client's frequent legitimate poll
// target, scoped to a game the caller already belongs to, not a
// guessable-secret abuse vector.
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
    return NextResponse.json({
      success: true,
      data: { status: game.status, winnerId: game.winner_id, abandoned: false },
      timestamp: Date.now(),
    });
  }

  const { abandoned, game: updatedGame } = await recordHeartbeatAndCheckAbandonment(game, myColor, userId);

  return NextResponse.json({
    success: true,
    data: {
      status: abandoned ? updatedGame!.status : game.status,
      winnerId: abandoned ? updatedGame!.winner_id : null,
      abandoned,
    },
    timestamp: Date.now(),
  });
}
