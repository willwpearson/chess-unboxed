import { pgTable, uuid, text, boolean, integer, timestamp, jsonb, uniqueIndex, index, type AnyPgColumn } from 'drizzle-orm/pg-core';

// Source of truth for the Supabase Postgres schema, replacing the
// hand-written `Database` type in src/lib/supabase.ts. This migration
// captures the schema as it actually exists today (including columns like
// `is_guest` that were already being written to by src/app/api/auth/guest
// before any migration formally declared them) — see
// docs/MULTIPLAYER_PROGRESS.md for the reconciliation history.

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  email: text('email'),
  username: text('username').notNull().unique(),
  displayName: text('display_name'),
  bio: text('bio'),
  avatarUrl: text('avatar_url'),
  country: text('country'),
  timezone: text('timezone'),
  birthDate: text('birth_date'),
  isVerified: boolean('is_verified').notNull().default(false),
  isActive: boolean('is_active').notNull().default(true),
  isGuest: boolean('is_guest').notNull().default(false),
  lastSeen: timestamp('last_seen', { withTimezone: true }).notNull().defaultNow(),
  premiumUntil: timestamp('premium_until', { withTimezone: true }),
  fideRating: integer('fide_rating'),
  preferredTimeControl: text('preferred_time_control'),
  playstyleTags: text('playstyle_tags').array(),
  totalGames: integer('total_games').notNull().default(0),
  wins: integer('wins').notNull().default(0),
  losses: integer('losses').notNull().default(0),
  draws: integer('draws').notNull().default(0),
  currentRating: integer('current_rating').notNull().default(1200),
  peakRating: integer('peak_rating').notNull().default(1200),
  profileVisibility: text('profile_visibility').notNull().default('public'),
  allowFriendRequests: boolean('allow_friend_requests').notNull().default(true),
  showOnlineStatus: boolean('show_online_status').notNull().default(true),
  passwordHash: text('password_hash'),
});

export const userSessions = pgTable('user_sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  deviceInfo: jsonb('device_info'),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  isActive: boolean('is_active').notNull().default(true),
});

// Phase 2: private invite-code lobbies. A lobby is a pre-game handshake —
// once a second player joins, a `games` row is created and the lobby just
// points at it (`gameId`) for the host's waiting-room to redirect on. No
// `rated` column exists here at all: private/lobby games can never be rated
// (matchmaking-only), enforced structurally rather than as an app-level
// check that Phase 3 could forget.
export const lobbies = pgTable('lobbies', {
  id: uuid('id').primaryKey().defaultRandom(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  hostId: uuid('host_id').notNull().references(() => users.id),
  inviteCode: text('invite_code').notNull().unique(),
  status: text('status').notNull().default('waiting'), // 'waiting' | 'active' | 'cancelled' | 'expired'
  variant: text('variant').notNull().default('unboxed'),
  timeControl: text('time_control'), // 'bullet' | 'blitz' | 'rapid' | 'classical', null = untimed
  initialTimeSec: integer('initial_time_sec'),
  incrementSec: integer('increment_sec'),
  hostColorPreference: text('host_color_preference').notNull().default('random'), // 'white' | 'black' | 'random'
  gameId: uuid('game_id').references((): AnyPgColumn => games.id),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  joinedAt: timestamp('joined_at', { withTimezone: true }),
  cancelledAt: timestamp('cancelled_at', { withTimezone: true }),
});

// Phase 1: added server-authoritative move-persistence columns. `moves`
// (the full ChessMove[] history) is the source of truth for reconstructing
// game state server-side — `fen` is a cached fast-read for broadcasting the
// current position, NOT used for reconstruction (see
// docs/MULTIPLAYER_PROGRESS.md: WraparoundChessEngine.fen() never reflects
// wraparound-move board changes, only the initial position + turn flag, so
// FEN cannot round-trip a wraparound game's real position).
export const games = pgTable('games', {
  id: uuid('id').primaryKey().defaultRandom(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  endedAt: timestamp('ended_at', { withTimezone: true }),
  mode: text('mode').notNull(), // 'bot' | 'private' | 'ranked' | 'casual'
  variant: text('variant').notNull().default('unboxed'),
  whitePlayerId: uuid('white_player_id').references(() => users.id),
  blackPlayerId: uuid('black_player_id').references(() => users.id),
  winnerId: uuid('winner_id').references(() => users.id),
  status: text('status').notNull().default('in_progress'), // 'in_progress' | 'completed' | 'abandoned'
  moves: jsonb('moves').notNull().default([]),
  timeControl: text('time_control'), // 'bullet' | 'blitz' | 'rapid' | 'classical', null = untimed
  initialTimeSec: integer('initial_time_sec'),
  incrementSec: integer('increment_sec'),
  whiteTimeMs: integer('white_time_ms'),
  blackTimeMs: integer('black_time_ms'),
  fen: text('fen'), // cached fast-read only, see note above
  turn: text('turn'), // 'white' | 'black'
  lobbyId: uuid('lobby_id').references((): AnyPgColumn => lobbies.id), // Phase 2: FK now that `lobbies` exists
  ratingChangeWhite: integer('rating_change_white'),
  ratingChangeBlack: integer('rating_change_black'),
  lastMoveAt: timestamp('last_move_at', { withTimezone: true }),
  drawOfferedBy: uuid('draw_offered_by').references(() => users.id),
  // Phase 4: heartbeat-based abandonment detection (src/lib/server/abandonment.ts).
  // Null means "never seen" (e.g. bot games, or rows created before this
  // column existed) and is deliberately never treated as stale/forfeitable.
  whiteLastSeenAt: timestamp('white_last_seen_at', { withTimezone: true }),
  blackLastSeenAt: timestamp('black_last_seen_at', { withTimezone: true }),
}, (table) => ({
  // Phase 5: supports "all of my in_progress games" (src/lib/server/abandonment.ts's
  // sweepAbandonedGamesForUser), queried as an OR across white/black player id.
  whitePlayerStatusIdx: index('games_white_player_status_idx').on(table.whitePlayerId, table.status),
  blackPlayerStatusIdx: index('games_black_player_status_idx').on(table.blackPlayerId, table.status),
}));

// Phase 3: per-time-control ELO. Rows are created lazily — only when a
// ranked game between two players in a given bucket actually completes
// (see src/lib/server/applyGameResult.ts) — never eagerly at signup, so a
// user with no ranked games in a bucket simply has no row for it.
export const userRatings = pgTable('user_ratings', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  timeControl: text('time_control').notNull(), // 'bullet' | 'blitz' | 'rapid' | 'classical'
  rating: integer('rating').notNull().default(1200),
  peakRating: integer('peak_rating').notNull().default(1200),
  gamesPlayed: integer('games_played').notNull().default(0),
  wins: integer('wins').notNull().default(0),
  losses: integer('losses').notNull().default(0),
  draws: integer('draws').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  userTimeControlIdx: uniqueIndex('user_ratings_user_id_time_control_idx').on(table.userId, table.timeControl),
}));

