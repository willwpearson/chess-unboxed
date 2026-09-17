import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createSupabaseAdminMock, ok } from '@/lib/supabase.test-utils';

const supabaseAdminMock = createSupabaseAdminMock();
vi.mock('@/lib/supabase', () => ({ supabaseAdmin: supabaseAdminMock }));

const { applyPuzzleResult } = await import('./applyPuzzleResult');

const USER_ID = 'user-1';

function ratingRow(overrides: Record<string, any> = {}) {
  return {
    id: 'rating-1',
    user_id: USER_ID,
    rating: 1200,
    peak_rating: 1200,
    puzzles_attempted: 5,
    puzzles_solved: 3,
    ...overrides,
  };
}

describe('applyPuzzleResult', () => {
  beforeEach(() => {
    supabaseAdminMock.reset();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('applies a positive delta and increments puzzlesSolved when solved', async () => {
    const row = ratingRow({ rating: 1200, puzzles_attempted: 5, puzzles_solved: 3 });
    supabaseAdminMock.queueResults([ok(row), ok(null)]);

    const delta = await applyPuzzleResult(USER_ID, 1400, true);

    expect(delta).not.toBeNull();
    expect(delta).toBeGreaterThan(0);

    const updateBuilder = supabaseAdminMock.from.mock.results[1].value;
    const payload = updateBuilder.update.mock.calls[0][0];
    expect(payload.puzzles_attempted).toBe(6);
    expect(payload.puzzles_solved).toBe(4);
    expect(payload.rating).toBe(row.rating + (delta ?? 0));
  });

  it('applies a negative delta and does not increment puzzlesSolved when failed', async () => {
    const row = ratingRow({ rating: 1400, puzzles_attempted: 10, puzzles_solved: 8 });
    supabaseAdminMock.queueResults([ok(row), ok(null)]);

    const delta = await applyPuzzleResult(USER_ID, 1200, false);

    expect(delta).toBeLessThan(0);
    const updateBuilder = supabaseAdminMock.from.mock.results[1].value;
    const payload = updateBuilder.update.mock.calls[0][0];
    expect(payload.puzzles_solved).toBe(8);
    expect(payload.puzzles_attempted).toBe(11);
  });

  it('creates a rating row lazily when none exists yet', async () => {
    const created = ratingRow({ rating: 1200, puzzles_attempted: 0, puzzles_solved: 0 });
    supabaseAdminMock.queueResults([
      { data: null, error: { message: 'not found' } }, // select -> not found
      ok(created), // insert().select().single()
      ok(null), // update
    ]);

    const delta = await applyPuzzleResult(USER_ID, 1200, true);
    expect(delta).not.toBeNull();
    expect(supabaseAdminMock.from).toHaveBeenCalledWith('user_puzzle_ratings');
  });

  it('never lets the new rating drop below the rating floor', async () => {
    const lowRow = ratingRow({ rating: 105, puzzles_attempted: 50 });
    supabaseAdminMock.queueResults([ok(lowRow), ok(null)]);

    await applyPuzzleResult(USER_ID, 2400, false);

    const updateBuilder = supabaseAdminMock.from.mock.results[1].value;
    const payload = updateBuilder.update.mock.calls[0][0];
    expect(payload.rating).toBeGreaterThanOrEqual(100);
  });

  it('tracks peak rating', async () => {
    const row = ratingRow({ rating: 1500, peak_rating: 1500 });
    supabaseAdminMock.queueResults([ok(row), ok(null)]);

    await applyPuzzleResult(USER_ID, 2000, true);

    const updateBuilder = supabaseAdminMock.from.mock.results[1].value;
    const payload = updateBuilder.update.mock.calls[0][0];
    expect(payload.peak_rating).toBeGreaterThanOrEqual(1500);
    expect(payload.peak_rating).toBe(payload.rating);
  });

  it('swallows errors and returns null instead of throwing', async () => {
    supabaseAdminMock.queueResults([
      { data: null, error: { message: 'db down' } },
      { data: null, error: { message: 'db down' } },
    ]);

    await expect(applyPuzzleResult(USER_ID, 1200, true)).resolves.toBeNull();
  });
});
