import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseAdmin } from '@/lib/supabase';
import { createGame } from '@/lib/gameManager';
import { getAuthUserId } from '@/lib/server/authUser';
import { applyPuzzleResult } from '@/lib/server/applyPuzzleResult';
import type { PieceType, Player, Square } from '@/types/game';

// Server-authoritative puzzle-solution verification. One move per call,
// stateless — the server never trusts a client-held board state, it always
// replays the puzzle's stored solution prefix plus the submitted move
// through a fresh GameManager built from the puzzle's starting FEN (same
// replay-not-snapshot principle as src/lib/server/gameSession.ts's
// loadGameManager). v1 only accepts the exact curated `solutionMoves` path,
// not any mechanically-legal winning alternative — see the puzzles feature
// plan's "future improvements" section for the deferred generator/validator
// that would relax this.

const attemptSchema = z.object({
  moveIndex: z.number().int().min(0),
  from: z.string().min(2).max(3),
  to: z.string().min(2).max(3),
  promotion: z.enum(['queen', 'rook', 'bishop', 'knight']).optional(),
  source: z.enum(['practice', 'daily']).default('practice'),
});

interface SolutionMove {
  from: Square;
  to: Square;
  promotion?: PieceType;
}

interface PuzzleRow {
  id: string;
  starting_fen: string;
  side_to_move: string;
  solution_moves: SolutionMove[];
  rating: number;
  active: boolean;
}

function stubPlayer(id: string, color: 'white' | 'black'): Player {
  return { id, name: color, color, isBot: false };
}

function movesMatch(a: SolutionMove, b: { from: string; to: string; promotion?: string }): boolean {
  return a.from === b.from && a.to === b.to && (a.promotion ?? undefined) === (b.promotion ?? undefined);
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ puzzleId: string }> }) {
  const { puzzleId } = await params;

  const userId = getAuthUserId(request);
  if (!userId) {
    return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
  }

  let body;
  try {
    body = attemptSchema.parse(await request.json());
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: err.errors[0].message }, { status: 400 });
    }
    return NextResponse.json({ success: false, error: 'Invalid request body' }, { status: 400 });
  }

  const { data: puzzleRow, error: puzzleError } = await supabaseAdmin
    .from('puzzles')
    .select('*')
    .eq('id', puzzleId)
    .single();

  if (puzzleError || !puzzleRow) {
    return NextResponse.json({ success: false, error: 'Puzzle not found' }, { status: 404 });
  }

  const puzzle = puzzleRow as PuzzleRow;
  if (!puzzle.active) {
    return NextResponse.json({ success: false, error: 'Puzzle not found' }, { status: 404 });
  }

  const solutionMoves = puzzle.solution_moves ?? [];
  if (body.moveIndex >= solutionMoves.length) {
    return NextResponse.json({ success: false, error: 'Invalid move index' }, { status: 400 });
  }

  // Idempotency: a puzzle can only ever be "attempted" (rating-affecting)
  // once per user. If a result already exists, hand it back rather than
  // re-verifying and recomputing a rating delta.
  const { data: existingAttempt } = await supabaseAdmin
    .from('puzzle_attempts')
    .select('*')
    .eq('user_id', userId)
    .eq('puzzle_id', puzzleId)
    .single();

  if (existingAttempt) {
    return NextResponse.json({
      success: true,
      data: {
        alreadyAttempted: true,
        solved: existingAttempt.solved,
        ratingChange: existingAttempt.rating_change,
        done: true,
      },
      timestamp: Date.now(),
    });
  }

  const manager = createGame({
    mode: 'casual',
    variant: 'unboxed',
    players: {
      white: stubPlayer('white-puzzle', 'white'),
      black: stubPlayer('black-puzzle', 'black'),
    },
    fen: puzzle.starting_fen,
  });

  // Replay the already-confirmed prefix (prior solver moves + forced
  // opponent replies) to reconstruct the position at moveIndex.
  for (let i = 0; i < body.moveIndex; i++) {
    const prior = solutionMoves[i];
    const replay = manager.makeMove(prior.from, prior.to, prior.promotion);
    if (!replay.isValid) {
      console.error('Puzzle solution prefix failed to replay:', puzzleId, i, replay.error);
      return NextResponse.json({ success: false, error: 'Puzzle data could not be replayed' }, { status: 500 });
    }
  }

  const attemptResult = manager.makeMove(body.from as Square, body.to as Square, body.promotion as PieceType | undefined);
  const expected = solutionMoves[body.moveIndex];
  const correct = attemptResult.isValid && movesMatch(expected, body);

  if (!correct) {
    const finalized = await finalizeAttempt(userId, puzzleId, puzzle.rating, false, body);
    return NextResponse.json({
      success: true,
      data: { correct: false, ...finalized },
      timestamp: Date.now(),
    });
  }

  const isFinalMove = body.moveIndex === solutionMoves.length - 1;

  if (!isFinalMove) {
    const opponentReplyMove = solutionMoves[body.moveIndex + 1];
    const replyResult = manager.makeMove(opponentReplyMove.from, opponentReplyMove.to, opponentReplyMove.promotion);
    if (!replyResult.isValid) {
      console.error('Puzzle opponent reply failed to replay:', puzzleId, body.moveIndex + 1, replyResult.error);
      return NextResponse.json({ success: false, error: 'Puzzle data could not be replayed' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: { correct: true, opponentReply: opponentReplyMove, solved: false, done: false },
      timestamp: Date.now(),
    });
  }

  const finalized = await finalizeAttempt(userId, puzzleId, puzzle.rating, true, body);
  return NextResponse.json({
    success: true,
    data: { correct: true, ...finalized },
    timestamp: Date.now(),
  });
}

// Persists the attempt row first (mirroring applyRankedResult's ordering:
// the "result" — here, the attempt outcome — must be durable before rating
// bookkeeping runs), then applies the ELO delta. A rating-write failure is
// swallowed by applyPuzzleResult itself and must not appear to undo the
// already-persisted attempt.
async function finalizeAttempt(
  userId: string,
  puzzleId: string,
  puzzleRating: number,
  solved: boolean,
  body: z.infer<typeof attemptSchema>
) {
  await supabaseAdmin.from('puzzle_attempts').insert({
    user_id: userId,
    puzzle_id: puzzleId,
    solved,
    moves_played: [{ moveIndex: body.moveIndex, from: body.from, to: body.to, promotion: body.promotion }],
    source: body.source,
  });

  const ratingChange = await applyPuzzleResult(userId, puzzleRating, solved);
  if (ratingChange !== null) {
    await supabaseAdmin
      .from('puzzle_attempts')
      .update({ rating_change: ratingChange })
      .eq('user_id', userId)
      .eq('puzzle_id', puzzleId);
  }

  return { solved, done: true, ratingChange };
}
