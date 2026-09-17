import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { createSupabaseAdminMock, ok } from '@/lib/supabase.test-utils';
import { signAuthToken } from '@/lib/jwt';

const supabaseAdminMock = createSupabaseAdminMock();
vi.mock('@/lib/supabase', () => ({ supabaseAdmin: supabaseAdminMock }));

const { GET } = await import('./route');

const USER_ID = 'user-1';

function puzzle(id: string, rating: number) {
  return { id, starting_fen: '8/8/8/8/8/8/8/8 w - - 0 1', side_to_move: 'white', is_wraparound_mode: true, rating };
}

function getRequest(token?: string) {
  const headers = new Headers();
  if (token) headers.set('cookie', `auth-token=${token}`);
  return new NextRequest('http://localhost/api/puzzles/next', { headers });
}

describe('GET /api/puzzles/next', () => {
  beforeEach(() => {
    supabaseAdminMock.reset();
  });

  it('rejects an unauthenticated request', async () => {
    const res = await GET(getRequest());
    expect(res.status).toBe(401);
  });

  it('picks the closest-rated unseen puzzle', async () => {
    const token = signAuthToken({ userId: USER_ID, username: 'u' });
    supabaseAdminMock.queueResults([
      ok({ rating: 1400 }), // user_puzzle_ratings select
      ok([{ puzzle_id: 'seen-1' }]), // attempted puzzle ids
      ok([puzzle('seen-1', 1390), puzzle('far', 1000), puzzle('close', 1420)]),
    ]);

    const res = await GET(getRequest(token));
    const body = await res.json();

    expect(body.success).toBe(true);
    expect(body.data.puzzleId).toBe('close');
    expect(body.data).not.toHaveProperty('solutionMoves');
  });

  it('defaults to rating 1200 when the user has no puzzle rating yet', async () => {
    const token = signAuthToken({ userId: USER_ID, username: 'u' });
    supabaseAdminMock.queueResults([
      { data: null, error: { message: 'not found' } },
      ok([]),
      ok([puzzle('a', 1190), puzzle('b', 2000)]),
    ]);

    const res = await GET(getRequest(token));
    const body = await res.json();
    expect(body.data.puzzleId).toBe('a');
  });

  it('returns 404 when every active puzzle has already been attempted', async () => {
    const token = signAuthToken({ userId: USER_ID, username: 'u' });
    supabaseAdminMock.queueResults([
      ok({ rating: 1200 }),
      ok([{ puzzle_id: 'a' }]),
      ok([puzzle('a', 1200)]),
    ]);

    const res = await GET(getRequest(token));
    expect(res.status).toBe(404);
  });
});
