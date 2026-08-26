# Chess Unboxed

A web app for playing **Chess Unboxed** — a toroidal/wraparound variant of chess where pieces that move off one edge of the board reappear on the opposite side — against AI bots. Play as a guest or create an account.

## Features

- **Unboxed chess engine**: a custom wraparound move generator (`src/lib/chessEngine.ts`) layered on top of `chess.js` for standard move validation.
- **Bot opponents**: four difficulty levels, from random move selection up to strategic evaluation (`src/lib/gameManager.ts`).
- **Guest play**: jump straight into a game with a temporary account that can later be upgraded to a permanent one.
- **Accounts**: email/username + password registration and login, backed by Supabase.

## Tech Stack

| Layer      | Technology                          |
| ---------- | ------------------------------------ |
| Framework  | Next.js 15 (App Router)              |
| Language   | TypeScript                           |
| Styling    | Tailwind CSS 4                       |
| State      | Zustand + React Query                |
| Database   | Supabase (PostgreSQL)                |
| Auth       | JWT via HTTP-only cookies + bcryptjs |
| ORM        | Drizzle Kit (migrations)             |

## Getting Started

### Prerequisites

- Node.js 18+
- Either a Supabase project, or just use offline dev mode (see below) to run with no external services.

### Installation

```bash
npm install
```

### Environment variables

Create a `.env.local` file in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
JWT_SECRET=your_jwt_secret_key_here
```

#### Offline dev mode

Set `NEXT_PUBLIC_DEV_MODE=true` in `.env.local` to run the app with zero Supabase calls. `src/lib/supabase.ts` swaps in an in-memory mock (`src/lib/devDb.ts`) of the query builder shapes the auth routes use. It seeds a fixed login (`devuser` / `devpassword`) on server start; guest accounts also work but stay in memory only and reset on restart. No Supabase project or other env vars are required in this mode.

### Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Other scripts

- `npm run build` — production build
- `npm run start` — start production server
- `npm run lint` — run ESLint
- `npm run type-check` — run TypeScript checks
- `npm run format` — format code with Prettier
- `npm run db:generate` / `npm run db:migrate` / `npm run db:studio` — Drizzle Kit migrations

## Project Structure

```
src/
├── app/                    # Next.js App Router pages (dashboard, login, play, profile, register, settings, api)
├── components/             # React components (game, layout, settings, ui, user, auth)
├── lib/                    # chessEngine.ts, gameManager.ts, supabase.ts, devDb.ts, utils.ts
├── store/                  # Zustand game state
├── hooks/                  # useAuth and other hooks
└── types/                  # Core TypeScript types
```

## More Context

See [`docs/CONTEXT.md`](docs/CONTEXT.md) for the database schema, auth flow, bot AI details, and a record of what was intentionally scoped out of this build. See [`docs/PROGRESS.md`](docs/PROGRESS.md) for the history of that scope-trimming work.

## License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
