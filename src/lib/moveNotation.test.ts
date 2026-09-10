import { describe, expect, it } from 'vitest';
import {
  calculateMoveDistance,
  detectWraparoundMove,
  generateLAN,
  generatePGN,
  generateSAN,
  generateUCI,
  getEvaluationFromScore,
  parseMoveAnnotation,
} from './moveNotation';
import { ChessMove, ChessPiece, GamePosition } from '@/types/game';

function baseMove(overrides: Partial<ChessMove> = {}): ChessMove {
  return {
    from: 'e2',
    to: 'e4',
    piece: { type: 'pawn', color: 'white' },
    timestamp: 0,
    ...overrides,
  } as ChessMove;
}

const emptyContext = { position: { board: {} } as GamePosition, moves: [], moveIndex: 0, isWraparoundMode: false };

describe('generateSAN', () => {
  it('renders a simple pawn push', () => {
    expect(generateSAN(baseMove(), emptyContext)).toBe('e4');
  });

  it('renders a pawn capture with file disambiguation', () => {
    const move = baseMove({ to: 'd5', captured: { type: 'pawn', color: 'black' } });
    expect(generateSAN(move, emptyContext)).toBe('exd5');
  });

  it('renders a piece move with the piece letter', () => {
    const move = baseMove({ piece: { type: 'knight', color: 'white' }, from: 'b1', to: 'c3' });
    expect(generateSAN(move, emptyContext)).toBe('Nc3');
  });

  it('appends + for check and # for checkmate', () => {
    const check = baseMove({ isCheck: true });
    const mate = baseMove({ isCheckmate: true });
    expect(generateSAN(check, emptyContext)).toBe('e4+');
    expect(generateSAN(mate, emptyContext)).toBe('e4#');
  });

  it('renders castling', () => {
    expect(generateSAN(baseMove({ castling: 'kingside' }), emptyContext)).toBe('O-O');
    expect(generateSAN(baseMove({ castling: 'queenside' }), emptyContext)).toBe('O-O-O');
  });

  it('renders promotion', () => {
    const move = baseMove({ to: 'e8', promotion: 'queen' });
    expect(generateSAN(move, emptyContext)).toBe('e8=Q');
  });
});

describe('generateLAN', () => {
  it('renders from-dash-to for a quiet move', () => {
    expect(generateLAN(baseMove())).toBe('e2-e4');
  });

  it('renders from-x-to for a capture', () => {
    const move = baseMove({ captured: { type: 'pawn', color: 'black' } });
    expect(generateLAN(move)).toBe('e2xe4');
  });
});

describe('generateUCI', () => {
  it('renders plain from+to', () => {
    expect(generateUCI(baseMove())).toBe('e2e4');
  });

  it('appends the lowercase promotion letter', () => {
    const move = baseMove({ to: 'e8', promotion: 'queen' });
    expect(generateUCI(move)).toBe('e2e8q');
  });
});

describe('calculateMoveDistance', () => {
  it('computes Chebyshev distance without wraparound', () => {
    expect(calculateMoveDistance('a1', 'a8', false)).toBe(7);
    expect(calculateMoveDistance('a1', 'h1', false)).toBe(7);
    expect(calculateMoveDistance('a1', 'b2', false)).toBe(1);
  });

  it('uses the shorter of direct/wraparound distance when enabled', () => {
    // a-file to h-file: direct = 7, wraparound = 1.
    expect(calculateMoveDistance('a1', 'h1', true)).toBe(1);
  });
});

describe('detectWraparoundMove', () => {
  const whitePawn: ChessPiece = { type: 'pawn', color: 'white' };

  it('reports no wraparound for a short move', () => {
    expect(detectWraparoundMove('a1', 'b2', whitePawn).isWraparound).toBe(false);
  });

  it('detects a horizontal wraparound for a file jump greater than 4', () => {
    const result = detectWraparoundMove('a4', 'h4', whitePawn);
    expect(result.isWraparound).toBe(true);
    expect(result.type).toBe('horizontal');
  });

  it('classifies a knight wraparound distinctly from other piece types', () => {
    const knight: ChessPiece = { type: 'knight', color: 'white' };
    const result = detectWraparoundMove('a4', 'g5', knight);
    expect(result.isWraparound).toBe(true);
    expect(result.type).toBe('knight');
  });
});

describe('getEvaluationFromScore', () => {
  it('classifies large losses as blunders and mistakes', () => {
    expect(getEvaluationFromScore(600)).toBe('blunder');
    expect(getEvaluationFromScore(250)).toBe('mistake');
    expect(getEvaluationFromScore(150)).toBe('inaccuracy');
  });

  it('classifies small/neutral scores as good by default', () => {
    expect(getEvaluationFromScore(0)).toBe('good');
  });
});

describe('parseMoveAnnotation', () => {
  it('accepts a known annotation', () => {
    expect(parseMoveAnnotation('!!')).toBe('!!');
  });

  it('returns undefined for an unrecognized annotation', () => {
    expect(parseMoveAnnotation('not-an-annotation')).toBeUndefined();
  });
});

describe('generatePGN', () => {
  it('includes headers and move text', () => {
    const moves = [baseMove({ san: 'e4' }), baseMove({ from: 'e7', to: 'e5', san: 'e5' })];
    const pgn = generatePGN(moves, { white: 'Alice', black: 'Bob', result: '1-0' });
    expect(pgn).toContain('[White "Alice"]');
    expect(pgn).toContain('[Black "Bob"]');
    expect(pgn).toContain('1. e4 e5');
    expect(pgn.trim().endsWith('1-0')).toBe(true);
  });
});
