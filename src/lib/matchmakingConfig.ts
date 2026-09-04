// Shared with src/app/api/matchmaking/join/route.ts's rating-band widening —
// kept in its own module to mirror src/lib/abandonmentConfig.ts's pattern.

// Ranked candidates within this many rating points of the joiner match
// immediately; the band widens the longer a candidate has been waiting, so
// a stale queue entry becomes matchable against a wider spread of ratings
// rather than sitting forever waiting for a close match that may never come.
export const RATING_BAND_BASE = 100;
export const RATING_BAND_WIDEN_PER_SEC = 5;
