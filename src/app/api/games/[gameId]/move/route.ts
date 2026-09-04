import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseAdmin } from '@/lib/supabase';
import { loadGameManager, GameReplayError, GameRow } from '@/lib/server/gameSession';
import { getAuthUserId } from '@/lib/server/authUser';
import { applyRankedResult } from '@/lib/server/applyGameResult';
import type { PieceColor } from '@/types/game';

const moveSchema = z.object({
  from: z.string().min(2).max(3),
  to: z.string().min(2).max(3),
  promotion: z.enum(['queen', 'rook', 'bishop', 'knight']).optional(),
});

export async function POST(request: NextRequest, { params }: { params: Promise<{ gameId: string }> }) {
  const { gameId } = await params;

  const userId = getAuthUserId(request);
  if (!userId) {
    return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
  }

  let body;
  try {
    body = moveSchema.parse(await request.json());
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: err.errors[0].message }, { status: 400 });
    }
    return NextResponse.json({ success: false, error: 'Invalid request body' }, { status: 400 });
  }

  const { data: row, error: fetchError } = await supabaseAdmin
    .from('games')
    .select('*')
    .eq('id', gameId)
    .single();

  if (fetchError || !row) {
    return NextResponse.json({ success: false, error: 'Game not found' }, { status: 404 });
  }

  const game = row as GameRow & Record<string, any>;

  if (game.mode === 'bot') {
    return NextResponse.json(
      { success: false, error: 'Bot games are not driven through this endpoint' },
      { status: 400 }
    );
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

  const currentTurn: PieceColor = (game.turn as PieceColor) || 'white';
  if (currentTurn !== myColor) {
    return NextResponse.json({ success: false, error: 'Not your turn' }, { status: 409 });
  }

  // Server-authoritative clock check: has the mover already run out of time
  // since the last move, regardless of what they claim?
  const initialTimeSec: number | null = game.initial_time_sec ?? null;
  const incrementSec: number | null = game.increment_sec ?? null;
  const hasClock = initialTimeSec != null && incrementSec != null;
  const now = Date.now();
  let remainingMs: number | null = null;

  if (hasClock && initialTimeSec != null) {
    const lastMoveAt = game.last_move_at ? new Date(game.last_move_at).getTime() : new Date(game.created_at).getTime();
    const elapsed = now - lastMoveAt;
    const storedRemaining = myColor === 'white' ? game.white_time_ms : game.black_time_ms;
    remainingMs = (storedRemaining ?? initialTimeSec * 1000) - elapsed;

    if (remainingMs <= 0) {
      const winnerId = myColor === 'white' ? game.black_player_id : game.white_player_id;
      await supabaseAdmin
        .from('games')
        .update({
          status: 'completed',
          winner_id: winnerId,
          ended_at: new Date(now).toISOString(),
        })
        .eq('id', gameId);

      await applyRankedResult(game, winnerId);

      return NextResponse.json({ success: false, error: 'Your time has expired' }, { status: 409 });
    }
  }

  let manager;
  try {
    manager = loadGameManager(game);
  } catch (err) {
    if (err instanceof GameReplayError) {
      console.error('Game replay failed:', err);
      return NextResponse.json({ success: false, error: 'Game state could not be reconstructed' }, { status: 500 });
    }
    throw err;
  }

  const result = manager.makeMove(body.from as any, body.to as any, body.promotion as any);

  if (!result.isValid) {
    return NextResponse.json({ success: false, error: result.error || 'Invalid move' }, { status: 400 });
  }

  const state = manager.getGameState();
  const nextTurn = manager.getCurrentPlayer();

  const update: Record<string, any> = {
    moves: state.moves,
    turn: nextTurn,
    fen: manager.getFEN(),
    last_move_at: new Date(now).toISOString(),
  };

  if (hasClock && remainingMs != null && incrementSec != null) {
    const newRemaining = remainingMs + incrementSec * 1000;
    if (myColor === 'white') {
      update.white_time_ms = newRemaining;
    } else {
      update.black_time_ms = newRemaining;
    }
  }

  if (result.gameEnd) {
    update.status = 'completed';
    update.ended_at = new Date(now).toISOString();
    if (result.gameEnd.result === 'white-wins') {
      update.winner_id = game.white_player_id;
    } else if (result.gameEnd.result === 'black-wins') {
      update.winner_id = game.black_player_id;
    }
  }

  const { error: updateError } = await supabaseAdmin.from('games').update(update).eq('id', gameId);
  if (updateError) {
    console.error('Failed to persist move:', updateError);
    return NextResponse.json({ success: false, error: 'Failed to persist move' }, { status: 500 });
  }

  if (result.gameEnd) {
    await applyRankedResult(game, update.winner_id ?? null);
  }

  return NextResponse.json({
    success: true,
    data: {
      move: result.move,
      gameEnd: result.gameEnd,
      turn: nextTurn,
      fen: update.fen,
    },
    timestamp: now,
  });
}
