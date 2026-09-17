import { createGame } from '@/lib/gameManager';
import { WraparoundChessEngine } from '@/lib/chessEngine';
import type { GameVariant, PieceColor, PieceType, Player, Square } from '@/types/game';

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
  // Only meaningful when valid: true. See isWraparoundDependent below for
  // what this actually measures and why a naive "did any move's own
  // from/to file distance wrap" check is NOT sufficient.
  usedWraparound?: boolean;
}

function stubPlayer(color: PieceColor): Player {
  return { id: `${color}-puzzle`, name: color, color, isBot: false };
}

// Whether solving this puzzle actually depends on wraparound rules, as
// opposed to being an ordinary tactic that happens to still be forced mate
// on this board. NOT the same as checking whether any individual move's
// own from/to squares cross the file-wrap edge: a move can have zero file
// displacement (e.g. a plain vertical rook slide) and still only deliver
// checkmate because the king's flight squares or the attacker's checking
// line are computed with wraparound-aware geometry elsewhere on the board
// (see wrap-rook-back-rank-001 in puzzles.seed.ts — Rb1-b8 is a non-wrapping
// move, but it's only mate because the rook's rank-8 attack on the king
// reaches around the wrapped edge past a blocking bishop).
//
// So this replays the exact same solution through a second, independent
// engine instance with wraparound mode OFF (WraparoundChessEngine falls
// back to plain chess.js in that mode) and compares outcomes: if any move
// is illegal under standard rules, or the final position isn't checkmate
// there, the puzzle depends on wraparound. Assumes the solution has
// already been confirmed legal+mate under real (wraparound) rules by
// validatePuzzleSolution — this function doesn't re-check that.
export function isWraparoundDependent(puzzle: PuzzleToValidate): boolean {
  const engine = new WraparoundChessEngine(puzzle.startingFen, false);

  for (const move of puzzle.solutionMoves) {
    const result = engine.makeMove(move.from, move.to, move.promotion);
    if (!result) {
      return true;
    }
    const isLastMove = move === puzzle.solutionMoves[puzzle.solutionMoves.length - 1];
    if (isLastMove && !result.isCheckmate) {
      return true;
    }
  }

  return false;
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

  return { valid: true, usedWraparound: isWraparoundDependent(puzzle) };
}
