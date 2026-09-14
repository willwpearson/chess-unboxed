import { beforeEach, describe, expect, it, vi } from 'vitest';
import { usePuzzleStore } from './puzzleStore';
import { useGameStore } from './gameStore';

const PUZZLE = {
  puzzleId: 'puzzle-1',
  startingFen: '5bk1/5ppp/8/8/8/8/8/KR6 w - - 0 1',
  sideToMove: 'white' as const,
  isWraparoundMode: true,
  rating: 1100,
};

const initialGameState = useGameStore.getState();
const initialPuzzleState = usePuzzleStore.getState();

beforeEach(() => {
  useGameStore.setState(initialGameState, true);
  usePuzzleStore.setState(initialPuzzleState, true);
  vi.spyOn(console, 'log').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

function mockFetchOnce(data: unknown) {
  global.fetch = vi.fn().mockResolvedValue({
    json: () => Promise.resolve({ success: true, data }),
  }) as any;
}

describe('loadPuzzle', () => {
  it('initializes the shared game manager and resets puzzle session state', () => {
    usePuzzleStore.getState().loadPuzzle(PUZZLE);

    expect(usePuzzleStore.getState().currentPuzzle).toEqual(PUZZLE);
    expect(usePuzzleStore.getState().moveIndex).toBe(0);
    expect(usePuzzleStore.getState().status).toBe('idle');
    expect(useGameStore.getState().gameManager).not.toBeNull();
  });
});

describe('submitMove', () => {
  beforeEach(() => {
    usePuzzleStore.getState().loadPuzzle(PUZZLE);
  });

  it('marks the puzzle solved on a correct final move', async () => {
    mockFetchOnce({ correct: true, solved: true, done: true, ratingChange: 14 });

    await usePuzzleStore.getState().submitMove('b1', 'b8', undefined, 'practice');

    expect(usePuzzleStore.getState().status).toBe('solved');
    expect(usePuzzleStore.getState().ratingChange).toBe(14);
  });

  it('applies the opponent reply and advances moveIndex on a correct non-final move', async () => {
    mockFetchOnce({ correct: true, solved: false, done: false, opponentReply: { from: 'e7', to: 'e5' } });

    await usePuzzleStore.getState().submitMove('e2', 'e4', undefined, 'practice');

    expect(usePuzzleStore.getState().status).toBe('correct-continue');
    expect(usePuzzleStore.getState().moveIndex).toBe(2);
  });

  it('rolls the board back to the puzzle start on a wrong move', async () => {
    mockFetchOnce({ correct: false, solved: false, done: true, ratingChange: -9 });

    await usePuzzleStore.getState().submitMove('b1', 'b2', undefined, 'practice');

    expect(usePuzzleStore.getState().status).toBe('failed');
    expect(usePuzzleStore.getState().ratingChange).toBe(-9);
    // Board should be reset back to the puzzle's starting position.
    expect(useGameStore.getState().currentGame?.moves).toHaveLength(0);
  });

  it('does nothing when no puzzle is loaded', async () => {
    usePuzzleStore.getState().reset();
    await usePuzzleStore.getState().submitMove('b1', 'b8', undefined, 'practice');
    expect(usePuzzleStore.getState().status).toBe('idle');
  });
});
