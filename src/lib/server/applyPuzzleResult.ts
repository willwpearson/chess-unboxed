import { supabaseAdmin } from '@/lib/supabase';
import { computeRatingDelta, type MatchScore } from '@/lib/elo';

// Puzzle-flavored sibling of applyRankedResult (src/lib/server/applyGameResult.ts):
// treats a solved/failed puzzle attempt as a one-sided "game" against a
// virtual opponent rated at the puzzle's difficulty. Not folded into that
// file since its shape is keyed to two-player `games` rows, which puzzles
// don't have.
//
// The caller (the attempt route) must have already persisted the
// puzzle_attempts row before calling this — failures here are logged and
// swallowed, never thrown, so a rating-bookkeeping error can't appear to
// undo an already-persisted attempt.

const RATING_FLOOR = 100;

async function getOrCreatePuzzleRating(userId: string) {
  const { data: existing } = await supabaseAdmin
    .from('user_puzzle_ratings')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (existing) return existing;

  const { data: created, error } = await supabaseAdmin
    .from('user_puzzle_ratings')
    .insert({
      user_id: userId,
      rating: 1200,
      peak_rating: 1200,
      puzzles_attempted: 0,
      puzzles_solved: 0,
    })
    .select('*')
    .single();

  if (error || !created) {
    throw new Error(`Failed to create user_puzzle_ratings row for ${userId}: ${error?.message}`);
  }
  return created;
}

export async function applyPuzzleResult(
  userId: string,
  puzzleRating: number,
  solved: boolean
): Promise<number | null> {
  try {
    const row = await getOrCreatePuzzleRating(userId);
    const score: MatchScore = solved ? 1 : 0;
    const delta = computeRatingDelta(row.rating, row.puzzles_attempted, puzzleRating, score);
    const newRating = Math.max(RATING_FLOOR, row.rating + delta);

    await supabaseAdmin
      .from('user_puzzle_ratings')
      .update({
        rating: newRating,
        peak_rating: Math.max(row.peak_rating, newRating),
        puzzles_attempted: row.puzzles_attempted + 1,
        puzzles_solved: row.puzzles_solved + (solved ? 1 : 0),
        updated_at: new Date().toISOString(),
      })
      .eq('id', row.id);

    return delta;
  } catch (err) {
    console.error('applyPuzzleResult failed for user', userId, err);
    return null;
  }
}
