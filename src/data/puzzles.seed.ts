import type { PieceColor, PieceType, Square } from '@/types/game';

// Hand-curated puzzle seed set (v1). Each puzzle's solution is only
// checkmate-correct because of wraparound geometry — see the comment on
// each entry for the specific mechanic. Self-validated by
// scripts/seedPuzzles.ts via src/lib/puzzleValidation.ts before being
// written to the DB, using the same GameManager replay the runtime attempt
// route uses.
//
// Authored by Claude, pending the user's review before the full 20-40
// puzzle set is built out (see the implementation plan's step 8).

export interface SeedPuzzle {
  slug: string;
  startingFen: string;
  sideToMove: PieceColor;
  solutionMoves: { from: Square; to: Square; promotion?: PieceType }[];
  isWraparoundMode: boolean;
  rating: number;
  themes: string[];
}

export const puzzlesSeed: SeedPuzzle[] = [
  {
    slug: 'wrap-rook-back-rank-001',
    // White rook's direct path along rank 8 is blocked by the black bishop
    // on f8, but the wraparound path (b8 -> a8 -> wraps to h8 -> g8) is
    // clear, so Rb8 delivers a back-rank mate a non-wraparound board could
    // never produce from this exact position.
    startingFen: '5bk1/5ppp/8/8/8/8/8/KR6 w - - 0 1',
    sideToMove: 'white',
    solutionMoves: [{ from: 'b1', to: 'b8' }],
    isWraparoundMode: true,
    rating: 1100,
    themes: ['wraparound', 'back-rank', 'rook'],
  },
  {
    slug: 'wrap-knight-fork-mate-001',
    // The knight's jump from a5 to g6 only exists because its file offset
    // (-2) wraps past the a-file edge to the g-file — the same knight has
    // no legal non-wraparound path to a mating square here. a8 is guarded
    // by the black knight since the black king's own wraparound-adjacent
    // escape square (h8's rank-wrapped neighbor is a8) must be covered too.
    startingFen: 'n5bk/6pr/8/N7/8/8/8/K7 w - - 0 1',
    sideToMove: 'white',
    solutionMoves: [{ from: 'a5', to: 'g6' }],
    isWraparoundMode: true,
    rating: 1500,
    themes: ['wraparound', 'knight', 'corner-mate'],
  },
  {
    slug: 'wrap-rook-back-rank-002',
    // Mirror of wrap-rook-back-rank-001 on the other side of the board —
    // included to give the practice pool an easy second entry near the
    // same rating band while the curated set is still small.
    startingFen: '1kb5/ppp5/8/8/8/8/8/K5R1 w - - 0 1',
    sideToMove: 'white',
    solutionMoves: [{ from: 'g1', to: 'g8' }],
    isWraparoundMode: true,
    rating: 1100,
    themes: ['wraparound', 'back-rank', 'rook'],
  },
];
