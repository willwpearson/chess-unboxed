import { describe, expect, it } from 'vitest';
import { computeRatingDelta, expectedScore, getKFactor } from './elo';

describe('getKFactor', () => {
  it('uses the provisional K-factor below 10 games regardless of rating', () => {
    expect(getKFactor(9, 2500)).toBe(40);
    expect(getKFactor(0, 1200)).toBe(40);
  });

  it('uses the low K-factor at or above 2000 once established', () => {
    expect(getKFactor(10, 2000)).toBe(20);
    expect(getKFactor(100, 2500)).toBe(20);
  });

  it('uses the standard K-factor for established players under 2000', () => {
    expect(getKFactor(10, 1999)).toBe(32);
    expect(getKFactor(50, 1200)).toBe(32);
  });
});

describe('expectedScore', () => {
  it('returns 0.5 for equal ratings', () => {
    expect(expectedScore(1500, 1500)).toBeCloseTo(0.5);
  });

  it('favors the higher-rated player', () => {
    expect(expectedScore(1600, 1400)).toBeGreaterThan(0.5);
    expect(expectedScore(1400, 1600)).toBeLessThan(0.5);
  });

  it('is symmetric around 0.5', () => {
    const higher = expectedScore(1600, 1400);
    const lower = expectedScore(1400, 1600);
    expect(higher + lower).toBeCloseTo(1);
  });
});

describe('computeRatingDelta', () => {
  it('awards a positive delta for a win against an equally-rated opponent', () => {
    const delta = computeRatingDelta(1500, 20, 1500, 1);
    expect(delta).toBe(16); // K=32 * (1 - 0.5)
  });

  it('awards a negative delta for a loss against an equally-rated opponent', () => {
    const delta = computeRatingDelta(1500, 20, 1500, 0);
    expect(delta).toBe(-16);
  });

  it('awards no delta for a draw between equally-rated players', () => {
    const delta = computeRatingDelta(1500, 20, 1500, 0.5);
    expect(delta).toBe(0);
  });

  it('uses the provisional K-factor for new players', () => {
    const delta = computeRatingDelta(1200, 3, 1200, 1);
    expect(delta).toBe(20); // K=40 * (1 - 0.5)
  });

  it('rounds the resulting delta to the nearest integer', () => {
    const delta = computeRatingDelta(1500, 20, 1450, 1);
    expect(Number.isInteger(delta)).toBe(true);
  });
});
