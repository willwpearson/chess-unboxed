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
