/**
 * Example data and utilities for testing the enhanced MoveHistory component
 */

import { ChessMove, ChessPiece, GamePosition } from '@/types/game';

// Example chess moves with comprehensive data
export const exampleMoves: ChessMove[] = [
  // Standard opening moves
  {
    from: 'e2',
    to: 'e4',
    piece: { type: 'pawn', color: 'white' },
    timestamp: Date.now() - 60000,
    san: 'e4',
    annotation: '!',
    evaluation: 'good'
  },
  {
    from: 'e7',
    to: 'e5',
    piece: { type: 'pawn', color: 'black' },
    timestamp: Date.now() - 58000,
    san: 'e5',
    evaluation: 'good'
  },
  {
    from: 'g1',
    to: 'f3',
    piece: { type: 'knight', color: 'white' },
    timestamp: Date.now() - 56000,
    san: 'Nf3',
    evaluation: 'good'
  },
  {
    from: 'b8',
    to: 'c6',
    piece: { type: 'knight', color: 'black' },
    timestamp: Date.now() - 54000,
    san: 'Nc6',
    evaluation: 'good'
  },
  // Capture move
  {
    from: 'f1',
    to: 'c4',
    piece: { type: 'bishop', color: 'white' },
    timestamp: Date.now() - 52000,
    san: 'Bc4',
    evaluation: 'good'
  },
  {
    from: 'd7',
    to: 'd6',
    piece: { type: 'pawn', color: 'black' },
    captured: { type: 'pawn', color: 'white' },
    timestamp: Date.now() - 50000,
    san: 'dxe6',
    annotation: '?',
    evaluation: 'mistake',
    evaluationScore: -150
  },
  // Check move
  {
    from: 'c4',
    to: 'f7',
    piece: { type: 'bishop', color: 'white' },
    captured: { type: 'pawn', color: 'black' },
    timestamp: Date.now() - 48000,
    san: 'Bxf7+',
    isCheck: true,
    annotation: '!!',
    evaluation: 'excellent',
    evaluationScore: 300
  },
  // King move
  {
    from: 'e8',
    to: 'f8',
    piece: { type: 'king', color: 'black' },
    timestamp: Date.now() - 46000,
    san: 'Kf8',
    evaluation: 'good'
  },
  // Castling
  {
    from: 'e1',
    to: 'g1',
    piece: { type: 'king', color: 'white' },
    castling: 'kingside',
    timestamp: Date.now() - 44000,
    san: 'O-O',
    evaluation: 'good'
  },
  // Promotion
  {
    from: 'a7',
    to: 'a8',
    piece: { type: 'pawn', color: 'black' },
    promotion: 'queen',
    timestamp: Date.now() - 42000,
    san: 'a8=Q',
    annotation: '!',
    evaluation: 'excellent'
  }
];

// Example Chess Unboxed wraparound moves
export const exampleWraparoundMoves: ChessMove[] = [
  // Horizontal wraparound move
  {
    from: 'a4',
    to: 'h4',
    piece: { type: 'rook', color: 'white' },
    timestamp: Date.now() - 40000,
    san: 'Ra4→h4',
    isWraparound: true,
    wraparoundType: 'horizontal',
    wraparoundDistance: 1,
    wraparoundPath: ['a4', 'h4'],
    evaluation: 'good'
  },
  // Vertical wraparound knight move
  {
    from: 'e8',
    to: 'f2',
    piece: { type: 'knight', color: 'black' },
    timestamp: Date.now() - 38000,
    san: 'Ne8→f2⤴',
    isWraparound: true,
    wraparoundType: 'knight',
    wraparoundDistance: 2,
    wraparoundPath: ['e8', 'f2'],
    annotation: '!?',
    evaluation: 'good'
  },
  // Diagonal wraparound bishop
  {
    from: 'a1',
    to: 'h8',
    piece: { type: 'bishop', color: 'white' },
    captured: { type: 'queen', color: 'black' },
    timestamp: Date.now() - 36000,
    san: 'Ba1xh8↗',
    isCheck: true,
    isWraparound: true,
    wraparoundType: 'diagonal',
    wraparoundDistance: 1,
    wraparoundPath: ['a1', 'h8'],
    annotation: '!!',
    evaluation: 'brilliant',
    evaluationScore: 900
  }
];

