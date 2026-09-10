import { describe, expect, it } from 'vitest';
import {
  classifyBucket,
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

describe('TIME_CONTROL_PRESETS', () => {
  it('has unique preset ids within each bucket', () => {
    for (const bucket of TIME_CONTROL_BUCKETS) {
      const ids = TIME_CONTROL_PRESETS[bucket].map((preset) => preset.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  it('has at least 3 presets per bucket', () => {
    for (const bucket of TIME_CONTROL_BUCKETS) {
      expect(TIME_CONTROL_PRESETS[bucket].length).toBeGreaterThanOrEqual(3);
    }
  });

  it('resolves the new alternate presets via findPreset', () => {
    expect(findPreset('bullet', 'bullet-120+1')).toEqual({
      id: 'bullet-120+1',
      label: '2+1',
      initialTimeSec: 120,
      incrementSec: 1,
    });
    expect(findPreset('blitz', 'blitz-300+3')).toEqual({
      id: 'blitz-300+3',
      label: '5+3',
      initialTimeSec: 300,
      incrementSec: 3,
    });
    expect(findPreset('rapid', 'rapid-900+10')).toEqual({
      id: 'rapid-900+10',
      label: '15+10',
      initialTimeSec: 900,
      incrementSec: 10,
    });
    expect(findPreset('classical', 'classical-2700+0')).toEqual({
      id: 'classical-2700+0',
      label: '45+0',
      initialTimeSec: 2700,
      incrementSec: 0,
    });
  });
});

describe('classifyBucket', () => {
  it('classifies below-180s as bullet', () => {
    expect(classifyBucket(60)).toBe('bullet');
    expect(classifyBucket(179)).toBe('bullet');
  });

  it('classifies 180s-599s as blitz', () => {
    expect(classifyBucket(180)).toBe('blitz');
    expect(classifyBucket(599)).toBe('blitz');
  });

  it('classifies 600s-1799s as rapid', () => {
    expect(classifyBucket(600)).toBe('rapid');
    expect(classifyBucket(1799)).toBe('rapid');
  });

  it('classifies 1800s and above as classical', () => {
    expect(classifyBucket(1800)).toBe('classical');
    expect(classifyBucket(10800)).toBe('classical');
  });
});
