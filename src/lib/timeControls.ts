// Time-control bucket presets. Used as the authoritative seconds for
// matchmaking (never client-trusted there, since a pool is shared across
// many players) and as the source values for the private-lobby UI's
// shortcut picker (client-trusted there, since a lobby only affects its own
// two participants). See docs/MULTIPLAYER_PROGRESS.md Open Questions.
//
// Each bucket holds one or more concrete presets (e.g. Blitz 5+0 vs 3+2).
// Ranked/casual matchmaking pools are scoped to a single exact preset (see
// src/app/api/matchmaking/join/route.ts) — two players must pick the same
// preset id to be paired, not just the same bucket. ELO rating stays scoped
// to the bucket, not the preset (src/db/schema.ts's user_ratings table).
// Each bucket's first entry is its default/legacy preset — unchanged from
// before multi-preset support existed, so old games/queue rows still match.

export type TimeControlBucket = 'bullet' | 'blitz' | 'rapid' | 'classical';

export interface TimeControlPreset {
  id: string;
  label: string; // e.g. "5+0"
  initialTimeSec: number;
  incrementSec: number;
}

export const TIME_CONTROL_PRESETS: Record<TimeControlBucket, TimeControlPreset[]> = {
  bullet: [
    { id: 'bullet-60+0', label: '1+0', initialTimeSec: 60, incrementSec: 0 },
    { id: 'bullet-60+1', label: '1+1', initialTimeSec: 60, incrementSec: 1 },
    { id: 'bullet-120+1', label: '2+1', initialTimeSec: 120, incrementSec: 1 },
  ],
  blitz: [
    { id: 'blitz-300+0', label: '5+0', initialTimeSec: 300, incrementSec: 0 },
    { id: 'blitz-180+2', label: '3+2', initialTimeSec: 180, incrementSec: 2 },
    { id: 'blitz-300+3', label: '5+3', initialTimeSec: 300, incrementSec: 3 },
  ],
  rapid: [
    { id: 'rapid-600+0', label: '10+0', initialTimeSec: 600, incrementSec: 0 },
    { id: 'rapid-600+5', label: '10+5', initialTimeSec: 600, incrementSec: 5 },
    { id: 'rapid-900+10', label: '15+10', initialTimeSec: 900, incrementSec: 10 },
  ],
  classical: [
    { id: 'classical-1800+0', label: '30+0', initialTimeSec: 1800, incrementSec: 0 },
    { id: 'classical-1800+20', label: '30+20', initialTimeSec: 1800, incrementSec: 20 },
    { id: 'classical-2700+0', label: '45+0', initialTimeSec: 2700, incrementSec: 0 },
  ],
};

export const TIME_CONTROL_BUCKETS: TimeControlBucket[] = ['bullet', 'blitz', 'rapid', 'classical'];

export function isTimeControlBucket(value: unknown): value is TimeControlBucket {
  return typeof value === 'string' && (TIME_CONTROL_BUCKETS as string[]).includes(value);
}

export function getDefaultPreset(bucket: TimeControlBucket): TimeControlPreset {
  return TIME_CONTROL_PRESETS[bucket][0];
}

export function findPreset(bucket: TimeControlBucket, presetId: string): TimeControlPreset | undefined {
  return TIME_CONTROL_PRESETS[bucket].find((preset) => preset.id === presetId);
}

// Classifies an arbitrary initial time into the bucket it's closest to, for
// contexts (like a private lobby's custom time control) that need *some*
// bucket label for a value outside the curated preset table. Cosmetic only —
// private-lobby games are never rated, so this has no ELO impact — mirrors
// the boundaries implicit in the preset table above.
export function classifyBucket(initialTimeSec: number): TimeControlBucket {
  if (initialTimeSec < 180) return 'bullet';
  if (initialTimeSec < 600) return 'blitz';
  if (initialTimeSec < 1800) return 'rapid';
  return 'classical';
}
