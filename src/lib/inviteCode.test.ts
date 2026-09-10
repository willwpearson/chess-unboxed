import { describe, expect, it } from 'vitest';
import { generateInviteCode } from './inviteCode';

describe('generateInviteCode', () => {
  it('generates a 6-character code', () => {
    expect(generateInviteCode()).toHaveLength(6);
  });

  it('never includes ambiguous characters (0, O, 1, I)', () => {
    for (let i = 0; i < 200; i++) {
      const code = generateInviteCode();
      expect(code).not.toMatch(/[01OI]/);
    }
  });

  it('only uses uppercase alphanumeric characters', () => {
    const code = generateInviteCode();
    expect(code).toMatch(/^[A-Z0-9]+$/);
  });

  it('generates distinct codes across calls', () => {
    const codes = new Set(Array.from({ length: 50 }, () => generateInviteCode()));
    expect(codes.size).toBeGreaterThan(1);
  });
});
