import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { createSupabaseAdminMock, ok } from '@/lib/supabase.test-utils';
import { signAuthToken } from '@/lib/jwt';

const supabaseAdminMock = createSupabaseAdminMock();
vi.mock('@/lib/supabase', () => ({ supabaseAdmin: supabaseAdminMock }));

const applyPuzzleResultMock = vi.fn().mockResolvedValue(14);
vi.mock('@/lib/server/applyPuzzleResult', () => ({ applyPuzzleResult: applyPuzzleResultMock }));

const { POST } = await import('./route');

const USER_ID = 'user-1';

// Same one-move mate used by src/data/puzzles.seed.ts's wrap-rook-back-rank-001.
function puzzleRow(overrides: Record<string, any> = {}) {
  return {
    id: 'puzzle-1',
    starting_fen: '5bk1/5ppp/8/8/8/8/8/KR6 w - - 0 1',
    side_to_move: 'white',
    solution_moves: [{ from: 'b1', to: 'b8' }],
    rating: 1100,
    active: true,
    ...overrides,
  };
}

function postRequest(body: unknown, token?: string) {
  const headers = new Headers({ 'content-type': 'application/json' });
  if (token) headers.set('cookie', `auth-token=${token}`);
  return new NextRequest('http://localhost/api/puzzles/puzzle-1/attempt', {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
}

function params(puzzleId = 'puzzle-1') {
  return { params: Promise.resolve({ puzzleId }) };
}

describe('POST /api/puzzles/[puzzleId]/attempt', () => {
  beforeEach(() => {
    supabaseAdminMock.reset();
    applyPuzzleResultMock.mockClear();
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('rejects an unauthenticated request', async () => {
    const res = await POST(postRequest({ moveIndex: 0, from: 'b1', to: 'b8' }), params());
    expect(res.status).toBe(401);
  });

  it('rejects a malformed body', async () => {
    const token = signAuthToken({ userId: USER_ID, username: 'u' });
    const res = await POST(postRequest({ moveIndex: 0, from: 'b' }, token), params());
    expect(res.status).toBe(400);
  });

  it('returns 404 when the puzzle does not exist', async () => {
    const token = signAuthToken({ userId: USER_ID, username: 'u' });
    supabaseAdminMock.queueResult({ data: null, error: { message: 'not found' } });
    const res = await POST(postRequest({ moveIndex: 0, from: 'b1', to: 'b8' }, token), params());
    expect(res.status).toBe(404);
  });

  it('returns 404 for an inactive puzzle', async () => {
    const token = signAuthToken({ userId: USER_ID, username: 'u' });
    supabaseAdminMock.queueResult(ok(puzzleRow({ active: false })));
    const res = await POST(postRequest({ moveIndex: 0, from: 'b1', to: 'b8' }, token), params());
    expect(res.status).toBe(404);
  });

  it('returns the stored result without recomputing rating on a resubmit', async () => {
    const token = signAuthToken({ userId: USER_ID, username: 'u' });
    supabaseAdminMock.queueResults([
      ok(puzzleRow()),
      ok({ solved: true, rating_change: 14 }), // existing attempt row
    ]);

    const res = await POST(postRequest({ moveIndex: 0, from: 'b1', to: 'b8' }, token), params());
    const body = await res.json();

    expect(body.data.alreadyAttempted).toBe(true);
    expect(body.data.solved).toBe(true);
    expect(applyPuzzleResultMock).not.toHaveBeenCalled();
  });

  it('rejects a legal-but-wrong move and applies a losing rating result', async () => {
    const token = signAuthToken({ userId: USER_ID, username: 'u' });
    applyPuzzleResultMock.mockResolvedValueOnce(-9);
    supabaseAdminMock.queueResults([
      ok(puzzleRow()),
      { data: null, error: { message: 'not found' } }, // no existing attempt
      ok(null), // insert attempt
      ok(null), // update rating_change
    ]);

    const res = await POST(postRequest({ moveIndex: 0, from: 'b1', to: 'b2' }, token), params());
    const body = await res.json();

    expect(body.data.correct).toBe(false);
    expect(body.data.solved).toBe(false);
    expect(body.data.done).toBe(true);
    expect(applyPuzzleResultMock).toHaveBeenCalledWith(USER_ID, 1100, false);
  });

  it('rejects an illegal move', async () => {
    const token = signAuthToken({ userId: USER_ID, username: 'u' });
    supabaseAdminMock.queueResults([
      ok(puzzleRow()),
      { data: null, error: { message: 'not found' } },
      ok(null),
      ok(null),
    ]);

    const res = await POST(postRequest({ moveIndex: 0, from: 'b1', to: 'c3' }, token), params());
    const body = await res.json();
    expect(body.data.correct).toBe(false);
  });

  it('accepts the correct final move, solves the puzzle, and applies a winning rating result', async () => {
    const token = signAuthToken({ userId: USER_ID, username: 'u' });
    supabaseAdminMock.queueResults([
      ok(puzzleRow()),
      { data: null, error: { message: 'not found' } },
      ok(null), // insert attempt
      ok(null), // update rating_change
    ]);

    const res = await POST(postRequest({ moveIndex: 0, from: 'b1', to: 'b8' }, token), params());
    const body = await res.json();

    expect(body.data.correct).toBe(true);
    expect(body.data.solved).toBe(true);
    expect(body.data.done).toBe(true);
    expect(body.data.ratingChange).toBe(14);
    expect(applyPuzzleResultMock).toHaveBeenCalledWith(USER_ID, 1100, true);

    const insertBuilder = supabaseAdminMock.from.mock.results[2].value;
    const insertPayload = insertBuilder.insert.mock.calls[0][0];
    expect(insertPayload.solved).toBe(true);
    expect(insertPayload.source).toBe('practice');
  });

  it('rejects a moveIndex out of range for the puzzle', async () => {
    const token = signAuthToken({ userId: USER_ID, username: 'u' });
    supabaseAdminMock.queueResult(ok(puzzleRow()));
    const res = await POST(postRequest({ moveIndex: 5, from: 'b1', to: 'b8' }, token), params());
    expect(res.status).toBe(400);
  });

  it('returns an opponent reply and does not finalize on a correct non-final move', async () => {
    // A real 2-ply position isn't needed here — only that both moves are
    // chess-legal in sequence, to exercise the route's non-final-move branch
    // (finalize-on-mate is already covered above).
    const token = signAuthToken({ userId: USER_ID, username: 'u' });
    supabaseAdminMock.queueResults([
      ok(
        puzzleRow({
          starting_fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w - - 0 1',
          solution_moves: [
            { from: 'e2', to: 'e4' },
            { from: 'e7', to: 'e5' },
            { from: 'g1', to: 'f3' },
          ],
        })
      ),
      { data: null, error: { message: 'not found' } },
    ]);

    const res = await POST(postRequest({ moveIndex: 0, from: 'e2', to: 'e4' }, token), params());
    const body = await res.json();

    expect(body.data.correct).toBe(true);
    expect(body.data.done).toBe(false);
    expect(body.data.opponentReply).toEqual({ from: 'e7', to: 'e5' });
    expect(applyPuzzleResultMock).not.toHaveBeenCalled();
  });
});
