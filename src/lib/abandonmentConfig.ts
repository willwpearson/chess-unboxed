// Shared between client (src/store/gameStore.ts, heartbeat interval) and
// server (src/lib/server/abandonment.ts, staleness check) — kept here rather
// than in the server-only module so the client bundle never pulls in
// supabaseAdmin just to read a constant.

export const HEARTBEAT_INTERVAL_MS = 20_000;
export const ABANDON_THRESHOLD_MS = 75_000;
