import { beforeEach, describe, expect, it } from 'vitest';
import { NextRequest } from 'next/server';
import { vi } from 'vitest';
import { createSupabaseAdminMock, ok } from '@/lib/supabase.test-utils';
import { signAuthToken } from '@/lib/jwt';

const supabaseAdminMock = createSupabaseAdminMock();
vi.mock('@/lib/supabase', () => ({ supabaseAdmin: supabaseAdminMock }));

const { GET } = await import('./route');

const USER_ID = 'user-1';

function ratingRow(overrides: Record<string, any> = {}) {
  return {
    id: 'rating-1',
    user_id: USER_ID,
    rating: 1350,
    peak_rating: 1400,
    puzzles_attempted: 12,
    puzzles_solved: 9,
    ...overrides,
  };
}

function getRequest(token?: string) {
  const headers = new Headers();
  if (token) headers.set('cookie', `auth-token=${token}`);
  return new NextRequest('http://localhost/api/puzzles/rating', { headers });
}

describe('GET /api/puzzles/rating', () => {
  beforeEach(() => {
    supabaseAdminMock.reset();
  });

  it('rejects an unauthenticated request', async () => {
    const res = await GET(getRequest());
    expect(res.status).toBe(401);
  });

  it('returns the caller\'s existing puzzle rating', async () => {
    const token = signAuthToken({ userId: USER_ID, username: 'u' });
    supabaseAdminMock.queueResult(ok(ratingRow()));

    const res = await GET(getRequest(token));
    const body = await res.json();

    expect(body.success).toBe(true);
    expect(body.data).toEqual({
      rating: 1350,
      peakRating: 1400,
      puzzlesAttempted: 12,
      puzzlesSolved: 9,
    });
  });

  it('creates and returns a fresh rating row on first call', async () => {
    const token = signAuthToken({ userId: USER_ID, username: 'u' });
    const created = ratingRow({ rating: 1200, peak_rating: 1200, puzzles_attempted: 0, puzzles_solved: 0 });
    supabaseAdminMock.queueResults([
      { data: null, error: { message: 'not found' } }, // select -> not found
      ok(created), // insert().select().single()
    ]);

    const res = await GET(getRequest(token));
    const body = await res.json();

    expect(body.success).toBe(true);
    expect(body.data).toEqual({
      rating: 1200,
      peakRating: 1200,
      puzzlesAttempted: 0,
      puzzlesSolved: 0,
    });
  });

  it('returns 500 if the rating row cannot be loaded or created', async () => {
    const token = signAuthToken({ userId: USER_ID, username: 'u' });
    supabaseAdminMock.queueResults([
      { data: null, error: { message: 'db down' } },
      { data: null, error: { message: 'db down' } },
    ]);

    const res = await GET(getRequest(token));
    expect(res.status).toBe(500);
  });
});
