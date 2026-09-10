import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createSupabaseAdminMock, ok } from '@/lib/supabase.test-utils';
import { ABANDON_THRESHOLD_MS } from '@/lib/abandonmentConfig';

const supabaseAdminMock = createSupabaseAdminMock();
vi.mock('@/lib/supabase', () => ({ supabaseAdmin: supabaseAdminMock }));

const applyRankedResultMock = vi.fn().mockResolvedValue(undefined);
vi.mock('@/lib/server/applyGameResult', () => ({ applyRankedResult: applyRankedResultMock }));

const { recordHeartbeatAndCheckAbandonment, sweepAbandonedGamesForUser } = await import('./abandonment');

function game(overrides: Record<string, any> = {}) {
  return {
    id: 'game-1',
    mode: 'casual',
    status: 'in_progress',
    winner_id: null,
    white_player_id: 'white-1',
    black_player_id: 'black-1',
    white_last_seen_at: null,
    black_last_seen_at: null,
    ...overrides,
  };
}

describe('recordHeartbeatAndCheckAbandonment', () => {
  beforeEach(() => {
    supabaseAdminMock.reset();
    applyRankedResultMock.mockClear();
    vi.useFakeTimers();
    vi.setSystemTime(0);
  });

  it('is not abandoned when the opponent has never been seen', async () => {
    supabaseAdminMock.queueResult(ok(null)); // heartbeat update
    const result = await recordHeartbeatAndCheckAbandonment(game(), 'white', 'white-1');
    expect(result.abandoned).toBe(false);
  });

  it('is not abandoned when the opponent was seen recently', async () => {
    const recentlySeen = new Date(0).toISOString();
    supabaseAdminMock.queueResult(ok(null)); // heartbeat update
    const result = await recordHeartbeatAndCheckAbandonment(
      game({ black_last_seen_at: recentlySeen }),
      'white',
      'white-1'
    );
    expect(result.abandoned).toBe(false);
  });

  it('marks the game abandoned once the opponent has been stale past the threshold', async () => {
    const staleSince = new Date(0);
    vi.setSystemTime(ABANDON_THRESHOLD_MS + 1);

    const abandonedRow = game({ status: 'abandoned', winner_id: 'white-1' });
    supabaseAdminMock.queueResults([
      ok(null), // heartbeat update
      ok(abandonedRow), // status transition update().eq().eq().select().single()
    ]);

    const result = await recordHeartbeatAndCheckAbandonment(
      game({ black_last_seen_at: staleSince.toISOString() }),
      'white',
      'white-1'
    );

    expect(result.abandoned).toBe(true);
    expect(result.game).toEqual(abandonedRow);
    expect(applyRankedResultMock).toHaveBeenCalledWith(abandonedRow, 'white-1');
  });

  it('does not report abandonment if it loses the race to end the game', async () => {
    vi.setSystemTime(ABANDON_THRESHOLD_MS + 1);
    supabaseAdminMock.queueResults([
      ok(null), // heartbeat update
      { data: null, error: { message: 'no rows updated' } }, // lost the race
    ]);

    const result = await recordHeartbeatAndCheckAbandonment(
      game({ black_last_seen_at: new Date(0).toISOString() }),
      'white',
      'white-1'
    );

    expect(result.abandoned).toBe(false);
    expect(applyRankedResultMock).not.toHaveBeenCalled();
  });
});

describe('sweepAbandonedGamesForUser', () => {
  beforeEach(() => {
    supabaseAdminMock.reset();
    applyRankedResultMock.mockClear();
    vi.useFakeTimers();
    vi.setSystemTime(0);
  });

  it('returns no swept games when the user has none in progress', async () => {
    supabaseAdminMock.queueResult(ok([]));
    const result = await sweepAbandonedGamesForUser('white-1');
    expect(result.sweptGameIds).toEqual([]);
  });

  it('sweeps a stale game and reports its id', async () => {
    vi.setSystemTime(ABANDON_THRESHOLD_MS + 1);
    const staleGame = game({ black_last_seen_at: new Date(0).toISOString() });
    const abandonedRow = { ...staleGame, status: 'abandoned', winner_id: 'white-1' };

    supabaseAdminMock.queueResults([
      ok([staleGame]), // active games lookup
      ok(null), // heartbeat update inside recordHeartbeatAndCheckAbandonment
      ok(abandonedRow), // status transition
    ]);

    const result = await sweepAbandonedGamesForUser('white-1');
    expect(result.sweptGameIds).toEqual(['game-1']);
  });
});
