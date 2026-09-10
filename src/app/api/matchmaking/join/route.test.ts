import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { createSupabaseAdminMock, ok } from '@/lib/supabase.test-utils';
import { signAuthToken } from '@/lib/jwt';

const supabaseAdminMock = createSupabaseAdminMock();
vi.mock('@/lib/supabase', () => ({ supabaseAdmin: supabaseAdminMock }));

vi.mock('@/lib/rateLimit', () => ({
  rateLimit: vi.fn(() => ({ allowed: true })),
  getClientIp: vi.fn(() => 'test-ip'),
}));

const { POST } = await import('./route');

const USER_ID = 'user-1';
const VALID_BODY = { queueType: 'casual', timeControl: 'blitz', presetId: 'blitz-300+0' };

function joinRequest(body: unknown, token?: string) {
  const headers = new Headers({ 'content-type': 'application/json' });
  if (token) headers.set('cookie', `auth-token=${token}`);
  return new NextRequest('http://localhost/api/matchmaking/join', {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
}

function authToken(userId = USER_ID) {
  return signAuthToken({ userId, username: 'player' });
}

describe('POST /api/matchmaking/join', () => {
  beforeEach(() => {
    supabaseAdminMock.reset();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('rejects an unauthenticated request', async () => {
    const res = await POST(joinRequest(VALID_BODY));
    expect(res.status).toBe(401);
  });

  it('rejects an unknown time control preset', async () => {
    const res = await POST(joinRequest({ ...VALID_BODY, presetId: 'not-a-real-preset' }, authToken()));
    expect(res.status).toBe(400);
  });

  it('rejects a guest account trying to queue ranked', async () => {
    supabaseAdminMock.queueResult(ok({ is_guest: true }));
    const res = await POST(
      joinRequest({ ...VALID_BODY, queueType: 'ranked' }, authToken())
    );
    expect(res.status).toBe(403);
  });

  it('rejects joining while already in an active game', async () => {
    supabaseAdminMock.queueResult(ok({ id: 'active-game' }));
    const res = await POST(joinRequest(VALID_BODY, authToken()));
    expect(res.status).toBe(409);
  });

  it('rejects joining while already searching', async () => {
    supabaseAdminMock.queueResults([
      { data: null, error: { message: 'not found' } }, // no active game
      ok({ id: 'existing-entry' }), // already queued
    ]);
    const res = await POST(joinRequest(VALID_BODY, authToken()));
    expect(res.status).toBe(409);
  });

  it('joins the waiting queue when no candidate is available', async () => {
    supabaseAdminMock.queueResults([
      { data: null, error: { message: 'not found' } }, // no active game
      { data: null, error: { message: 'not found' } }, // not already queued
      ok([]), // no candidates
      ok({ id: 'queue-entry-1' }), // insert waiting entry
    ]);

    const res = await POST(joinRequest(VALID_BODY, authToken()));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.status).toBe('waiting');
    expect(body.data.queueId).toBe('queue-entry-1');
  });

  it('pairs immediately with a waiting candidate and creates a game', async () => {
    const candidate = {
      id: 'candidate-1',
      user_id: 'opponent-1',
      expires_at: new Date(Date.now() + 60_000).toISOString(),
      created_at: new Date().toISOString(),
      rating_snapshot: null,
    };
    const claimed = { ...candidate, status: 'matched' };
    const game = { id: 'game-1' };

    supabaseAdminMock.queueResults([
      { data: null, error: { message: 'not found' } }, // no active game
      { data: null, error: { message: 'not found' } }, // not already queued
      ok([candidate]), // one candidate
      ok(claimed), // atomic claim succeeds
      ok(game), // game created
      ok(null), // self audit queue row insert
      ok(null), // claimed row's matched_game_id update
    ]);

    const res = await POST(joinRequest(VALID_BODY, authToken()));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.status).toBe('matched');
    expect(body.data.gameId).toBe('game-1');
    expect(['white', 'black']).toContain(body.data.color);
  });
});
