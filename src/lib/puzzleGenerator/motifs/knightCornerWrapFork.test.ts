import { describe, expect, it } from 'vitest';
import { generate, sweep } from './knightCornerWrapFork';
import { validatePuzzleSolution } from '@/lib/puzzleValidation';

describe('knightCornerWrapFork motif', () => {
  it('every generated candidate is a valid, wraparound-dependent checkmate puzzle', () => {
    let produced = 0;
    for (const params of sweep()) {
      const candidate = generate(params);
      if (!candidate) continue;
      produced++;

      const result = validatePuzzleSolution(candidate);
      expect(result.valid, `${candidate.slug}: ${result.error}`).toBe(true);
      expect(result.usedWraparound, `${candidate.slug}: expected wraparound-dependent`).toBe(true);
    }

    expect(produced).toBe(4); // 2 colors x 2 corners
  });
});
