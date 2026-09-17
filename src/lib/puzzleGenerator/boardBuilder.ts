import type { PieceColor, PieceType, Square } from '@/types/game';

// Shared FEN-construction helpers for puzzle motif generators. Only the
// file axis ever wraps (see WraparoundChessEngine's own comment on this),
// so every motif builds positions in terms of a 0-7 file index and a 1-8
// rank, wrapping only the file.

export function wrapFile(file: number): number {
  return ((file % 8) + 8) % 8;
}

export function squareAt(file: number, rank: number): Square {
  return `${String.fromCharCode(97 + wrapFile(file))}${rank}` as Square;
}

export interface PlacedPiece {
  square: Square;
  type: PieceType;
  color: PieceColor;
}

const PIECE_FEN_LETTER: Record<PieceType, string> = {
  king: 'k',
  queen: 'q',
  rook: 'r',
  bishop: 'b',
  knight: 'n',
  pawn: 'p',
};

// Builds a FEN from an explicit piece list. No castling rights or en
// passant target — motif puzzles never need them, and every hand-authored
// seed puzzle already uses the same "- -" convention.
export function buildFen(pieces: PlacedPiece[], sideToMove: PieceColor): string {
  const board: (string | null)[][] = Array.from({ length: 8 }, () => Array(8).fill(null));

  for (const piece of pieces) {
    const file = wrapFile(piece.square.charCodeAt(0) - 97);
    const rank = parseInt(piece.square[1], 10) - 1;
    const letter = PIECE_FEN_LETTER[piece.type];
    board[rank][file] = piece.color === 'white' ? letter.toUpperCase() : letter;
  }

  const rankStrings: string[] = [];
  for (let rank = 7; rank >= 0; rank--) {
    let row = '';
    let emptyRun = 0;
    for (let file = 0; file < 8; file++) {
      const cell = board[rank][file];
      if (cell) {
        if (emptyRun > 0) {
          row += emptyRun;
          emptyRun = 0;
        }
        row += cell;
      } else {
        emptyRun++;
      }
    }
    if (emptyRun > 0) row += emptyRun;
    rankStrings.push(row);
  }

  const turn = sideToMove === 'white' ? 'w' : 'b';
  return `${rankStrings.join('/')} ${turn} - - 0 1`;
}
