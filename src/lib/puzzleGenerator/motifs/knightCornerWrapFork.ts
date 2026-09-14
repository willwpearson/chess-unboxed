import type { PieceColor } from '@/types/game';
import { buildFen, squareAt, wrapFile, type PlacedPiece } from '../boardBuilder';
import type { CandidatePuzzle } from '../types';

// Generalizes wrap-knight-fork-mate-001. Unlike the back-rank motif, this
// one is inherently corner-specific: a knight move only becomes illegal
// under standard rules (and only legal via the wrap) when its raw file
// displacement is 6 or 7 — pairing that with a valid rank displacement of
// 1 or 2 to keep a legitimate (wrapped-2,1)/(wrapped-1,2) knight pattern
// only produces a legal wrapped landing square immediately next to a
// corner file (0 or 7). So kingFile is restricted to {0, 7}.
//
// The king is fully smothered by its own pieces on every neighbor square
// it has, including the wraparound one (e.g. a corner king on h8 has
// neighbors g8, g7, h7, and — only via wraparound — a8). This sidesteps
// needing any attacked-square reasoning at all: if every neighbor square
// is occupied by the defender's own piece, the only way out is if the
// delivering move is itself illegal, which is exactly what
// isWraparoundDependent checks. Squares on the king's own rank can't hold
// pawns (invalid on a back rank), so those get a bishop/knight instead;
// squares one rank in get pawns, matching the hand-authored puzzle.

export interface KnightCornerWrapForkParams {
  attackerColor: PieceColor;
  kingFile: 0 | 7;
}

export function generate(params: KnightCornerWrapForkParams): CandidatePuzzle | null {
  const { attackerColor, kingFile } = params;
  const defenderColor: PieceColor = attackerColor === 'white' ? 'black' : 'white';
  const defenderBackRank = defenderColor === 'black' ? 8 : 1;
  const shieldRank = defenderColor === 'black' ? 7 : 2;
  const attackerHomeRank = attackerColor === 'white' ? 1 : 8;
  const towardCenter = defenderBackRank === 8 ? -1 : 1; // direction from back rank into the board

  const kf = kingFile;
  const inwardFile = kf === 7 ? kf - 1 : kf + 1; // the non-wrap neighbor file
  const wrapNeighborFile = wrapFile(kf === 7 ? kf + 1 : kf - 1);

  const pieces: PlacedPiece[] = [
    { square: squareAt(kf, defenderBackRank), type: 'king', color: defenderColor },
    // Smother every neighbor of the corner king.
    { square: squareAt(inwardFile, defenderBackRank), type: 'bishop', color: defenderColor },
    // Straight ahead of the knight's landing square — safe, since a pawn
    // can never capture the square directly in front of it. The other
    // shield square (kf, shieldRank) deliberately gets a rook, not a
    // pawn: it sits diagonally adjacent to the landing square, and a
    // pawn there could just capture the mating knight.
    { square: squareAt(inwardFile, shieldRank), type: 'pawn', color: defenderColor },
    { square: squareAt(kf, shieldRank), type: 'rook', color: defenderColor },
    { square: squareAt(wrapNeighborFile, defenderBackRank), type: 'knight', color: defenderColor },
  ];

  // Landing square: the inward neighbor's file, two ranks toward center
  // from the king (a legal, un-wrapped knight check on that square once
  // occupied — the check itself never needs to wrap).
  const landingFile = inwardFile;
  const landingRank = defenderBackRank + 2 * towardCenter;
  // Start square: raw file distance of 6 or 7 from the landing file so the
  // move is only legal via wrap (see module comment); one rank further
  // toward center than the landing square.
  const rawDelta = kf === 7 ? 6 : -6; // kf=7: landingFile=6, start=0 (diff 6); kf=0: landingFile=1, start=7 (diff 6)
  const startFile = landingFile - rawDelta;
  const startRank = landingRank + towardCenter;

  if (startFile < 0 || startFile > 7 || startRank < 1 || startRank > 8) return null;
  if (Math.abs(startFile - landingFile) < 6) return null;

  const knightStart = squareAt(startFile, startRank);
  const knightLanding = squareAt(landingFile, landingRank);

  // Attacker's own king, parked well clear of the action.
  const attackerKingFile = wrapFile(startFile + 4);
  pieces.push({ square: squareAt(attackerKingFile, attackerHomeRank), type: 'king', color: attackerColor });
  pieces.push({ square: knightStart, type: 'knight', color: attackerColor });

  const startingFen = buildFen(pieces, attackerColor);

  return {
    slug: `gen-knight-corner-wrap-fork-${attackerColor}-${kf}`,
    startingFen,
    sideToMove: attackerColor,
    solutionMoves: [{ from: knightStart, to: knightLanding }],
    isWraparoundMode: true,
    motif: 'knightCornerWrapFork',
  };
}

export function* sweep(): Generator<KnightCornerWrapForkParams> {
  const colors: PieceColor[] = ['white', 'black'];
  const corners: (0 | 7)[] = [0, 7];
  for (const attackerColor of colors) {
    for (const kingFile of corners) {
      yield { attackerColor, kingFile };
    }
  }
}
