import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { createSupabaseAdminMock, ok } from '@/lib/supabase.test-utils';
import { signAuthToken } from '@/lib/jwt';

const supabaseAdminMock = createSupabaseAdminMock();
vi.mock('@/lib/supabase', () => ({ supabaseAdmin: supabaseAdminMock }));

const applyRankedResultMock = vi.fn().mockResolvedValue(undefined);
vi.mock('@/lib/server/applyGameResult', () => ({ applyRankedResult: applyRankedResultMock }));

const { POST } = await import('./route');

const WHITE_ID = 'white-user-id';
const BLACK_ID = 'black-user-id';

function freshGameRow(overrides: Record<string, any> = {}) {
  return {
    id: 'game-1',
    mode: 'casual',
    variant: 'unboxed',
    status: 'in_progress',
    white_player_id: WHITE_ID,
    black_player_id: BLACK_ID,
    moves: [],
    turn: 'white',
    initial_time_sec: null,
    increment_sec: null,
    created_at: new Date().toISOString(),
    ...overrides,
  };
}

function postRequest(body: unknown, token?: string) {
  const headers = new Headers({ 'content-type': 'application/json' });
  if (token) headers.set('cookie', `auth-token=${token}`);
  return new NextRequest('http://localhost/api/games/game-1/move', {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
}

function params(gameId = 'game-1') {
  return { params: Promise.resolve({ gameId }) };
}

describe('POST /api/games/[gameId]/move', () => {
  beforeEach(() => {
    supabaseAdminMock.reset();
    applyRankedResultMock.mockClear();
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('rejects an unauthenticated request', async () => {
    const res = await POST(postRequest({ from: 'e2', to: 'e4' }), params());
    expect(res.status).toBe(401);
  });

  it('rejects a malformed body', async () => {
    const token = signAuthToken({ userId: WHITE_ID, username: 'white' });
    const res = await POST(postRequest({ from: 'e' }, token), params());
    expect(res.status).toBe(400);
  });

  it('returns 404 when the game does not exist', async () => {
    const token = signAuthToken({ userId: WHITE_ID, username: 'white' });
    supabaseAdminMock.queueResult({ data: null, error: { message: 'not found' } });
    const res = await POST(postRequest({ from: 'e2', to: 'e4' }, token), params());
    expect(res.status).toBe(404);
  });

  it('rejects a user who is not a player in the game', async () => {
    const token = signAuthToken({ userId: 'some-other-user', username: 'eve' });
    supabaseAdminMock.queueResult(ok(freshGameRow()));
    const res = await POST(postRequest({ from: 'e2', to: 'e4' }, token), params());
    expect(res.status).toBe(403);
  });

  it("rejects a move attempted out of turn (not this player's turn)", async () => {
    const token = signAuthToken({ userId: BLACK_ID, username: 'black' });
    supabaseAdminMock.queueResult(ok(freshGameRow({ turn: 'white' })));
    const res = await POST(postRequest({ from: 'e7', to: 'e5' }, token), params());
    expect(res.status).toBe(409);
  });

  it('rejects an illegal move server-side, regardless of client claims', async () => {
    const token = signAuthToken({ userId: WHITE_ID, username: 'white' });
    supabaseAdminMock.queueResult(ok(freshGameRow()));
    const res = await POST(postRequest({ from: 'e2', to: 'e5' }, token), params());
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.success).toBe(false);
  });

  it('accepts a legal move, persists it, and switches turn', async () => {
    const token = signAuthToken({ userId: WHITE_ID, username: 'white' });
    supabaseAdminMock.queueResults([ok(freshGameRow()), ok(null)]);

    const res = await POST(postRequest({ from: 'e2', to: 'e4' }, token), params());
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.turn).toBe('black');
    expect(body.data.move.from).toBe('e2');
    expect(body.data.move.to).toBe('e4');

    const updateBuilder = supabaseAdminMock.from.mock.results[1].value;
    const updatePayload = updateBuilder.update.mock.calls[0][0];
    expect(updatePayload.turn).toBe('black');
    expect(updatePayload.moves).toHaveLength(1);
  });

  it('rejects bot games, since they are not driven through this endpoint', async () => {
    const token = signAuthToken({ userId: WHITE_ID, username: 'white' });
    supabaseAdminMock.queueResult(ok(freshGameRow({ mode: 'bot' })));
    const res = await POST(postRequest({ from: 'e2', to: 'e4' }, token), params());
    expect(res.status).toBe(400);
  });
});
