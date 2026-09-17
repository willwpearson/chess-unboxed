import { describe, expect, it } from 'vitest';
import { generate, sweep } from './backRankSliderWrap';
import { validatePuzzleSolution } from '@/lib/puzzleValidation';

describe('backRankSliderWrap motif', () => {
  it('every generated candidate is a valid, correctly-classified checkmate puzzle', () => {
    let produced = 0;
    for (const params of sweep()) {
      const candidate = generate(params);
      if (!candidate) continue;
      produced++;

      const result = validatePuzzleSolution(candidate);
      expect(result.valid, `${candidate.slug}: ${result.error}`).toBe(true);
      expect(
        result.usedWraparound,
        `${candidate.slug}: expected usedWraparound=${params.forceWrap}`
      ).toBe(params.forceWrap);
    }

    // Sanity: the sweep must actually produce a meaningful number of
    // puzzles, not silently null out everything.
    expect(produced).toBeGreaterThan(10);
  });

  it('returns null for standard-style requests with an edge-file king (would gain a wraparound-only escape square)', () => {
    expect(generate({ attackerColor: 'white', kingFile: 0, forceWrap: false, pieceType: 'rook' })).toBeNull();
    expect(generate({ attackerColor: 'white', kingFile: 7, forceWrap: false, pieceType: 'rook' })).toBeNull();
  });
});