// Example game information
export const exampleGameInfo = {
  white: 'Magnus Carlsen',
  black: 'Hikaru Nakamura',
  result: '1-0',
  date: '2024-01-15',
  event: 'Chess Unboxed Championship',
  site: 'Chess Unboxed Platform'
};

// Example game position (simplified)
export const exampleGamePosition: GamePosition = {
  board: {
    'a1': { type: 'rook', color: 'white' },
    'b1': { type: 'knight', color: 'white' },
    'c1': { type: 'bishop', color: 'white' },
    'd1': { type: 'queen', color: 'white' },
    'e1': { type: 'king', color: 'white' },
    'f1': { type: 'bishop', color: 'white' },
    'g1': { type: 'knight', color: 'white' },
    'h1': { type: 'rook', color: 'white' },
    'a8': { type: 'rook', color: 'black' },
    'b8': { type: 'knight', color: 'black' },
    'c8': { type: 'bishop', color: 'black' },
    'd8': { type: 'queen', color: 'black' },
    'e8': { type: 'king', color: 'black' },
    'f8': { type: 'bishop', color: 'black' },
    'g8': { type: 'knight', color: 'black' },
    'h8': { type: 'rook', color: 'black' }
  } as Record<string, ChessPiece | null>,
  turn: 'white',
  castling: {
    whiteKingside: true,
    whiteQueenside: true,
    blackKingside: true,
    blackQueenside: true
  },
  halfmoveClock: 0,
  fullmoveNumber: 1
};

/**
 * Generate sample moves for testing different scenarios
 */
export function generateTestMoves(scenario: 'standard' | 'wraparound' | 'mixed'): ChessMove[] {
  switch (scenario) {
    case 'standard':
      return exampleMoves;
    case 'wraparound':
      return exampleWraparoundMoves;
    case 'mixed':
      return [...exampleMoves, ...exampleWraparoundMoves];
    default:
      return exampleMoves;
  }
}

/**
 * Create a move with specific characteristics for testing
 */
export function createTestMove(options: {
  from: string;
  to: string;
  piece: ChessPiece;
  isCheck?: boolean;
  isCheckmate?: boolean;
  captured?: ChessPiece;
  promotion?: 'queen' | 'rook' | 'bishop' | 'knight';
  castling?: 'kingside' | 'queenside';
  enPassant?: boolean;
  isWraparound?: boolean;
  wraparoundType?: 'horizontal' | 'vertical' | 'diagonal' | 'knight';
  annotation?: '!' | '?' | '!!' | '??' | '!?' | '?!';
  evaluation?: 'blunder' | 'mistake' | 'inaccuracy' | 'good' | 'excellent' | 'brilliant';
  evaluationScore?: number;
}): ChessMove {
  return {
    from: options.from as any,
    to: options.to as any,
    piece: options.piece,
    captured: options.captured,
    promotion: options.promotion,
    castling: options.castling,
    enPassant: options.enPassant || false,
    isCheck: options.isCheck || false,
    isCheckmate: options.isCheckmate || false,
    isWraparound: options.isWraparound || false,
    wraparoundType: options.wraparoundType,
    annotation: options.annotation,
    evaluation: options.evaluation,
    evaluationScore: options.evaluationScore,
    timestamp: Date.now()
  };
}

/**
 * Example usage of the enhanced MoveHistory component
 */
export const moveHistoryUsageExample = `
import { MoveHistory } from '@/components/game/MoveHistory';
import { WraparoundChessEngine } from '@/lib/chessEngine';
import { exampleMoves, exampleGameInfo, exampleGamePosition } from '@/lib/moveHistoryExamples';

function GameInterface() {
  const [currentMoveIndex, setCurrentMoveIndex] = useState(-1);
  const engine = new WraparoundChessEngine();

  return (
    <MoveHistory
      moves={exampleMoves}
      currentMoveIndex={currentMoveIndex}
      onMoveClick={setCurrentMoveIndex}
      gamePosition={exampleGamePosition}
      isWraparoundMode={false}
      engine={engine}
      gameInfo={exampleGameInfo}
      showEvaluations={true}
      showTimings={true}
      showWraparoundInfo={true}
    />
  );
}
`;