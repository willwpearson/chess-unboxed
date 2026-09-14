import { describe, expect, it } from 'vitest';
import { generatePuzzles } from './generate';

describe('generatePuzzles', () => {
  it('produces only valid puzzles with unique slugs and no duplicate positions', () => {
    const summary = generatePuzzles();

    expect(summary.puzzles.length).toBeGreaterThan(10);
    expect(summary.rejected).toEqual([]);

    const slugs = summary.puzzles.map((p) => p.slug);
    expect(new Set(slugs).size).toBe(slugs.length);

    const signatures = summary.puzzles.map((p) => `${p.startingFen}|${JSON.stringify(p.solutionMoves)}`);
    expect(new Set(signatures).size).toBe(signatures.length);
  });

  it('keeps ratings within the same band as the hand-authored set', () => {
    const summary = generatePuzzles();
    for (const puzzle of summary.puzzles) {
      expect(puzzle.rating).toBeGreaterThanOrEqual(1000);
      expect(puzzle.rating).toBeLessThanOrEqual(1800);
    }
  });

  it('is deterministic across calls (stable slugs and ratings for the same params)', () => {
    const first = generatePuzzles();
    const second = generatePuzzles();
    expect(second.puzzles).toEqual(first.puzzles);
  });

  it('tags every puzzle with exactly one of wraparound/standard-style, and never both', () => {
    const summary = generatePuzzles();
    for (const puzzle of summary.puzzles) {
      const hasWrap = puzzle.themes.includes('wraparound');
      const hasStandard = puzzle.themes.includes('standard-style');
      expect(hasWrap !== hasStandard).toBe(true);
    }
  });

  it('produces both wraparound-dependent and standard-style puzzles', () => {
    const summary = generatePuzzles();
    expect(summary.countsByClassification.wraparound).toBeGreaterThan(0);
    expect(summary.countsByClassification.standard).toBeGreaterThan(0);
  });
});
