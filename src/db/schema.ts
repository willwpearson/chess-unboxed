import { pgTable, uuid, text, boolean, integer, timestamp, jsonb } from 'drizzle-orm/pg-core';

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
  mode: text('mode').notNull(), // 'bot' | 'private' | 'ranked'
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
  lobbyId: uuid('lobby_id'), // FK added once the `lobbies` table exists (Phase 2)
  ratingChangeWhite: integer('rating_change_white'),
  ratingChangeBlack: integer('rating_change_black'),
  lastMoveAt: timestamp('last_move_at', { withTimezone: true }),
  drawOfferedBy: uuid('draw_offered_by').references(() => users.id),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type UserSession = typeof userSessions.$inferSelect;
export type NewUserSession = typeof userSessions.$inferInsert;
export type Game = typeof games.$inferSelect;
export type NewGame = typeof games.$inferInsert;
