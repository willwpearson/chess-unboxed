import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseAdmin } from '@/lib/supabase';
import { getAuthUserId } from '@/lib/server/authUser';
import { rateLimit } from '@/lib/rateLimit';
import { generateInviteCode } from '@/lib/inviteCode';

// Phase 2: private invite-code lobbies. This route creates a lobby; the
// `games` row it eventually produces is written directly by
// /api/lobbies/join, not through POST /api/games (see that route for why).

const createLobbySchema = z
  .object({
    timeControl: z.enum(['bullet', 'blitz', 'rapid', 'classical']).nullable(),
    initialTimeSec: z.number().int().positive().optional(),
    incrementSec: z.number().int().nonnegative().optional(),
    colorPreference: z.enum(['white', 'black', 'random']).optional().default('random'),
  })
  .refine(
    (data) => data.timeControl === null || (data.initialTimeSec != null && data.incrementSec != null),
    { message: 'initialTimeSec and incrementSec are required when timeControl is set' }
  );

const MAX_INVITE_CODE_ATTEMPTS = 5;

async function generateUniqueInviteCode(): Promise<string | null> {
  for (let attempt = 0; attempt < MAX_INVITE_CODE_ATTEMPTS; attempt++) {
    const code = generateInviteCode();
    const { data } = await supabaseAdmin.from('lobbies').select('id').eq('invite_code', code).single();
    if (!data) return code;
  }
  return null;
}

export async function POST(request: NextRequest) {
  const userId = getAuthUserId(request);
  if (!userId) {
    return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
  }

  const { allowed, retryAfterSeconds } = rateLimit(`lobby-create:${userId}`, 10, 60 * 60 * 1000);
  if (!allowed) {
    return NextResponse.json(
      { success: false, error: 'Too many lobbies created. Please try again later.' },
      { status: 429, headers: retryAfterSeconds ? { 'Retry-After': String(retryAfterSeconds) } : undefined }
    );
  }

  let body;
  try {
    body = createLobbySchema.parse(await request.json());
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: err.errors[0].message }, { status: 400 });
    }
    return NextResponse.json({ success: false, error: 'Invalid request body' }, { status: 400 });
  }

  const inviteCode = await generateUniqueInviteCode();
  if (!inviteCode) {
    return NextResponse.json({ success: false, error: 'Failed to generate an invite code' }, { status: 500 });
  }

  const { data: lobby, error } = await supabaseAdmin
    .from('lobbies')
    .insert({
      host_id: userId,
      invite_code: inviteCode,
      status: 'waiting',
      variant: 'unboxed',
      time_control: body.timeControl,
      initial_time_sec: body.initialTimeSec ?? null,
      increment_sec: body.incrementSec ?? null,
      host_color_preference: body.colorPreference,
      expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    })
    .select('*')
    .single();

  if (error || !lobby) {
    console.error('Failed to create lobby:', error);
    return NextResponse.json({ success: false, error: 'Failed to create lobby' }, { status: 500 });
  }

  return NextResponse.json({ success: true, data: { lobby }, timestamp: Date.now() });
}
