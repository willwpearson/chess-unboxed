# Chess Unboxed — Multiplayer Progress Log

## Goal

Add the multiplayer framework: secure signup/login (already existed, hardened here), private invite-code hosted lobbies, and ranked matchmaking with per-time-control ELO — scoped to the Unboxed (toroidal) variant only. Full plan: `.claude/plans` history / this doc's Key Decisions below. See `docs/CONTEXT.md` for the pre-existing bot-only architecture this builds on.

## Key Decisions (durable — don't re-derive)

- **Realtime transport**: Supabase Realtime (Postgres Changes for game/lobby row updates + Presence) — no Socket.IO, no custom broadcast-from-server calls needed for v1.
- **Migration tooling**: Drizzle, newly wired up (it was a dependency-in-name-only before — `drizzle-kit` scripts existed in `package.json` but no config/schema/migrations existed anywhere). Schema lives in `src/db/schema.ts`, migrations in `drizzle/`. `drizzle.config.ts` reads `DATABASE_URL` (Supabase Postgres connection string — see `.env.example`).
- **Rated games are matchmaking-only** — private lobbies cannot be marked rated in v1 (closes an easy rating-farming/collusion hole between two lobby participants).
- **Move reconstruction strategy: replay-from-move-list, confirmed mandatory (not just the safer option).** Verified `WraparoundChessEngine.fen()` (src/lib/chessEngine.ts) never reflects a wraparound move's board change at all — its internal `chess.js` instance is only touched by `advanceTurn()`, which flips the turn field of a copied FEN and nothing else. So for the whole `'unboxed'` variant, `fen()` always returns the *initial* position with only the turn byte updated, regardless of how many moves have been played. Confirmed live via HTTP smoke test: after two real pawn moves, `games.fen` still read the starting-position FEN. `src/lib/server/gameSession.ts`'s `loadGameManager()` reconstructs purely by replaying `games.moves` through `GameManager.makeMove()` from a fresh game; `games.fen` is written after each move but is a cosmetic/cached field only, never used for reconstruction. Verified via a standalone script that replay reproduces an identical board (including a wraparound pawn capture, e.g. a4xh5) to the live game.
- **Time control buckets**: bullet/blitz/rapid/classical, one concrete preset each in v1 (exact presets decided in Phase 3, not yet implemented).
- **ELO**: K=40 while provisional (<10 games in that bucket), K=20 at rating ≥2000, K=32 otherwise; standard logistic expected-score formula; lives as a pure function in `src/lib/elo.ts` (not yet created).
- **`src/lib/jwt.ts`** is now the single source of truth for `JWT_SECRET` (fails fast at import time if unset outside dev mode) and token sign/verify — all auth routes must import from here, never read `process.env.JWT_SECRET` directly or use a hardcoded fallback.
- **`src/lib/rateLimit.ts`** is a single-process in-memory limiter — does not coordinate across multiple serverless instances. Acceptable for now; would need Redis/Upstash to fix properly, out of scope.

## Open Questions (unresolved — needs input before proceeding)

- [ ] Fate of the pre-existing `players` table referenced by (the now-rewritten) `src/app/api/games/route.ts` — it was never declared in `Database`/schema and used columns (`player1_id`, `nickname`, `score`) that don't match anything real. The route no longer joins it; decide whether the table itself (if it exists in the live Supabase project) should be dropped.
- [ ] Email provider for password reset, or defer the flow entirely (v1 keeps only the existing logged-in change-password route at `src/app/api/users/change-password/route.ts`).
- [ ] Whether to expand each time-control bucket to multiple presets later (schema already supports it — `initial_time_sec`/`increment_sec` are separate from the bucket label).
- [ ] `src/app/api/auth/guest/route.ts` currently eager-seeds `user_ratings` rows using a stale `['classic','unboxed','programming']` `game_mode` list with columns (`game_mode`, `current_rating`, `lowest_rating`, `total_games`) that don't match the `user_ratings` schema Phase 3 will introduce (`time_control`, `rating`, `games_played`, etc.). This insert already fails silently today (wrapped in try/catch, table doesn't exist yet) — must be rewritten in Phase 3, not before.
- [ ] Pre-existing cosmetic bug found during Phase 1 verification (not fixed, flagged only): `WraparoundChessEngine.makeWraparoundMove()` (src/lib/chessEngine.ts ~line 657) hardcodes `isWraparound: true` on every move's returned `ChessMove`, even a plain non-wrapping pawn push — because the whole `'unboxed'` variant routes every move through the wraparound code path regardless of whether an actual wrap occurred. Harmless for move validation (which is unaffected), but any future UI that highlights "this move wrapped around the board" specially will need `detectWraparoundCharacteristics`'s distance/type output inspected, not the `isWraparound` flag, until this is fixed.

