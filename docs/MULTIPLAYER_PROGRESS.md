# Chess Unboxed — Multiplayer Progress Log

## Goal

Add the multiplayer framework: secure signup/login (already existed, hardened here), private invite-code hosted lobbies, and ranked matchmaking with per-time-control ELO — scoped to the Unboxed (toroidal) variant only. Full plan: `.claude/plans` history / this doc's Key Decisions below. See `docs/CONTEXT.md` for the pre-existing bot-only architecture this builds on.

## Key Decisions (durable — don't re-derive)

- **Realtime transport**: Supabase Realtime (Postgres Changes for game/lobby row updates + Presence) — no Socket.IO, no custom broadcast-from-server calls needed for v1.
- **Migration tooling**: Drizzle, newly wired up (it was a dependency-in-name-only before — `drizzle-kit` scripts existed in `package.json` but no config/schema/migrations existed anywhere). Schema lives in `src/db/schema.ts`, migrations in `drizzle/`. `drizzle.config.ts` reads `DATABASE_URL` (Supabase Postgres connection string — see `.env.example`).
- **Rated games are matchmaking-only** — private lobbies cannot be marked rated in v1 (closes an easy rating-farming/collusion hole between two lobby participants).
- **Move reconstruction strategy**: not yet decided — Phase 1 must verify whether `WraparoundChessEngine.fen()` round-trips wraparound-specific state losslessly before choosing FEN-snapshot vs. replay-from-move-list reconstruction for server-authoritative move validation.
- **Time control buckets**: bullet/blitz/rapid/classical, one concrete preset each in v1 (exact presets decided in Phase 3, not yet implemented).
- **ELO**: K=40 while provisional (<10 games in that bucket), K=20 at rating ≥2000, K=32 otherwise; standard logistic expected-score formula; lives as a pure function in `src/lib/elo.ts` (not yet created).
- **`src/lib/jwt.ts`** is now the single source of truth for `JWT_SECRET` (fails fast at import time if unset outside dev mode) and token sign/verify — all auth routes must import from here, never read `process.env.JWT_SECRET` directly or use a hardcoded fallback.
- **`src/lib/rateLimit.ts`** is a single-process in-memory limiter — does not coordinate across multiple serverless instances. Acceptable for now; would need Redis/Upstash to fix properly, out of scope.

## Open Questions (unresolved — needs input before proceeding)

- [ ] Fate of the pre-existing `players` table referenced by (the now-rewritten) `src/app/api/games/route.ts` — it was never declared in `Database`/schema and used columns (`player1_id`, `nickname`, `score`) that don't match anything real. The route no longer joins it; decide whether the table itself (if it exists in the live Supabase project) should be dropped.
- [ ] Email provider for password reset, or defer the flow entirely (v1 keeps only the existing logged-in change-password route at `src/app/api/users/change-password/route.ts`).
- [ ] Whether to expand each time-control bucket to multiple presets later (schema already supports it — `initial_time_sec`/`increment_sec` are separate from the bucket label).
- [ ] `src/app/api/auth/guest/route.ts` currently eager-seeds `user_ratings` rows using a stale `['classic','unboxed','programming']` `game_mode` list with columns (`game_mode`, `current_rating`, `lowest_rating`, `total_games`) that don't match the `user_ratings` schema Phase 3 will introduce (`time_control`, `rating`, `games_played`, etc.). This insert already fails silently today (wrapped in try/catch, table doesn't exist yet) — must be rewritten in Phase 3, not before.

## Phase Status

| Phase | Status | Notes |
|---|---|---|
| 0 — Auth hardening + schema/tooling foundation | **done** | See Session Log below |
| 1 — Server-authoritative moves | not started | |
| 2 — Private lobbies | not started | |
| 3 — Ranked matchmaking + ELO | not started | |
| 4 — Polish | not started | |

## Session Log

### Session: 2026-08-26 — Phase 0

Done:
- `src/lib/jwt.ts` (new) — centralized `JWT_SECRET` resolution (throws if unset outside dev mode) + `signAuthToken`/`verifyAuthToken`. Replaced ad-hoc `process.env.JWT_SECRET || 'hardcoded-default'` in `login`, `guest`, `me`, `logout` routes.
- `src/lib/rateLimit.ts` (new) — in-memory sliding-window limiter. Applied: login 5/15min per IP, register 3/hour per IP, guest 10/hour per IP.
- `src/app/api/auth/me/route.ts` — now checks for an active, non-expired `user_sessions` row in addition to JWT signature validity, so a deactivated session (logout) actually revokes access instead of only clearing the client cookie.
- `src/app/api/auth/login/route.ts` — session insert now explicitly sets `is_active: true` (previously relied on an implicit DB default that the dev-mode mock doesn't apply).
- Standardized `sameSite: 'lax'` across `login`/`logout` cookie-set calls (previously `strict` on those two, `lax` on `guest` — inconsistent).
- `src/types/game.ts` — `GameMode` widened from `'bot'` to `'bot' | 'private' | 'ranked'`. No downstream breakage found (grepped all usages).
- `src/app/api/games/route.ts` — rewritten against the real `games` schema (`white_player_id`/`black_player_id`), dropping the stale `players`-table join that referenced nonexistent columns.
- `src/lib/devDb.ts` — extended with `.order()`, `.limit()`, `.gte()`, `.lte()`, `.in()` (previously only `.eq()`/`.or()`/`.single()`), and added a `games` table entry, so dev mode doesn't silently break on the rewritten games route or later matchmaking-range queries.
- Wired up Drizzle: installed `drizzle-orm` + `drizzle-kit` (were referenced in `package.json` scripts but never actually installed), `drizzle.config.ts`, `src/db/schema.ts` (captures `users`, `user_sessions`, `games` as they actually exist/are used today, including `is_guest` which `guest/route.ts` already wrote to without any formal schema declaring it). Generated initial migration: `drizzle/0000_sharp_celestials.sql`. Added `DATABASE_URL` to `.env.example`.
- `npm run type-check` passes for all changed files. Pre-existing, unrelated `BotDifficulty` type errors remain in `src/lib/gameManager.ts` (lines ~635-730) — not touched by this session, not a regression.

Not done / explicitly deferred:
- Migration has **not** been applied to any live database (`npm run db:migrate` not run — no `DATABASE_URL` configured in this environment). Running it against the real Supabase project is a deploy-time step for whoever owns those credentials.
- `src/lib/supabase.ts`'s hand-written `Database` type was **not** yet replaced with Drizzle-derived types — left as-is to avoid a large mechanical diff in the same pass as the hardening changes; do this at the start of Phase 1 when the `games` table gets its multiplayer columns anyway.
- Manual verification of rate limiter / session revocation behavior against a running dev server was not performed in this pass — recommend doing so before Phase 1 starts (see plan's Phase 0 verification section).

Next: Phase 1 — server-authoritative move validation. Start with the FEN round-trip verification for `WraparoundChessEngine` (see Key Decisions) before writing `src/lib/server/gameSession.ts`.
