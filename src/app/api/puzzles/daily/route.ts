import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getAuthUserId } from '@/lib/server/authUser';

// Deterministic daily puzzle: the same puzzle for every user on a given UTC
// date, picked by indexing into the active pool ordered by `slug` (stable
// across reseeds, unlike `created_at`/`id`). Indexing happens in application
// code — fine at v1 seed-set scale, see the same caveat in /api/puzzles/next.

interface PuzzleListRow {
  id: string;
  starting_fen: string;
  side_to_move: string;
  is_wraparound_mode: boolean;
  rating: number;
}

function utcDateString(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export async function GET(request: NextRequest) {
  const userId = getAuthUserId(request);
  if (!userId) {
    return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
  }

  const { data: puzzles, error } = await supabaseAdmin.from('puzzles').select('*').eq('active', true).order('slug');
  if (error) {
    return NextResponse.json({ success: false, error: 'Failed to load puzzles' }, { status: 500 });
  }

  const pool = (puzzles ?? []) as PuzzleListRow[];
  if (pool.length === 0) {
    return NextResponse.json({ success: false, error: 'No puzzles available' }, { status: 404 });
  }

  const now = new Date();
  const dayIndex = Math.floor(now.getTime() / 86_400_000) % pool.length;
  const puzzle = pool[dayIndex];

  const { data: existingAttempt } = await supabaseAdmin
    .from('puzzle_attempts')
    .select('*')
    .eq('user_id', userId)
    .eq('puzzle_id', puzzle.id)
    .single();

  return NextResponse.json({
    success: true,
    data: {
      puzzleId: puzzle.id,
      startingFen: puzzle.starting_fen,
      sideToMove: puzzle.side_to_move,
      isWraparoundMode: puzzle.is_wraparound_mode,
      rating: puzzle.rating,
      date: utcDateString(now),
      attempted: !!existingAttempt,
      solved: existingAttempt?.solved ?? null,
    },
    timestamp: Date.now(),
  });
}
