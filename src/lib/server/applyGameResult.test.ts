import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createSupabaseAdminMock, ok } from '@/lib/supabase.test-utils';

const supabaseAdminMock = createSupabaseAdminMock();
vi.mock('@/lib/supabase', () => ({ supabaseAdmin: supabaseAdminMock }));

const { applyRankedResult } = await import('./applyGameResult');

const WHITE_ID = 'white-user-id';
const BLACK_ID = 'black-user-id';

function baseGame(overrides: Partial<Parameters<typeof applyRankedResult>[0]> = {}) {
  return {
    id: 'game-1',
    mode: 'ranked',
    time_control: 'blitz',
    white_player_id: WHITE_ID,
    black_player_id: BLACK_ID,
    ...overrides,
  };
}

function ratingRow(userId: string, overrides: Record<string, any> = {}) {
  return {
    id: `rating-${userId}`,
    user_id: userId,
    time_control: 'blitz',
    rating: 1500,
    peak_rating: 1500,
    games_played: 20,
    wins: 0,
    losses: 0,
    draws: 0,
    ...overrides,
  };
}

describe('applyRankedResult', () => {
  beforeEach(() => {
    supabaseAdminMock.reset();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('is a no-op for non-ranked games', async () => {
    await applyRankedResult(baseGame({ mode: 'casual' }) as any, WHITE_ID);
    expect(supabaseAdminMock.from).not.toHaveBeenCalled();
  });

  it('applies a win/loss rating delta to both existing rating rows', async () => {
    const white = ratingRow(WHITE_ID);
    const black = ratingRow(BLACK_ID);

    supabaseAdminMock.queueResults([
      ok(white), // getOrCreateRating(white) select
      ok(black), // getOrCreateRating(black) select
      ok(null), // applyDelta(white) update
      ok(null), // applyDelta(black) update
      ok(null), // games rating_change update
    ]);

    await applyRankedResult(baseGame() as any, WHITE_ID);

    // getOrCreateRating x2 (select), applyDelta x2 (update), games update = 5 `.from()` calls
    expect(supabaseAdminMock.from).toHaveBeenCalledTimes(5);
    expect(supabaseAdminMock.from).toHaveBeenCalledWith('user_ratings');
    expect(supabaseAdminMock.from).toHaveBeenCalledWith('games');
  });

  it('creates a rating row lazily when none exists yet', async () => {
    const createdWhite = ratingRow(WHITE_ID, { rating: 1200, peak_rating: 1200, games_played: 0 });
    const black = ratingRow(BLACK_ID);

    supabaseAdminMock.queueResults([
      ok(null), // getOrCreateRating(white) select -> not found
      ok(createdWhite), // getOrCreateRating(white) insert().select().single()
      ok(black), // getOrCreateRating(black) select
      ok(null), // applyDelta(white) update
      ok(null), // applyDelta(black) update
      ok(null), // games update
    ]);

    await applyRankedResult(baseGame() as any, BLACK_ID);

    expect(supabaseAdminMock.from).toHaveBeenCalledTimes(6);
  });

  it('never lets the new rating drop below the rating floor', async () => {
    // White is a heavy underdog (rating 105 vs 2400) and loses — the raw
    // delta would push the rating well under 0 without the floor clamp.
    const lowWhite = ratingRow(WHITE_ID, { rating: 105, games_played: 30 });
    const black = ratingRow(BLACK_ID, { rating: 2400, games_played: 200 });

    supabaseAdminMock.queueResults([ok(lowWhite), ok(black), ok(null), ok(null), ok(null)]);

    await applyRankedResult(baseGame() as any, BLACK_ID);

    const whiteUpdateBuilder = supabaseAdminMock.from.mock.results[2].value;
    const updatePayload = whiteUpdateBuilder.update.mock.calls[0][0];
    expect(updatePayload.rating).toBeGreaterThanOrEqual(100);
  });

  it('swallows errors and does not throw, since the game result was already persisted', async () => {
    supabaseAdminMock.queueResults([
      { data: null, error: { message: 'db down' } },
      { data: null, error: { message: 'db down' } },
    ]);

    await expect(applyRankedResult(baseGame() as any, WHITE_ID)).resolves.toBeUndefined();
  });
});
