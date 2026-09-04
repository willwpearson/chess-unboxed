import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getAuthUserId } from '@/lib/server/authUser';

// Host-only status fetch. This is the deliberate ~5s polling fallback the
// waiting room uses alongside its Realtime subscription (Realtime doesn't
// fire against the dev-mode devDb mock) — no rate limit here on purpose.

export async function GET(request: NextRequest, { params }: { params: Promise<{ lobbyId: string }> }) {
  const { lobbyId } = await params;

  const userId = getAuthUserId(request);
  if (!userId) {
    return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
  }

  const { data: lobby, error } = await supabaseAdmin.from('lobbies').select('*').eq('id', lobbyId).single();

  if (error || !lobby) {
    return NextResponse.json({ success: false, error: 'Lobby not found' }, { status: 404 });
  }

  if (lobby.host_id !== userId) {
    return NextResponse.json({ success: false, error: 'You are not the host of this lobby' }, { status: 403 });
  }

  if (lobby.status === 'waiting' && new Date(lobby.expires_at).getTime() < Date.now()) {
    const { data: expired } = await supabaseAdmin
      .from('lobbies')
      .update({ status: 'expired' })
      .eq('id', lobbyId)
      .select('*')
      .single();
    return NextResponse.json({ success: true, data: { lobby: expired ?? lobby }, timestamp: Date.now() });
  }

  return NextResponse.json({ success: true, data: { lobby }, timestamp: Date.now() });
}
