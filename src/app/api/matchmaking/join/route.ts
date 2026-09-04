import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseAdmin } from '@/lib/supabase';
import { getAuthUserId } from '@/lib/server/authUser';
import { rateLimit } from '@/lib/rateLimit';
import { TIME_CONTROL_PRESETS } from '@/lib/timeControls';
import type { PieceColor } from '@/types/game';

// Phase 3: matchmaking. One shared queue/pairing mechanism for both
// flavors, split by queueType — 'ranked' requires a real (non-guest)
// account and updates ELO via applyRankedResult on completion; 'casual' is
// open to everyone (including guests) and never touches ratings. Mirrors
// how Lichess/chess.com gate rated play behind an account while letting
// anyone quick-pair casually.
//
// No background worker/cron exists in this codebase, so pairing happens
// synchronously here: a join attempts to atomically claim an existing
// waiting candidate — a two-sided extension of the single-target
// compare-and-swap in src/app/api/lobbies/join/route.ts, claiming someone
// else's row instead of guarding only your own insert — falling back to
// inserting itself as 'waiting' if no candidate could be claimed.

const QUEUE_ENTRY_TTL_MS = 2 * 60 * 1000;
const CANDIDATE_BATCH_SIZE = 5;

const joinSchema = z.object({
  queueType: z.enum(['ranked', 'casual']),
  timeControl: z.enum(['bullet', 'blitz', 'rapid', 'classical']),
});

