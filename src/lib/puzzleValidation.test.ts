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

  it('flags a puzzle as wraparound-dependent when the mate only holds under wraparound rules', () => {
    // Rb1-b8 is itself a plain vertical slide (no file displacement at
    // all), but it's only checkmate because the rook's rank-8 attack on
    // g8 reaches around the wrapped edge past the f8 bishop — see the
    // comment on this puzzle in puzzles.seed.ts.
    const puzzle = puzzlesSeed.find((p) => p.slug === 'wrap-rook-back-rank-001')!;
    const result = validatePuzzleSolution(puzzle);
    expect(result.valid, result.error).toBe(true);
    expect(result.usedWraparound).toBe(true);
  });

  it('flags a puzzle as NOT wraparound-dependent when the mate holds under standard rules too', () => {
    // King boxed on b8 (nowhere near the a/h-file wrap edge), mated by a
    // plain vertical rook approach along the d-file followed by a short,
    // unobstructed rank-8 attack entirely within the b-d range. Nothing
    // here depends on wraparound geometry.
    const result = validatePuzzleSolution({
      slug: 'standard-style-fixture',
      startingFen: '1k6/ppp5/8/8/8/8/8/K2R4 w - - 0 1',
      sideToMove: 'white',
      solutionMoves: [{ from: 'd1', to: 'd8' }],
      isWraparoundMode: true,
    });
    expect(result.valid, result.error).toBe(true);
    expect(result.usedWraparound).toBe(false);
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
