import { createGame } from '@/lib/gameManager';
import type { ChessMove, GameVariant, PieceColor, PieceType, Player, Square } from '@/types/game';

// Shared by scripts/seedPuzzles.ts (self-validate every hand-authored
// puzzle before it's written to the DB) and, by construction, describes the
// same replay logic the runtime attempt route performs move-by-move — a
// puzzle that passes this validator is guaranteed solvable through the real
// server-side verification path.

export interface SolutionMove {
  from: Square;
  to: Square;
  promotion?: PieceType;
}

export interface PuzzleToValidate {
  slug: string;
  startingFen: string;
  sideToMove: PieceColor;
  solutionMoves: SolutionMove[];
  isWraparoundMode: boolean;
}

export interface PuzzleValidationResult {
  valid: boolean;
  error?: string;
}

function stubPlayer(color: PieceColor): Player {
  return { id: `${color}-puzzle`, name: color, color, isBot: false };
}

// Replays `solutionMoves` from `startingFen` and asserts: every move is
// chess-legal in the position it's played in, moves alternate starting from
// `sideToMove`, and the final move ends the game in checkmate — the only
// mechanically-verifiable "solved" condition for v1 (see puzzles.seed.ts /
// the attempt route's "exact stored path only" verification approach).
export function validatePuzzleSolution(puzzle: PuzzleToValidate): PuzzleValidationResult {
  if (puzzle.solutionMoves.length === 0) {
    return { valid: false, error: `${puzzle.slug}: solutionMoves must not be empty` };
  }

  const variant: GameVariant = 'unboxed';
  const manager = createGame({
    mode: 'casual',
    variant,
    players: { white: stubPlayer('white'), black: stubPlayer('black') },
    fen: puzzle.startingFen,
  });

  for (let i = 0; i < puzzle.solutionMoves.length; i++) {
    const move = puzzle.solutionMoves[i];
    const result = manager.makeMove(move.from, move.to, move.promotion);
    if (!result.isValid) {
      return {
        valid: false,
        error: `${puzzle.slug}: move ${i} (${move.from}->${move.to}) is illegal: ${result.error}`,
      };
    }

    const isLastMove = i === puzzle.solutionMoves.length - 1;
    if (isLastMove) {
      if (!result.gameEnd || result.gameEnd.reason !== 'checkmate') {
        return {
          valid: false,
          error: `${puzzle.slug}: final move does not deliver checkmate`,
        };
      }
    }
  }

  return { valid: true };
}
