import { beforeEach, describe, expect, it } from 'vitest';
import { NextRequest } from 'next/server';
import { vi } from 'vitest';
import { createSupabaseAdminMock, ok } from '@/lib/supabase.test-utils';
import { signAuthToken } from '@/lib/jwt';

const supabaseAdminMock = createSupabaseAdminMock();
vi.mock('@/lib/supabase', () => ({ supabaseAdmin: supabaseAdminMock }));

const { GET } = await import('./route');

const USER_ID = 'user-1';

function puzzle(id: string) {
  return { id, starting_fen: '8/8/8/8/8/8/8/8 w - - 0 1', side_to_move: 'white', is_wraparound_mode: true, rating: 1200 };
}

function getRequest(token?: string) {
  const headers = new Headers();
  if (token) headers.set('cookie', `auth-token=${token}`);
  return new NextRequest('http://localhost/api/puzzles/daily', { headers });
}

describe('GET /api/puzzles/daily', () => {
  beforeEach(() => {
    supabaseAdminMock.reset();
  });

  it('rejects an unauthenticated request', async () => {
    const res = await GET(getRequest());
    expect(res.status).toBe(401);
  });

  it('returns the same puzzle deterministically and the caller\'s attempt status', async () => {
    const token = signAuthToken({ userId: USER_ID, username: 'u' });
    const pool = [puzzle('a'), puzzle('b'), puzzle('c')];
    supabaseAdminMock.queueResults([ok(pool), ok({ solved: true })]);

    const res = await GET(getRequest(token));
    const body = await res.json();

    expect(body.success).toBe(true);
    expect(pool.map((p) => p.id)).toContain(body.data.puzzleId);
    expect(body.data.attempted).toBe(true);
    expect(body.data.solved).toBe(true);
  });

  it('reports attempted: false when the caller has no attempt yet', async () => {
    const token = signAuthToken({ userId: USER_ID, username: 'u' });
    supabaseAdminMock.queueResults([
      ok([puzzle('a')]),
      { data: null, error: { message: 'not found' } },
    ]);

    const res = await GET(getRequest(token));
    const body = await res.json();
    expect(body.data.attempted).toBe(false);
    expect(body.data.solved).toBeNull();
  });

  it('returns 404 when there are no active puzzles', async () => {
    const token = signAuthToken({ userId: USER_ID, username: 'u' });
    supabaseAdminMock.queueResult(ok([]));

    const res = await GET(getRequest(token));
    expect(res.status).toBe(404);
  });
});
