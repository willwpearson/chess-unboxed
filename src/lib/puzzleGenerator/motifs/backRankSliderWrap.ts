import type { PieceColor } from '@/types/game';
import { buildFen, squareAt, wrapFile, type PlacedPiece } from '../boardBuilder';
import type { CandidatePuzzle } from '../types';

// Generalizes the two hand-authored back-rank puzzles (wrap-rook-back-rank-001/
// 002) into a parameterized template covering both sub-variants.
//
// Important fact this relies on (confirmed empirically, not just from
// reading the code): WraparoundChessEngine's check detection for a slider
// does NOT try both the direct and wrapped path and take whichever is
// open — it picks exactly ONE direction up front from the same
// `fileDiff > 4` threshold used for move-metadata (see chessEngine.ts's
// detectWraparoundCharacteristics), then only checks that one path. So to
// force a wraparound-dependent mate, the attacker's file and the king's
// file must differ by more than 4 (so the engine's check computation
// commits to the wrap path), and the blocker must sit on the *other*
// (direct, unchecked-by-wraparound-engine) path — purely to make the
// standard/non-wraparound replay (which only ever has the direct path)
// fail. A blocker placed on the actual wrap path would break the mate
// entirely instead.
//
// - forceWrap: attacker approaches from file 0 or file 7 specifically so
//   |attackerFile - kingFile| > 4; a same-color-as-defender bishop sits on
//   the direct-path-adjacent square next to the king, removing it as a
//   flight square and blocking chess.js's only path. The wrap-path-side
//   neighbor is covered because the wrap route passes through it just
//   before reaching the king. King files 0, 3, 4, 7 are excluded: 3/4 can
//   never reach |diff| > 4 against a 0/7 attacker on an 8-file board, and
//   0/7 would make the wrap-side flight square coincide with the
//   attacker's own arrival square (the king could just capture it).
// - !forceWrap: no blocker; attacker approaches from a file 3 away so the
//   engine's own threshold also picks the direct path (fileDiff = 3, not
//   wrapped) — identical outcome to real chess. Kept to interior king
//   files (1-6) so wraparound can't hand the king an extra escape square
//   that doesn't exist on a real board (only a-file/h-file kings gain one
//   from file-wrap).
//
// pieceType lets the same shape produce either a rook or queen mate.

export interface BackRankSliderWrapParams {
  attackerColor: PieceColor;
  kingFile: number; // 0-7
  forceWrap: boolean;
  pieceType: 'rook' | 'queen';
}

export function generate(params: BackRankSliderWrapParams): CandidatePuzzle | null {
  const { attackerColor, forceWrap, pieceType } = params;
  const kf = wrapFile(params.kingFile);
  const defenderColor: PieceColor = attackerColor === 'white' ? 'black' : 'white';
  const defenderBackRank = defenderColor === 'black' ? 8 : 1;
  const attackerHomeRank = attackerColor === 'white' ? 1 : 8;
  const shieldRank = defenderColor === 'black' ? 7 : 2;

  if (!forceWrap && (kf === 0 || kf === 7)) return null;

  let attackerFile: number;
  const pieces: PlacedPiece[] = [
    { square: squareAt(kf, defenderBackRank), type: 'king', color: defenderColor },
    { square: squareAt(kf - 1, shieldRank), type: 'pawn', color: defenderColor },
    { square: squareAt(kf, shieldRank), type: 'pawn', color: defenderColor },
    { square: squareAt(kf + 1, shieldRank), type: 'pawn', color: defenderColor },
  ];

  if (forceWrap) {
    if (kf === 0 || kf === 3 || kf === 4 || kf === 7) return null;
    const approachFromBelow = kf > 3; // kf in {5,6} approach from file 0; kf in {1,2} from file 7
    attackerFile = approachFromBelow ? 0 : 7;
    if (Math.abs(attackerFile - kf) <= 4) return null;
    const blockerFile = approachFromBelow ? kf - 1 : kf + 1;
    pieces.push({ square: squareAt(blockerFile, defenderBackRank), type: 'bishop', color: defenderColor });
  } else {
    attackerFile = kf >= 3 ? kf - 3 : kf + 3;
    if (attackerFile === kf - 1 || attackerFile === kf || attackerFile === kf + 1) return null;
  }

  const attackerKingFile = wrapFile(attackerFile + 4);
  if (attackerKingFile === attackerFile) return null;
  pieces.push({ square: squareAt(attackerKingFile, attackerHomeRank), type: 'king', color: attackerColor });

  const attackerStart = squareAt(attackerFile, attackerHomeRank);
  pieces.push({ square: attackerStart, type: pieceType, color: attackerColor });

  const attackerArrival = squareAt(attackerFile, defenderBackRank);
  const startingFen = buildFen(pieces, attackerColor);

  return {
    slug: `gen-back-rank-${pieceType}-${attackerColor}-${kf}-${forceWrap ? 'wrap' : 'std'}`,
    startingFen,
    sideToMove: attackerColor,
    solutionMoves: [{ from: attackerStart, to: attackerArrival }],
    isWraparoundMode: true,
    motif: 'backRankSliderWrap',
  };
}

export function* sweep(): Generator<BackRankSliderWrapParams> {
  const colors: PieceColor[] = ['white', 'black'];
  const pieceTypes: ('rook' | 'queen')[] = ['rook', 'queen'];
  for (const attackerColor of colors) {
    for (const pieceType of pieceTypes) {
      for (let kingFile = 0; kingFile < 8; kingFile++) {
        for (const forceWrap of [true, false]) {
          yield { attackerColor, kingFile, forceWrap, pieceType };
        }
      }
    }
  }
}
