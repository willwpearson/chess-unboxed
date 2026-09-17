import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getAuthUserId } from '@/lib/server/authUser';

// Next unseen, rating-matched practice puzzle. The "closest rating" pick and
// "exclude already-attempted" filter both happen in application code below
// rather than as a single indexed query — fine at the ~20-40 row v1 seed
// scale, but this must become a real query (or a materialized rating-bucket
// table) before the pool grows much past that.

interface PuzzleListRow {
  id: string;
  starting_fen: string;
  side_to_move: string;
  is_wraparound_mode: boolean;
  rating: number;
}

export async function GET(request: NextRequest) {
  const userId = getAuthUserId(request);
  if (!userId) {
    return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
  }

  const { data: ratingRow } = await supabaseAdmin
    .from('user_puzzle_ratings')
    .select('rating')
    .eq('user_id', userId)
    .single();
  const userRating = ratingRow?.rating ?? 1200;

  const { data: attempts } = await supabaseAdmin.from('puzzle_attempts').select('puzzle_id').eq('user_id', userId);
  const attemptedIds = new Set((attempts ?? []).map((a: { puzzle_id: string }) => a.puzzle_id));

  const { data: puzzles, error } = await supabaseAdmin.from('puzzles').select('*').eq('active', true);
  if (error) {
    return NextResponse.json({ success: false, error: 'Failed to load puzzles' }, { status: 500 });
  }

  const candidates = ((puzzles ?? []) as PuzzleListRow[]).filter((p) => !attemptedIds.has(p.id));
  if (candidates.length === 0) {
    return NextResponse.json({ success: false, error: 'No new puzzles available' }, { status: 404 });
  }

  const next = candidates.reduce((closest, p) =>
    Math.abs(p.rating - userRating) < Math.abs(closest.rating - userRating) ? p : closest
  );

  return NextResponse.json({
    success: true,
    data: {
      puzzleId: next.id,
      startingFen: next.starting_fen,
      sideToMove: next.side_to_move,
      isWraparoundMode: next.is_wraparound_mode,
      rating: next.rating,
    },
    timestamp: Date.now(),
  });
}
