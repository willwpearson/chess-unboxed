import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseAdmin } from '@/lib/supabase';
import { getAuthUserId } from '@/lib/server/authUser';
import { rateLimit, getClientIp } from '@/lib/rateLimit';
import type { PieceColor } from '@/types/game';

const joinSchema = z.object({
  code: z.string().min(6).max(6),
});

export async function POST(request: NextRequest) {
  const userId = getAuthUserId(request);
  if (!userId) {
    return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
  }

  // IP-keyed: the abuse vector here is guessing/enumerating invite codes,
  // not spamming from one account.
  const ip = getClientIp(request);
  const { allowed, retryAfterSeconds } = rateLimit(`lobby-join:${ip}`, 20, 15 * 60 * 1000);
  if (!allowed) {
    return NextResponse.json(
      { success: false, error: 'Too many attempts. Please try again later.' },
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

  const code = body.code.toUpperCase();

  const { data: lobby, error: fetchError } = await supabaseAdmin
    .from('lobbies')
    .select('*')
    .eq('invite_code', code)
    .single();

  if (fetchError || !lobby) {
    return NextResponse.json({ success: false, error: 'Invalid invite code' }, { status: 404 });
  }

  if (lobby.status === 'waiting' && new Date(lobby.expires_at).getTime() < Date.now()) {
    await supabaseAdmin.from('lobbies').update({ status: 'expired' }).eq('id', lobby.id);
    return NextResponse.json({ success: false, error: 'This lobby has expired' }, { status: 410 });
  }

  if (lobby.host_id === userId) {
    return NextResponse.json({ success: false, error: 'You cannot join your own lobby' }, { status: 400 });
  }

  if (lobby.status !== 'waiting') {
    return NextResponse.json({ success: false, error: 'This lobby is no longer available' }, { status: 409 });
  }

  // Atomic claim: only succeeds if the lobby is still 'waiting' at the
  // moment of the update, closing the race between two simultaneous joiners.
  const { data: claimed, error: claimError } = await supabaseAdmin
    .from('lobbies')
    .update({ status: 'active', joined_at: new Date().toISOString() })
    .eq('id', lobby.id)
    .eq('status', 'waiting')
    .select('*')
    .single();

  if (claimError || !claimed) {
    return NextResponse.json({ success: false, error: 'This lobby has already been joined' }, { status: 409 });
  }

  const hostWhite =
    claimed.host_color_preference === 'white'
      ? true
      : claimed.host_color_preference === 'black'
      ? false
      : Math.random() < 0.5;

  const whitePlayerId = hostWhite ? claimed.host_id : userId;
  const blackPlayerId = hostWhite ? userId : claimed.host_id;
  const joinerColor: PieceColor = hostWhite ? 'black' : 'white';

  const initialTimeMs = claimed.initial_time_sec != null ? claimed.initial_time_sec * 1000 : null;

  const { data: game, error: gameError } = await supabaseAdmin
    .from('games')
    .insert({
      mode: 'private',
      variant: 'unboxed',
      white_player_id: whitePlayerId,
      black_player_id: blackPlayerId,
      status: 'in_progress',
      moves: [],
      time_control: claimed.time_control,
      initial_time_sec: claimed.initial_time_sec,
      increment_sec: claimed.increment_sec,
      white_time_ms: initialTimeMs,
      black_time_ms: initialTimeMs,
      turn: 'white',
      lobby_id: claimed.id,
    })
    .select('*')
    .single();

  if (gameError || !game) {
    console.error('Failed to create game from lobby:', gameError);
    return NextResponse.json({ success: false, error: 'Failed to create game' }, { status: 500 });
  }

  await supabaseAdmin.from('lobbies').update({ game_id: game.id }).eq('id', claimed.id);

  return NextResponse.json({
    success: true,
    data: { gameId: game.id, color: joinerColor },
    timestamp: Date.now(),
  });
}