export async function POST(request: NextRequest) {
  const userId = getAuthUserId(request);
  if (!userId) {
    return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
  }

  const { allowed, retryAfterSeconds } = rateLimit(`matchmaking-join:${userId}`, 10, 60 * 60 * 1000);
  if (!allowed) {
    return NextResponse.json(
      { success: false, error: 'Too many matchmaking attempts. Please try again later.' },
      { status: 429, headers: retryAfterSeconds ? { 'Retry-After': String(retryAfterSeconds) } : undefined }
    );
  }

  let body;
  try {
    body = joinSchema.parse(await request.json());
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: err.errors[0].message }, { status: 400 });
    }
    return NextResponse.json({ success: false, error: 'Invalid request body' }, { status: 400 });
  }

  const { queueType, timeControl } = body;

  if (queueType === 'ranked') {
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('is_guest')
      .eq('id', userId)
      .single();
    if (userError || !user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }
    if (user.is_guest) {
      return NextResponse.json(
        { success: false, error: 'Guest accounts cannot play ranked matches' },
        { status: 403 }
      );
    }
  }

  const { data: activeGame } = await supabaseAdmin
    .from('games')
    .select('id')
    .eq('status', 'in_progress')
    .or(`white_player_id.eq.${userId},black_player_id.eq.${userId}`)
    .single();
  if (activeGame) {
    return NextResponse.json({ success: false, error: 'You are already in a game' }, { status: 409 });
  }

  const { data: existingQueueEntry } = await supabaseAdmin
    .from('matchmaking_queue')
    .select('id')
    .eq('user_id', userId)
    .eq('status', 'waiting')
    .single();
  if (existingQueueEntry) {
    return NextResponse.json(
      { success: false, error: 'You are already searching for a match' },
      { status: 409 }
    );
  }

  const preset = TIME_CONTROL_PRESETS[timeControl];

  let ratingSnapshot: number | null = null;
  if (queueType === 'ranked') {
    const { data: ratingRow } = await supabaseAdmin
      .from('user_ratings')
      .select('rating')
      .eq('user_id', userId)
      .eq('time_control', timeControl)
      .single();
    ratingSnapshot = ratingRow?.rating ?? 1200;
  }

  const now = Date.now();

  const { data: candidates } = await supabaseAdmin
    .from('matchmaking_queue')
    .select('*')
    .eq('queue_type', queueType)
    .eq('time_control', timeControl)
    .eq('status', 'waiting')
    .neq('user_id', userId)
    .order('created_at', { ascending: true })
    .limit(CANDIDATE_BATCH_SIZE);

  for (const candidate of candidates ?? []) {
    if (new Date(candidate.expires_at).getTime() < now) {
      await supabaseAdmin
        .from('matchmaking_queue')
        .update({ status: 'expired' })
        .eq('id', candidate.id)
        .eq('status', 'waiting');
      continue;
    }

    // Atomic claim: only succeeds if the candidate is still 'waiting' at the
    // moment of the update — this is what closes the race between two
    // joiners both trying to pair with the same waiting entry.
    const { data: claimed, error: claimError } = await supabaseAdmin
      .from('matchmaking_queue')
      .update({ status: 'matched', matched_at: new Date(now).toISOString() })
      .eq('id', candidate.id)
      .eq('status', 'waiting')
      .select('*')
      .single();

    if (claimError || !claimed) {
      continue; // Someone else claimed it first — try the next candidate.
    }

    const selfWhite = Math.random() < 0.5;
    const whitePlayerId = selfWhite ? userId : claimed.user_id;
    const blackPlayerId = selfWhite ? claimed.user_id : userId;
    const selfColor: PieceColor = selfWhite ? 'white' : 'black';

    const initialTimeMs = preset.initialTimeSec * 1000;

    const { data: game, error: gameError } = await supabaseAdmin
      .from('games')
      .insert({
        mode: queueType,
        variant: 'unboxed',
        white_player_id: whitePlayerId,
        black_player_id: blackPlayerId,
        status: 'in_progress',
        moves: [],
        time_control: timeControl,
        initial_time_sec: preset.initialTimeSec,
        increment_sec: preset.incrementSec,
        white_time_ms: initialTimeMs,
        black_time_ms: initialTimeMs,
        turn: 'white',
        white_last_seen_at: new Date(now).toISOString(),
        black_last_seen_at: new Date(now).toISOString(),
      })
      .select('*')
      .single();

    if (gameError || !game) {
      console.error('Failed to create game from matchmaking:', gameError);
      return NextResponse.json({ success: false, error: 'Failed to create game' }, { status: 500 });
    }

    // Symmetric audit row for self (skips 'waiting' entirely, matching
    // `claimed`'s now-'matched' status), then point both rows at the game.
    await supabaseAdmin.from('matchmaking_queue').insert({
      user_id: userId,
      queue_type: queueType,
      variant: 'unboxed',
      time_control: timeControl,
      initial_time_sec: preset.initialTimeSec,
      increment_sec: preset.incrementSec,
      rating_snapshot: ratingSnapshot,
      status: 'matched',
      matched_game_id: game.id,
      expires_at: new Date(now + QUEUE_ENTRY_TTL_MS).toISOString(),
      matched_at: new Date(now).toISOString(),
    });

    await supabaseAdmin
      .from('matchmaking_queue')
      .update({ matched_game_id: game.id })
      .eq('id', claimed.id);

    return NextResponse.json({
      success: true,
      data: { status: 'matched', gameId: game.id, color: selfColor },
      timestamp: now,
    });
  }

  const { data: queueEntry, error: insertError } = await supabaseAdmin
    .from('matchmaking_queue')
    .insert({
      user_id: userId,
      queue_type: queueType,
      variant: 'unboxed',
      time_control: timeControl,
      initial_time_sec: preset.initialTimeSec,
      increment_sec: preset.incrementSec,
      rating_snapshot: ratingSnapshot,
      status: 'waiting',
      expires_at: new Date(now + QUEUE_ENTRY_TTL_MS).toISOString(),
    })
    .select('*')
    .single();

  if (insertError || !queueEntry) {
    console.error('Failed to join matchmaking queue:', insertError);
    return NextResponse.json({ success: false, error: 'Failed to join matchmaking queue' }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    data: { status: 'waiting', queueId: queueEntry.id },
    timestamp: now,
  });
}
