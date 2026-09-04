import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getAuthUserId } from '@/lib/server/authUser';
import { rateLimit } from '@/lib/rateLimit';

export async function POST(request: NextRequest, { params }: { params: Promise<{ lobbyId: string }> }) {
  const { lobbyId } = await params;

  const userId = getAuthUserId(request);
  if (!userId) {
    return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
  }

  const { allowed, retryAfterSeconds } = rateLimit(`lobby-cancel:${userId}`, 30, 60 * 60 * 1000);
  if (!allowed) {
    return NextResponse.json(
      { success: false, error: 'Too many requests. Please try again later.' },
      { status: 429, headers: retryAfterSeconds ? { 'Retry-After': String(retryAfterSeconds) } : undefined }
    );
  }

  const { data: lobby, error: fetchError } = await supabaseAdmin
    .from('lobbies')
    .select('*')
    .eq('id', lobbyId)
    .single();

  if (fetchError || !lobby) {
    return NextResponse.json({ success: false, error: 'Lobby not found' }, { status: 404 });
  }

  if (lobby.host_id !== userId) {
    return NextResponse.json({ success: false, error: 'You are not the host of this lobby' }, { status: 403 });
  }

  if (lobby.status !== 'waiting') {
    return NextResponse.json({ success: false, error: 'Lobby cannot be cancelled' }, { status: 409 });
  }

  const { error: updateError } = await supabaseAdmin
    .from('lobbies')
    .update({ status: 'cancelled', cancelled_at: new Date().toISOString() })
    .eq('id', lobbyId);

  if (updateError) {
    console.error('Failed to cancel lobby:', updateError);
    return NextResponse.json({ success: false, error: 'Failed to cancel lobby' }, { status: 500 });
  }

  return NextResponse.json({ success: true, data: { lobbyId }, timestamp: Date.now() });
}
