import { supabaseAdmin } from '@/lib/supabase';
import { computeRatingDelta, type MatchScore } from '@/lib/elo';

// Called from every route that can transition a game to 'completed' (see
// call sites in move/resign/draw-accept/claim-timeout routes) right after
// that transition is persisted. Only 'ranked' games affect ratings — casual/
// private/bot games hit the early return below and this is a no-op for them.
//
// Rating rows are created lazily, right here, on first need — never at
// signup (see docs/MULTIPLAYER_PROGRESS.md Open Questions; the old eager
// user_ratings seeding in the guest route targeted a table that never
// existed and has been deleted rather than ported). This function assumes a
// user can't have two ranked games finishing simultaneously for the same
// brand-new (user, timeControl) pair, since a player can't join the
// matchmaking queue while already in an in-progress game (enforced in
// src/app/api/matchmaking/join/route.ts) — so no extra compare-and-swap
// layer is used around the fetch-or-create below.
//
// Failures here are logged and swallowed, never thrown: the game's result
// (resign/checkmate/draw/timeout) has already been persisted successfully
// by the caller, and a rating-bookkeeping error must not appear to undo it.

interface CompletedGameRow {
  id: string;
  mode: string;
  time_control?: string | null;
  white_player_id: string | null;
  black_player_id: string | null;
}

const RATING_FLOOR = 100;

async function getOrCreateRating(userId: string, timeControl: string) {
  const { data: existing } = await supabaseAdmin
    .from('user_ratings')
    .select('*')
    .eq('user_id', userId)
    .eq('time_control', timeControl)
    .single();

  if (existing) return existing;

  const { data: created, error } = await supabaseAdmin
    .from('user_ratings')
    .insert({
      user_id: userId,
      time_control: timeControl,
      rating: 1200,
      peak_rating: 1200,
      games_played: 0,
      wins: 0,
      losses: 0,
      draws: 0,
    })
    .select('*')
    .single();

  if (error || !created) {
    throw new Error(`Failed to create user_ratings row for ${userId}/${timeControl}: ${error?.message}`);
  }
  return created;
}

async function applyDelta(
  row: any,
  delta: number,
  outcome: 'win' | 'loss' | 'draw'
) {
  const newRating = Math.max(RATING_FLOOR, row.rating + delta);
  await supabaseAdmin
    .from('user_ratings')
    .update({
      rating: newRating,
      peak_rating: Math.max(row.peak_rating, newRating),
      games_played: row.games_played + 1,
      wins: row.wins + (outcome === 'win' ? 1 : 0),
      losses: row.losses + (outcome === 'loss' ? 1 : 0),
      draws: row.draws + (outcome === 'draw' ? 1 : 0),
      updated_at: new Date().toISOString(),
    })
    .eq('id', row.id);
}

export async function applyRankedResult(game: CompletedGameRow, winnerId: string | null): Promise<void> {
  if (game.mode !== 'ranked') return;

  try {
    if (!game.time_control || !game.white_player_id || !game.black_player_id) {
      console.error('applyRankedResult: ranked game missing time_control/players', game.id);
      return;
    }

    const [whiteRating, blackRating] = await Promise.all([
      getOrCreateRating(game.white_player_id, game.time_control),
      getOrCreateRating(game.black_player_id, game.time_control),
    ]);

    const whiteScore: MatchScore = winnerId === game.white_player_id ? 1 : winnerId === game.black_player_id ? 0 : 0.5;
    const blackScore: MatchScore = winnerId === game.black_player_id ? 1 : winnerId === game.white_player_id ? 0 : 0.5;

    const whiteDelta = computeRatingDelta(whiteRating.rating, whiteRating.games_played, blackRating.rating, whiteScore);
    const blackDelta = computeRatingDelta(blackRating.rating, blackRating.games_played, whiteRating.rating, blackScore);

    const whiteOutcome = whiteScore === 1 ? 'win' : whiteScore === 0 ? 'loss' : 'draw';
    const blackOutcome = blackScore === 1 ? 'win' : blackScore === 0 ? 'loss' : 'draw';

    await Promise.all([
      applyDelta(whiteRating, whiteDelta, whiteOutcome),
      applyDelta(blackRating, blackDelta, blackOutcome),
    ]);

    await supabaseAdmin
      .from('games')
      .update({ rating_change_white: whiteDelta, rating_change_black: blackDelta })
      .eq('id', game.id);
  } catch (err) {
    console.error('applyRankedResult failed for game', game.id, err);
  }
}
