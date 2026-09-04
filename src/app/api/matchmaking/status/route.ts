import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getAuthUserId } from '@/lib/server/authUser';

// The waiting page's ~5s polling fallback (Realtime doesn't fire against
// the dev-mode devDb mock) — deliberately unrate-limited, same reasoning as
// GET /api/lobbies/[lobbyId].

export async function GET(request: NextRequest) {
  const userId = getAuthUserId(request);
  if (!userId) {
    return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
  }

  const queueId = request.nextUrl.searchParams.get('queueId');
  if (!queueId) {
    return NextResponse.json({ success: false, error: 'queueId is required' }, { status: 400 });
  }

  const { data: entry, error } = await supabaseAdmin
    .from('matchmaking_queue')
    .select('*')
    .eq('id', queueId)
    .single();

  if (error || !entry) {
    return NextResponse.json({ success: false, error: 'Queue entry not found' }, { status: 404 });
  }

  if (entry.user_id !== userId) {
    return NextResponse.json({ success: false, error: 'Not your queue entry' }, { status: 403 });
  }

  if (entry.status === 'waiting' && new Date(entry.expires_at).getTime() < Date.now()) {
    const { data: expired } = await supabaseAdmin
      .from('matchmaking_queue')
      .update({ status: 'expired' })
      .eq('id', queueId)
      .select('*')
      .single();
    const row = expired ?? entry;
    return NextResponse.json({
      success: true,
      data: { status: row.status, matchedGameId: row.matched_game_id, expiresAt: row.expires_at },
      timestamp: Date.now(),
    });
  }

  return NextResponse.json({
    success: true,
    data: { status: entry.status, matchedGameId: entry.matched_game_id, expiresAt: entry.expires_at },
    timestamp: Date.now(),
  });
}
