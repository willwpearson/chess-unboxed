import { describe, expect, it } from 'vitest';
import { validatePuzzleSolution } from './puzzleValidation';
import { puzzlesSeed } from '@/data/puzzles.seed';

describe('validatePuzzleSolution', () => {
  it('validates every curated seed puzzle', () => {
    for (const puzzle of puzzlesSeed) {
      const result = validatePuzzleSolution(puzzle);
      expect(result.valid, result.error).toBe(true);
    }
  });

  it('rejects an illegal move in the solution', () => {
    const result = validatePuzzleSolution({
      slug: 'bad-illegal-move',
      startingFen: '5bk1/5ppp/8/8/8/8/8/KR6 w - - 0 1',
      sideToMove: 'white',
      solutionMoves: [{ from: 'b1', to: 'c3' }], // rook can't move like that
      isWraparoundMode: true,
    });
    expect(result.valid).toBe(false);
  });

  it('rejects a legal move that does not end in checkmate', () => {
    const result = validatePuzzleSolution({
      slug: 'bad-no-mate',
      startingFen: '5bk1/5ppp/8/8/8/8/8/KR6 w - - 0 1',
      sideToMove: 'white',
      solutionMoves: [{ from: 'b1', to: 'b2' }], // legal, but no mate
      isWraparoundMode: true,
    });
    expect(result.valid).toBe(false);
  });

  it('rejects an empty solution', () => {
    const result = validatePuzzleSolution({
      slug: 'bad-empty',
      startingFen: '5bk1/5ppp/8/8/8/8/8/KR6 w - - 0 1',
      sideToMove: 'white',
      solutionMoves: [],
      isWraparoundMode: true,
    });
    expect(result.valid).toBe(false);
  });
});