## Phase Status

| Phase | Status | Notes |
| --- | --- | --- |
| 0 — Auth hardening + schema/tooling foundation | **done** | See Session Log below |
| 1 — Server-authoritative moves | **done** | See Session Log below |
| 2 — Private lobbies | not started | |
| 3 — Ranked matchmaking + ELO | not started | |
| 4 — Polish | not started | |

## Session Log

### Session: 2026-08-26 — Phase 1

Done:
- `src/db/schema.ts` — `games` table extended with `time_control`, `initial_time_sec`, `increment_sec`, `white_time_ms`, `black_time_ms`, `fen` (cached fast-read only), `turn`, `lobby_id` (no FK yet — `lobbies` table doesn't exist until Phase 2), `rating_change_white/black`, `last_move_at`, `draw_offered_by`. Generated migrations `drizzle/0001_crazy_spencer_smythe.sql` and `drizzle/0002_glamorous_madame_web.sql` (not applied to any live DB — same deploy-time caveat as Phase 0's `0000`).
- `src/lib/server/gameSession.ts` (new) — `loadGameManager(row)` reconstructs a `GameManager` per-request by replaying `row.moves` through `makeMove()` from a fresh game (see Key Decisions above for why this is mandatory, not just cautious, for the wraparound variant). Throws `GameReplayError` if a stored move fails to replay (would indicate corrupted data — surfaced as a 500, not silently swallowed).
- `src/lib/server/authUser.ts` (new) — shared `getAuthUserId(request)` helper (cookie or bearer token) used by all the new game routes.
- New routes, all under `src/app/api/games/[gameId]/`: `move` (the core server-authoritative move endpoint — auth → player-in-game check → turn check → server-computed clock/timeout check → replay-reconstruct → `GameManager.makeMove()` → persist → respond), `resign`, `draw-offer`, `draw-accept`, `claim-timeout` (re-derives elapsed time server-side, doesn't trust the caller's claim that the opponent timed out).
- `src/app/api/games/route.ts` (from Phase 0) needed no further changes — already aligned to `white_player_id`/`black_player_id`, and the move route's game creation flows through it as-is for now (Phase 2 will add a dedicated lobby → game creation path).
- `npm run type-check` passes (same pre-existing unrelated `gameManager.ts` `BotDifficulty` errors as Phase 0, untouched).

Verification performed:
- Standalone script (`npx tsx`, not committed) using `GameManager` directly: played a scripted opening that produced a genuine wraparound pawn capture (a4×h5, wrapping the file), then reconstructed a second `GameManager` from scratch by replaying the exact move list. Resulting board position and turn were byte-identical (`JSON.stringify` compare) to the live game's position — confirms replay-based reconstruction is correct, including for wraparound-specific moves.
- Live HTTP smoke test against `npm run dev` (dev mode / `devDb`): created a `mode:'private'` game between a logged-in user and a guest via `POST /api/games`, then drove it through `POST /api/games/[gameId]/move`. Confirmed: black moving before white is rejected 409 "Not your turn"; white moving twice in a row is rejected 409; a legal move (e2-e4, e7-e5) succeeds and persists (`GET /api/games?id=...` shows `moves.length` incrementing and `turn` flipping correctly); an illegal move (e4-e6, no piece there to jump like that) is rejected 400; `POST .../resign` ends the game with `status:'completed'` and the correct `winner_id`.
- Confirmed live (not just from reading the code) that `games.fen` stays frozen at the starting-position FEN across real moves in an unboxed game — matches the Key Decisions finding above and confirms the move-persistence code correctly does NOT depend on it for anything but display.

Not done / explicitly deferred:
- Client-side wiring (`useGameStore.makeMove` branch, `useGameRealtime` hook, Realtime subscriptions) is Phase 2 scope — Phase 1 is deliberately API-only per the plan, verified via script/HTTP rather than UI.
- No load/perf testing of the replay-reconstruction approach against long games — acceptable per the plan's reasoning (games are short), revisit only if it becomes a real bottleneck.
- The `fen` column bug noted above (`isWraparound` always true) was found but not fixed — out of Phase 1 scope, flagged in Open Questions.

Next: Phase 2 — private lobbies over Supabase Realtime.

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
