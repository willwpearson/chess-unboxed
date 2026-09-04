import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getAuthUserId } from '@/lib/server/authUser';

export async function POST(request: NextRequest) {
  const userId = getAuthUserId(request);
  if (!userId) {
    return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
  }

  const { data: entry, error: fetchError } = await supabaseAdmin
    .from('matchmaking_queue')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'waiting')
    .single();

  if (fetchError || !entry) {
    return NextResponse.json({ success: false, error: 'You are not searching for a match' }, { status: 404 });
  }

  // Atomic: only succeeds if the entry is still 'waiting' — if a racing
  // join already claimed it, treat that as the entry having resolved out
  // from under the cancel rather than an error.
  const { data: cancelled, error: cancelError } = await supabaseAdmin
    .from('matchmaking_queue')
    .update({ status: 'cancelled', cancelled_at: new Date().toISOString() })
    .eq('id', entry.id)
    .eq('status', 'waiting')
    .select('*')
    .single();

  if (cancelError || !cancelled) {
    const { data: resolved } = await supabaseAdmin
      .from('matchmaking_queue')
      .select('*')
      .eq('id', entry.id)
      .single();

    return NextResponse.json(
      {
        success: false,
        error: 'You were matched just before your search could be cancelled',
        matchedGameId: resolved?.matched_game_id ?? null,
      },
      { status: 409 }
    );
  }

  return NextResponse.json({ success: true, timestamp: Date.now() });
}
