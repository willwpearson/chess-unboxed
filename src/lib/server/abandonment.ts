import { supabaseAdmin } from '@/lib/supabase';
import { applyRankedResult } from '@/lib/server/applyGameResult';
import { ABANDON_THRESHOLD_MS } from '@/lib/abandonmentConfig';
import type { PieceColor } from '@/types/game';

// Heartbeat-based abandonment detection. There's no cron/background worker
// in this codebase, so this follows the same "check lazily on the next
// request" pattern already used for matchmaking-queue and lobby TTL expiry:
// each player's client pings /api/games/[gameId]/heartbeat on an interval,
// and that same request checks whether the *opponent* has gone quiet for
// too long. Works uniformly for timed and untimed games, unlike
// claim-timeout (chess-clock based only, requires the opponent to be
// present to click a claim button). Non-terminal actions (move, draw-offer)
// also refresh the actor's own `<color>_last_seen_at` directly in their
// existing update payload, so presence doesn't only get touched by the
// heartbeat endpoint.

interface GameForPresence {
  id: string;
  mode: string;
  status: string;
  winner_id: string | null;
  time_control?: string | null;
  white_player_id: string | null;
  black_player_id: string | null;
  white_last_seen_at?: string | null;
  black_last_seen_at?: string | null;
}

interface AbandonmentCheckResult {
  abandoned: boolean;
  game?: GameForPresence;
}

export async function recordHeartbeatAndCheckAbandonment(
  game: GameForPresence,
  callerColor: PieceColor,
  callerId: string
): Promise<AbandonmentCheckResult> {
  const now = new Date();

  await supabaseAdmin
    .from('games')
    .update({ [`${callerColor}_last_seen_at`]: now.toISOString() })
    .eq('id', game.id);

  const opponentLastSeenAt = callerColor === 'white' ? game.black_last_seen_at : game.white_last_seen_at;

  if (!opponentLastSeenAt) {
    return { abandoned: false };
  }

  const staleSinceMs = now.getTime() - new Date(opponentLastSeenAt).getTime();
  if (staleSinceMs <= ABANDON_THRESHOLD_MS) {
    return { abandoned: false };
  }

  const { data: updated, error } = await supabaseAdmin
    .from('games')
    .update({
      status: 'abandoned',
      winner_id: callerId,
      ended_at: now.toISOString(),
    })
    .eq('id', game.id)
    .eq('status', 'in_progress')
    .select('*')
    .single();

  if (error || !updated) {
    // Lost the race (game already ended some other way) — not an error.
    return { abandoned: false };
  }

  await applyRankedResult(updated, callerId);

  return { abandoned: true, game: updated };
}

// Closes most of the "both players abandon simultaneously" gap: the
// heartbeat check above only ever runs as a side effect of a client polling
// the ONE game it's viewing, so if nobody's left with that game open, it
// never gets checked. This sweeps ALL of the caller's own in_progress games
// whenever they're authenticated anywhere in the app (wired into
// GET /api/auth/me, which fires on every authenticated page load) — reusing
// recordHeartbeatAndCheckAbandonment as-is means this also has the side
// benefit of refreshing the caller's presence on every game they're party
// to, not just the one open in the current tab.
export async function sweepAbandonedGamesForUser(userId: string): Promise<{ sweptGameIds: string[] }> {
  const { data: activeGames } = await supabaseAdmin
    .from('games')
    .select('*')
    .eq('status', 'in_progress')
    .or(`white_player_id.eq.${userId},black_player_id.eq.${userId}`)
    .limit(20);

  if (!activeGames || activeGames.length === 0) {
    return { sweptGameIds: [] };
  }

  const sweptGameIds: string[] = [];
  for (const game of activeGames) {
    const callerColor: PieceColor = game.white_player_id === userId ? 'white' : 'black';
    const { abandoned } = await recordHeartbeatAndCheckAbandonment(game, callerColor, userId);
    if (abandoned) {
      sweptGameIds.push(game.id);
    }
  }

  return { sweptGameIds };
}

// Closes the remaining gap above: when BOTH players go silent, there's no
// surviving caller left to run either check above for that specific game.
// Rather than a cron/background worker (deliberately absent everywhere in
// this codebase — see docs/MULTIPLAYER_PROGRESS.md), this reaps a small
// batch of *globally* stale games as a side effect of ANY authenticated
// user's traffic, not just the two players' own. Wired into
// GET /api/auth/me alongside (not replacing) sweepAbandonedGamesForUser.
// Capped at a small LIMIT since this runs on a hot path on every page load
// for every user — a larger backlog drains itself over a few requests
// rather than being paginated in one call, same trade-off as the existing
// per-user sweep's own .limit(20) above.
//
// No surviving participant means no one to credit a win to: these are
// scored as a mutual/rated draw (winner_id: null), which applyRankedResult
// already resolves to a clean 0.5/0.5 score with no special-casing needed.
const GLOBAL_SWEEP_BATCH_LIMIT = 5;

export async function sweepGloballyAbandonedGames(): Promise<{ sweptGameIds: string[] }> {
  const cutoff = new Date(Date.now() - ABANDON_THRESHOLD_MS).toISOString();

  const { data: staleGames } = await supabaseAdmin
    .from('games')
    .select('*')
    .eq('status', 'in_progress')
    .not('white_last_seen_at', 'is', null)
    .not('black_last_seen_at', 'is', null)
    .lte('white_last_seen_at', cutoff)
    .lte('black_last_seen_at', cutoff)
    .limit(GLOBAL_SWEEP_BATCH_LIMIT);

  if (!staleGames || staleGames.length === 0) {
    return { sweptGameIds: [] };
  }

  const sweptGameIds: string[] = [];
  for (const game of staleGames) {
    const { data: updated, error } = await supabaseAdmin
      .from('games')
      .update({
        status: 'abandoned',
        winner_id: null,
        ended_at: new Date().toISOString(),
      })
      .eq('id', game.id)
      .eq('status', 'in_progress')
      .select('*')
      .single();

    if (error || !updated) {
      // Lost the race — e.g. one side's own heartbeat/sweep already
      // resolved this game in the moment between the select above and now.
      continue;
    }

    await applyRankedResult(updated, null);
    sweptGameIds.push(updated.id);
  }

  return { sweptGameIds };
}
