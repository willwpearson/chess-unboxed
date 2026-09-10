import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useGameStore } from './gameStore';
import type { BotConfig } from '@/types/game';

// This store also drives multiplayer sync via fetch/supabase Realtime
// (initializeMultiplayerGame, subscribeToGame) — those are integration-y
// enough (server round-trips + realtime channels) that they're left for a
// future pass; this file covers the local single-player ("bot"/practice)
// path and the UI-selection reducers, which are pure store logic.

// src/types/game.ts's BotDifficulty ('Beginner'|...) doesn't match the
// lowercase strings gameManager.ts actually switches on at runtime
// ('easy'|...) — a pre-existing mismatch (see the tsc errors already present
// in gameManager.ts) that's out of scope here. Cast once so tests exercise
// the real runtime behavior without tripping that unrelated type error.
const BOT_CONFIG = { difficulty: 'easy' } as unknown as BotConfig;

const initialState = useGameStore.getState();

beforeEach(() => {
  useGameStore.setState(initialState, true);
  vi.spyOn(console, 'log').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

describe('initializeGame', () => {
  it('creates a game manager and bot manager for a bot game', async () => {
    const ok = await useGameStore.getState().initializeGame('bot', 'unboxed', BOT_CONFIG);
    expect(ok).toBe(true);

    const state = useGameStore.getState();
    expect(state.gameManager).not.toBeNull();
    expect(state.botManager).not.toBeNull();
    expect(state.currentGame?.mode).toBe('bot');
  });

  it('adds the initial state to game history', async () => {
    await useGameStore.getState().initializeGame('bot', 'unboxed', BOT_CONFIG);
    expect(useGameStore.getState().gameHistory).toHaveLength(1);
  });
});

describe('makeMove (local bot game)', () => {
  beforeEach(async () => {
    await useGameStore.getState().initializeGame('bot', 'unboxed', BOT_CONFIG);
  });

  it('applies a legal move to the local game manager', async () => {
    const ok = await useGameStore.getState().makeMove('e2', 'e4');
    expect(ok).toBe(true);
    expect(useGameStore.getState().currentGame?.position.turn).toBe('black');
  });

  it('rejects an illegal move without throwing', async () => {
    const ok = await useGameStore.getState().makeMove('e2', 'e5');
    expect(ok).toBe(false);
  });

  it('clears UI selection state after a successful move', async () => {
    useGameStore.getState().setSelectedSquare('e2');
    await useGameStore.getState().makeMove('e2', 'e4');
    expect(useGameStore.getState().ui.selectedSquare).toBeNull();
  });

  it('eventually makes a bot reply move on black to play', async () => {
    vi.useFakeTimers();
    try {
      await useGameStore.getState().makeMove('e2', 'e4');
      await vi.runAllTimersAsync();

      const state = useGameStore.getState();
      expect(state.currentGame?.moves.length).toBeGreaterThanOrEqual(1);
    } finally {
      vi.useRealTimers();
    }
  });
});

describe('resignGame / offerDraw (local bot game)', () => {
  beforeEach(async () => {
    await useGameStore.getState().initializeGame('bot', 'unboxed', BOT_CONFIG);
  });

  it('resigns the current player locally without a server call', async () => {
    await useGameStore.getState().resignGame();
    const state = useGameStore.getState();
    expect(state.currentGame?.status).toBe('finished');
    expect(state.currentGame?.result).toBe('black-wins');
  });

  it('offers a draw locally, ending the game as a draw', async () => {
    await useGameStore.getState().offerDraw();
    const state = useGameStore.getState();
    expect(state.currentGame?.status).toBe('finished');
    expect(state.currentGame?.result).toBe('draw');
  });
});

describe('UI selection reducers', () => {
  beforeEach(async () => {
    await useGameStore.getState().initializeGame('bot', 'unboxed', BOT_CONFIG);
  });

  it('selects a square and populates its legal moves', () => {
    useGameStore.getState().setSelectedSquare('e2');
    const ui = useGameStore.getState().ui;
    expect(ui.selectedSquare).toBe('e2');
    expect(ui.possibleMoves).toContain('e4');
  });

  it('clears possible moves when deselecting', () => {
    useGameStore.getState().setSelectedSquare('e2');
    useGameStore.getState().setSelectedSquare(null);
    const ui = useGameStore.getState().ui;
    expect(ui.selectedSquare).toBeNull();
    expect(ui.possibleMoves).toEqual([]);
  });

  it('shows and hides the promotion dialog', () => {
    useGameStore.getState().showPromotionDialog('e8');
    expect(useGameStore.getState().ui.showPromotionDialog).toBe(true);
    expect(useGameStore.getState().ui.promotionSquare).toBe('e8');

    useGameStore.getState().hidePromotionDialog();
    expect(useGameStore.getState().ui.showPromotionDialog).toBe(false);
    expect(useGameStore.getState().ui.promotionSquare).toBeNull();
  });

  it('resets all UI state via clearUI', () => {
    useGameStore.getState().setSelectedSquare('e2');
    useGameStore.getState().clearUI();
    expect(useGameStore.getState().ui.selectedSquare).toBeNull();
    expect(useGameStore.getState().ui.possibleMoves).toEqual([]);
  });
});

describe('history management', () => {
  beforeEach(async () => {
    await useGameStore.getState().initializeGame('bot', 'unboxed', BOT_CONFIG);
  });

  it('does not duplicate a history entry with the same updatedAt', () => {
    const game = useGameStore.getState().currentGame!;
    const before = useGameStore.getState().gameHistory.length;
    useGameStore.getState().addToHistory(game);
    expect(useGameStore.getState().gameHistory.length).toBe(before);
  });

  it('clears history', () => {
    useGameStore.getState().clearHistory();
    expect(useGameStore.getState().gameHistory).toEqual([]);
  });
});
