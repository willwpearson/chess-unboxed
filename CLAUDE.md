# chess.optim.boo

Multiplayer chess web app: Next.js App Router, TypeScript, Tailwind, Drizzle ORM + Postgres (Supabase), Zustand, react-query. See `.claude/agents/frontend-nextjs-expert.md` for the frontend-specialist agent; this file is the repo-wide baseline that applies regardless of which agent is active.

## Priorities

These apply to every change, not just ones that look "frontend" or "security-sensitive":

1. **Reusability** — before writing a new component, hook, or utility, check `src/components/ui`, `src/hooks`, and `src/lib` for something that already does it or could be generalized to. Prefer composition and shared hooks over copy-pasted logic. New shared UI goes in `src/components/ui`; feature-specific components stay in their feature folder (`src/components/game`, `src/components/auth`, etc.) unless used in 2+ features, at which point promote it.
2. **Security** — this app handles auth (JWT/bcrypt) and real-time multiplayer game state, so:
   - Validate and sanitize all external input (API routes, form submissions, websocket/game messages) — use `zod` schemas already in use elsewhere in the repo rather than ad hoc checks.
   - Never trust client-submitted game state for move legality, ELO, or match results — validate authoritatively server-side (`chess.js`, `src/lib/server`).
   - Keep secrets in environment variables (`.env.local`, never committed); check `.env.example` when adding a new required variable.
   - Auth/session logic changes should be treated as high-risk: re-check token handling, password hashing, and authorization checks on every route touched.
3. **Testing infrastructure** — no test runner is configured yet (this is a near-term to-do). **Until one exists**, do not silently skip testing: flag in your response that the new code is untested and note what should be covered once a framework is in place, rather than treating the feature as done.

## Testing rule (activates once a test framework is added)

Once a test runner (e.g. Vitest/Jest for unit tests, Playwright for e2e) is set up in this repo:

- **Every new component, hook, utility function, or API route you write or materially change must ship with corresponding unit tests in the same turn.** Do not defer this to a follow-up unless the user explicitly says to.
- Check for an existing test file alongside the module (`*.test.ts(x)` / `__tests__/`) before assuming none exists.
- Prioritize coverage for: game logic and move validation, auth/session handling, matchmaking/ELO calculations, and any reusable component in `src/components/ui` or `src/hooks`.
- If you add a new shared component or hook (per the reusability rule above), its test should exercise it generically enough to cover its actual reuse cases, not just the first call site.
- Run the test suite before reporting a task complete when tests exist for the area you touched.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
