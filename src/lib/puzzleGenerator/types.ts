import type { PieceColor, PieceType, Square } from '@/types/game';

export interface CandidatePuzzle {
  slug: string;
  startingFen: string;
  sideToMove: PieceColor;
  solutionMoves: { from: Square; to: Square; promotion?: PieceType }[];
  isWraparoundMode: true;
  motif: string;
}
