import { createGame, GameManager } from '@/lib/gameManager';
import type { ChessMove, GameMode, GameVariant, Player, Square, PieceType } from '@/types/game';

// Reconstructs a GameManager from a persisted `games` row, server-side, once
// per request (stateless — no long-lived in-memory game objects, which fits
// a serverless deployment).
//
// Reconstruction replays the full stored move list through makeMove() from
// the initial position, rather than loading a FEN snapshot. This is not
// merely a defensive choice: WraparoundChessEngine.fen() is confirmed
// incapable of round-tripping a wraparound game's real position — its
// internal chess.js instance is never updated by wraparound moves (only
// `advanceTurn()` flips the turn field), so fen() always reflects the
// *initial* board plus whichever side's turn it is, never where pieces
// actually moved. The `games.fen` column is kept only as a cached fast-read
// for broadcasting, never as reconstruction input. See
// docs/MULTIPLAYER_PROGRESS.md for the full investigation.

export interface GameRow {
  id: string;
  mode: string;
  variant: string;
  white_player_id: string | null;
  black_player_id: string | null;
  moves: ChessMove[] | null;
  time_control?: string | null;
  initial_time_sec?: number | null;
  increment_sec?: number | null;
}

export class GameReplayError extends Error {}

function stubPlayer(id: string | null, color: 'white' | 'black'): Player {
  return {
    id: id ?? `${color}-unknown`,
    name: color,
    color,
    isBot: false,
  };
}

export function loadGameManager(row: GameRow): GameManager {
  const players = {
    white: stubPlayer(row.white_player_id, 'white'),
    black: stubPlayer(row.black_player_id, 'black'),
  };

  const timeControl =
    row.initial_time_sec != null && row.increment_sec != null
      ? { initialTime: row.initial_time_sec, increment: row.increment_sec }
      : undefined;

  const manager = createGame({
    mode: row.mode as GameMode,
    variant: (row.variant || 'unboxed') as GameVariant,
    players,
    timeControl,
  });

  const moves = row.moves ?? [];
  for (const move of moves) {
    const result = manager.makeMove(move.from as Square, move.to as Square, move.promotion as PieceType | undefined);
    if (!result.isValid) {
      throw new GameReplayError(
        `Failed to replay stored move ${move.from}->${move.to} for game ${row.id}: ${result.error}`
      );
    }
  }

  return manager;
}
