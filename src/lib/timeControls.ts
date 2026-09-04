// Fixed time-control bucket presets. Used as the authoritative seconds for
// matchmaking (never client-trusted there, since a pool is shared across
// many players) and as the source values for the private-lobby UI's
// shortcut picker (client-trusted there, since a lobby only affects its own
// two participants). See docs/MULTIPLAYER_PROGRESS.md Open Questions.

export type TimeControlBucket = 'bullet' | 'blitz' | 'rapid' | 'classical';

export interface TimeControlPreset {
  label: string;
  initialTimeSec: number;
  incrementSec: number;
}

export const TIME_CONTROL_PRESETS: Record<TimeControlBucket, TimeControlPreset> = {
  bullet: { label: 'Bullet', initialTimeSec: 60, incrementSec: 0 },
  blitz: { label: 'Blitz', initialTimeSec: 300, incrementSec: 0 },
  rapid: { label: 'Rapid', initialTimeSec: 600, incrementSec: 0 },
  classical: { label: 'Classical', initialTimeSec: 1800, incrementSec: 0 },
};

export const TIME_CONTROL_BUCKETS: TimeControlBucket[] = ['bullet', 'blitz', 'rapid', 'classical'];

export function isTimeControlBucket(value: unknown): value is TimeControlBucket {
  return typeof value === 'string' && (TIME_CONTROL_BUCKETS as string[]).includes(value);
}
