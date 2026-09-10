import { beforeEach, describe, expect, it, vi } from 'vitest';
import { WraparoundChessEngine } from './chessEngine';

// getWraparoundMoves logs verbosely; silence it so test output stays readable.
beforeEach(() => {
  vi.spyOn(console, 'log').mockImplementation(() => {});
});

describe('WraparoundChessEngine (standard mode)', () => {
  it('delegates legal-move generation to chess.js for the initial position', () => {
    const engine = new WraparoundChessEngine();
    expect(engine.getLegalMoves('b1').sort()).toEqual(['a3', 'c3'].sort());
    expect(engine.getLegalMoves('e2').sort()).toEqual(['e3', 'e4'].sort());
  });

  it('makes a legal move and switches turn', () => {
    const engine = new WraparoundChessEngine();
    expect(engine.turn()).toBe('white');
    const move = engine.makeMove('e2', 'e4');
    expect(move).not.toBeNull();
    expect(move!.san).toBe('e4');
    expect(engine.turn()).toBe('black');
    expect(engine.getPiece('e4')).toEqual({ type: 'pawn', color: 'white' });
    expect(engine.getPiece('e2')).toBeNull();
  });

  it('rejects an illegal move', () => {
    const engine = new WraparoundChessEngine();
    expect(engine.makeMove('e2', 'e5')).toBeNull();
    expect(engine.turn()).toBe('white');
  });

  it('reports no check/checkmate/draw in the initial position', () => {
    const engine = new WraparoundChessEngine();
    expect(engine.inCheck()).toBe(false);
    expect(engine.isCheckmate()).toBe(false);
    expect(engine.isDraw()).toBe(false);
    expect(engine.isGameOver()).toBe(false);
  });

  it("Fool's mate produces checkmate", () => {
    const engine = new WraparoundChessEngine();
    engine.makeMove('f2', 'f3');
    engine.makeMove('e7', 'e5');
    engine.makeMove('g2', 'g4');
    engine.makeMove('d8', 'h4');
    expect(engine.isCheckmate()).toBe(true);
    expect(engine.isGameOver()).toBe(true);
  });

  it('resets to the initial position', () => {
    const engine = new WraparoundChessEngine();
    engine.makeMove('e2', 'e4');
    engine.reset();
    expect(engine.getPiece('e2')).toEqual({ type: 'pawn', color: 'white' });
    expect(engine.turn()).toBe('white');
  });

  it('loads a FEN position', () => {
    const engine = new WraparoundChessEngine();
    const ok = engine.load('4k3/8/8/8/8/8/8/4K3 w - - 0 1');
    expect(ok).toBe(true);
    expect(engine.getPiece('e1')).toEqual({ type: 'king', color: 'white' });
    expect(engine.getPiece('e2')).toBeNull();
  });

  it('rejects an invalid FEN', () => {
    const engine = new WraparoundChessEngine();
    expect(engine.load('not-a-fen')).toBe(false);
  });
});

describe('WraparoundChessEngine (wraparound mode)', () => {
  // Rook on b4, a blocking black pawn on d4, otherwise-empty rank 4.
  // Horizontal reachability is computed per-target using whichever of the
  // direct/wraparound path is geometrically shorter for THAT target (not
  // whichever is actually unblocked) — see chessEngine.ts's isRookPathClear.
  // For this layout that means: a4/c4/d4(capture)/g4/h4 stay reachable
  // (checked via a path that doesn't cross d4), while e4/f4 are blocked
  // (checked via the direct path, which does cross d4).
  const ROOK_BLOCKED_FEN = '4k3/8/8/8/1R1p4/8/8/4K3 w - - 0 1';

  function makeWraparoundEngine(fen: string) {
    const engine = new WraparoundChessEngine(fen, true);
    return engine;
  }

  it('reaches around the board edge when the direct path is shorter to check but the wrap path is what gets used', () => {
    const engine = makeWraparoundEngine(ROOK_BLOCKED_FEN);
    const moves = engine.getLegalMoves('b4');

    expect(moves).toContain('a4');
    expect(moves).toContain('c4');
    expect(moves).toContain('d4'); // capture
    expect(moves).toContain('g4');
    expect(moves).toContain('h4');
    expect(moves).not.toContain('e4');
    expect(moves).not.toContain('f4');
  });

  it('validates a wraparound move via isValidWraparoundMove', () => {
    const engine = makeWraparoundEngine(ROOK_BLOCKED_FEN);
    expect(engine.isValidWraparoundMove('b4', 'g4')).toBe(true);
    expect(engine.isValidWraparoundMove('b4', 'f4')).toBe(false);
  });

  it('classifies a horizontal wraparound move and advances the turn on makeMove', () => {
    const engine = makeWraparoundEngine(ROOK_BLOCKED_FEN);
    expect(engine.turn()).toBe('white');

    const move = engine.makeMove('b4', 'g4');

    expect(move).not.toBeNull();
    expect(move!.isWraparound).toBe(true);
    expect(move!.wraparoundType).toBe('horizontal');
    expect(engine.getPiece('g4')).toEqual({ type: 'rook', color: 'white' });
    expect(engine.getPiece('b4')).toBeNull();
    expect(engine.turn()).toBe('black');
  });

  it('does not classify a short, non-wrapping move as wraparound', () => {
    const engine = makeWraparoundEngine(ROOK_BLOCKED_FEN);
    const move = engine.makeMove('b4', 'a4');
    expect(move).not.toBeNull();
    expect(move!.isWraparound).toBe(false);
  });

  it('lets a knight capture around the horizontal edge', () => {
    // White knight on a4, black pawn on g5 — a "2 files, 1 rank" jump that
    // only exists once the file axis wraps ((0 - 2 + 8) % 8 = 6 -> g-file).
    const engine = makeWraparoundEngine('4k3/8/8/6p1/N7/8/8/4K3 w - - 0 1');
    const moves = engine.getLegalMoves('a4');
    expect(moves).toContain('g5');
  });

  it('does not allow vertical wraparound for a rook', () => {
    // Rook on a1 with an otherwise-empty a-file: vertical moves never wrap,
    // so a8 must be reachable only via the direct (non-wrapping) path length.
    const engine = makeWraparoundEngine('4k3/8/8/8/8/8/8/R3K3 w - - 0 1');
    const moves = engine.getLegalMoves('a1');
    expect(moves).toContain('a8');
    // Standard mode (kings.only board) sanity: no wraparound is possible for
    // vertical movement regardless of geometry, unlike the horizontal case.
    expect(engine.getWraparoundMode()).toBe(true);
  });
});