// Phase 3: two-sided matchmaking pool. A player joining either finds and
// atomically claims an existing 'waiting' row (pairing them immediately) or
// inserts itself as 'waiting' for a future joiner to claim — see
// src/app/api/matchmaking/join/route.ts. No host/joiner distinction, unlike
// `lobbies`, since neither side initiated on the other's behalf.
export const matchmakingQueue = pgTable('matchmaking_queue', {
  id: uuid('id').primaryKey().defaultRandom(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  userId: uuid('user_id').notNull().references(() => users.id),
  queueType: text('queue_type').notNull(), // 'ranked' | 'casual'
  variant: text('variant').notNull().default('unboxed'),
  timeControl: text('time_control').notNull(), // 'bullet' | 'blitz' | 'rapid' | 'classical' — matchmaking has no untimed pool
  initialTimeSec: integer('initial_time_sec').notNull(),
  incrementSec: integer('increment_sec').notNull(),
  ratingSnapshot: integer('rating_snapshot'), // informational only in v1; null for casual/guests
  status: text('status').notNull().default('waiting'), // 'waiting' | 'matched' | 'cancelled' | 'expired'
  matchedGameId: uuid('matched_game_id').references(() => games.id),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  matchedAt: timestamp('matched_at', { withTimezone: true }),
  cancelledAt: timestamp('cancelled_at', { withTimezone: true }),
}, (table) => ({
  // Phase 5: extended with initialTimeSec/incrementSec — multi-preset time
  // controls means pairing must match on the exact preset, not just the
  // bucket (src/lib/timeControls.ts, src/app/api/matchmaking/join/route.ts).
  pairingIdx: index('matchmaking_queue_pairing_idx').on(table.queueType, table.timeControl, table.initialTimeSec, table.incrementSec, table.status, table.createdAt),
}));

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type UserSession = typeof userSessions.$inferSelect;
export type NewUserSession = typeof userSessions.$inferInsert;
export type Lobby = typeof lobbies.$inferSelect;
export type NewLobby = typeof lobbies.$inferInsert;
export type Game = typeof games.$inferSelect;
export type NewGame = typeof games.$inferInsert;
export type UserRating = typeof userRatings.$inferSelect;
export type NewUserRating = typeof userRatings.$inferInsert;
export type MatchmakingQueueEntry = typeof matchmakingQueue.$inferSelect;
export type NewMatchmakingQueueEntry = typeof matchmakingQueue.$inferInsert;
