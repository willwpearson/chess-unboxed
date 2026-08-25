# Chess Unboxed — Project Context

## What This Is

Chess Unboxed is a web app where players can sign up (or play as a guest) and play Chess Unboxed — a toroidal/wraparound variant of chess — against AI bots.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS 4 |
| State | Zustand + React Query |
| Database | Supabase (PostgreSQL) |
| Auth | JWT via HTTP-only cookies + bcryptjs |
| ORM | Drizzle Kit (migrations) |

## What "Unboxed" Means

The board uses toroidal topology — pieces that move off one edge of the board reappear on the opposite side. The custom engine is in `src/lib/chessEngine.ts` (`WraparoundChessEngine` class). It handles edge-wrapping for all piece types. Standard chess.js is used for move validation on the standard variant; the wraparound engine supplements it with toroidal move generation.

## Database Schema (Supabase)

| Table | Purpose |
|-------|---------|
| `users` | Accounts — email, username, password_hash, rating, stats |
| `user_sessions` | Active JWT sessions, device/IP info |
| `games` | Game records — mode, players, moves (jsonb), result |
| `players` | Player entities per game (separate from user accounts) |

## Auth Flow

- **Register**: email + username + password → bcrypt hash → insert to `users` → JWT cookie (7 days)
- **Login**: email or username + password → bcrypt compare → JWT cookie
- **Guest**: "Play as Guest" on home page → `/api/auth/guest` creates a `Guest_XXXXXXXX` user → JWT cookie → redirect to `/play/unboxed/bot`. Guest accounts persist for 7 days; users can register to make them permanent.
- All auth checked via `/api/auth/me` on page load through `useAuth` hook.

### Offline dev mode

Set `NEXT_PUBLIC_DEV_MODE=true` in `.env.local` to run all of the above with zero Supabase calls. `src/lib/supabase.ts` swaps `supabase`/`supabaseAdmin` for `src/lib/devDb.ts`, an in-memory mock of the query builder shapes the auth routes use. It seeds a fixed login (`devuser` / `devpassword`) on server start, and guest accounts work the same way but stay in memory only (reset on restart). No Supabase project or env vars are required in this mode.

## Bot AI

Located in `src/lib/gameManager.ts` (`BotManager` class). Four difficulty levels:

| Difficulty | Rating | Strategy |
|-----------|--------|----------|
| Easy | 800 | Random move selection |
| Medium | 1200 | Prefers captures |
| Hard | 1600 | Basic tactical evaluation (stub) |
| Expert | 2000 | Strategic evaluation (stub) |

## Key Files

| File | Role |
|------|------|
| `src/lib/chessEngine.ts` | Wraparound chess move generation |
| `src/lib/gameManager.ts` | GameManager class, BotManager class |
| `src/store/gameStore.ts` | Zustand game state |
| `src/hooks/useAuth.ts` | Auth state + helpers |
| `src/lib/supabase.ts` | Supabase client + DB type definitions |
| `src/types/game.ts` | Core TypeScript game types |
| `src/app/play/unboxed/bot/page.tsx` | The main game page |
| `src/components/game/ChessBoard.tsx` | Board rendering + move handling |

## What Was Removed (and Why)

The original codebase had multiple game modes and features that were out of scope for the initial focused build:

| Removed | Reason |
|---------|--------|
| Classic chess mode (`/play/classic/`) | Only unboxed variant is needed |
| Endless mode (`/play/unboxed/endless/`) | Out of scope for initial build |
| Multiplayer / Lobby system | Out of scope; bot-only for now |
| Programming chess mode | Out of scope |
| Leaderboard page (`/leaderboard/`) | No ranked data to show yet |
| Stats page (`/stats/`) | Out of scope |
| Socket.IO / WebSocket service | Only needed for multiplayer |
| Monaco editor | Only needed for programming chess |
| `lobbies` DB table | No multiplayer |
| `endless_sessions` DB table | No endless mode |
