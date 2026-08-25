# Chess Unboxed — Progress Log

## Goal

Strip the app down to a single focused experience: **Chess Unboxed vs Bots**, with user accounts (and guest play). Remove all other game modes, the lobby system, leaderboard, stats, and programming chess.

See `CONTEXT.md` for full project context.

---

## Session: 2026-08-24

### Status: COMPLETE ✓

### Plan
0. [x] Create `docs/` folder (CONTEXT.md + PROGRESS.md)
1. [x] Delete removed pages (classic/, programming/, lobby/, leaderboard/, stats/, unboxed/endless/, unboxed/multiplayer/)
2. [x] Delete removed API routes (lobbies/, endless/)
3. [x] Delete removed lib/components (websocket.ts, programmingChess.ts, lobby components, CodeEditor, ProgrammingChessBoard, Leaderboard component)
4. [x] Modify `src/types/game.ts` — removed multiplayer/endless/programming types; GameMode = 'bot', GameVariant = 'unboxed'
5. [x] Modify `src/store/gameStore.ts` — removed WebSocket connection state fields and actions
6. [x] `src/lib/gameManager.ts` — no endless-specific logic was present; no changes needed
7. [x] Modify `src/lib/supabase.ts` — removed lobbies/endless_sessions table types; games.mode narrowed to 'bot'
8. [x] Modify UI — dashboard now shows only "Play vs Bot" card + Profile/Settings quick actions; middleware redirects removed routes to /dashboard
9. [x] Remove unused packages — socket.io, socket.io-client, @monaco-editor/react uninstalled
10. [x] `npm run type-check` — 0 errors

### Result
App is stripped down to: home page (with guest play) → auth (register/login) → dashboard → `/play/unboxed/bot`. All other routes redirect to /dashboard via middleware.
