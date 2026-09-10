import { describe, expect, it } from 'vitest';
import {
  findPreset,
  getDefaultPreset,
  isTimeControlBucket,
  TIME_CONTROL_BUCKETS,
  TIME_CONTROL_PRESETS,
} from './timeControls';

describe('isTimeControlBucket', () => {
  it('accepts every known bucket', () => {
    for (const bucket of TIME_CONTROL_BUCKETS) {
      expect(isTimeControlBucket(bucket)).toBe(true);
    }
  });

  it('rejects unknown strings and non-strings', () => {
    expect(isTimeControlBucket('unlimited')).toBe(false);
    expect(isTimeControlBucket(42)).toBe(false);
    expect(isTimeControlBucket(undefined)).toBe(false);
  });
});

describe('getDefaultPreset', () => {
  it("returns each bucket's first (legacy) preset", () => {
    for (const bucket of TIME_CONTROL_BUCKETS) {
      expect(getDefaultPreset(bucket)).toEqual(TIME_CONTROL_PRESETS[bucket][0]);
    }
  });
});

describe('findPreset', () => {
  it('finds a preset by id within its bucket', () => {
    expect(findPreset('blitz', 'blitz-180+2')).toEqual({
      id: 'blitz-180+2',
      label: '3+2',
      initialTimeSec: 180,
      incrementSec: 2,
    });
  });

  it('returns undefined for an id in the wrong bucket', () => {
    expect(findPreset('bullet', 'blitz-180+2')).toBeUndefined();
  });

  it('returns undefined for an unknown id', () => {
    expect(findPreset('blitz', 'nonexistent')).toBeUndefined();
  });
});
