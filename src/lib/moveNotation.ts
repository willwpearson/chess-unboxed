/**
 * Chess Move Notation Utilities
 * Provides comprehensive support for standard and Chess Unboxed move notation
 */

import { Chess, Square as ChessJSSquare } from 'chess.js';
import { 
  ChessMove, 
  ChessPiece, 
  PieceType, 
  PieceColor, 
  Square, 
  GamePosition,
  MoveAnnotation,
  MoveEvaluation
} from '@/types/game';
import { WraparoundChessEngine } from './chessEngine';

// Piece notation mapping
const PIECE_NOTATION: Record<PieceType, string> = {
  king: 'K',
  queen: 'Q',
  rook: 'R',
  bishop: 'B',
  knight: 'N',
  pawn: ''
};

// Wraparound notation symbols
const WRAPAROUND_SYMBOLS = {
  horizontal: '↔',
  vertical: '↕',
  diagonal: '↗',
  knight: '⤴'
};

// Move evaluation colors and symbols
const EVALUATION_CONFIG = {
  blunder: { symbol: '??', color: 'text-red-600', bg: 'bg-red-50' },
  mistake: { symbol: '?', color: 'text-orange-600', bg: 'bg-orange-50' },
  inaccuracy: { symbol: '?!', color: 'text-yellow-600', bg: 'bg-yellow-50' },
  good: { symbol: '!', color: 'text-green-600', bg: 'bg-green-50' },
  excellent: { symbol: '!!', color: 'text-blue-600', bg: 'bg-blue-50' },
  brilliant: { symbol: '!!!', color: 'text-purple-600', bg: 'bg-purple-50' }
};

interface NotationContext {
  position: GamePosition;
  moves: ChessMove[];
  moveIndex: number;
  isWraparoundMode: boolean;
  engine?: WraparoundChessEngine;
}

/**
 * Generate Standard Algebraic Notation (SAN) for a chess move
 */
export function generateSAN(move: ChessMove, context: NotationContext): string {
  const { from, to, piece, captured, promotion, castling, enPassant, isCheck, isCheckmate } = move;

  // Handle castling
  if (castling) {
    const notation = castling === 'kingside' ? 'O-O' : 'O-O-O';
    return addCheckNotation(notation, isCheck, isCheckmate);
  }

  // Get piece notation
  const pieceNotation = PIECE_NOTATION[piece.type];
  
  // Handle captures
  const captureNotation = captured || enPassant ? 'x' : '';
  
  // Handle pawn captures (need file designation)
  let fromNotation = '';
  if (piece.type === 'pawn' && (captured || enPassant)) {
    fromNotation = from[0]; // File letter
  } else if (piece.type !== 'pawn') {
    // Check for disambiguation
    const disambiguation = calculateDisambiguation(move, context);
    if (disambiguation.file) fromNotation += from[0];
    if (disambiguation.rank) fromNotation += from[1];
  }

  // Handle promotion
  const promotionNotation = promotion ? `=${PIECE_NOTATION[promotion]}` : '';
  
  // Handle en passant
  const enPassantNotation = enPassant ? ' e.p.' : '';

  // Combine notation
  let notation = `${pieceNotation}${fromNotation}${captureNotation}${to}${promotionNotation}${enPassantNotation}`;
  
  // Add check/checkmate indicators
  notation = addCheckNotation(notation, isCheck, isCheckmate);

  return notation;
}

/**
 * Generate Long Algebraic Notation (LAN) for a chess move
 */
export function generateLAN(move: ChessMove): string {
  const { from, to, piece, captured, promotion, castling, enPassant, isCheck, isCheckmate } = move;

  // Handle castling
  if (castling) {
    const notation = castling === 'kingside' ? 'O-O' : 'O-O-O';
    return addCheckNotation(notation, isCheck, isCheckmate);
  }

  // Get piece notation
  const pieceNotation = PIECE_NOTATION[piece.type];
  
  // Handle captures
  const captureNotation = captured || enPassant ? 'x' : '-';
  
  // Handle promotion
  const promotionNotation = promotion ? `=${PIECE_NOTATION[promotion]}` : '';
  
  // Handle en passant
  const enPassantNotation = enPassant ? ' e.p.' : '';

  // Combine notation
  let notation = `${pieceNotation}${from}${captureNotation}${to}${promotionNotation}${enPassantNotation}`;
  
  // Add check/checkmate indicators
  notation = addCheckNotation(notation, isCheck, isCheckmate);

  return notation;
}

/**
 * Generate UCI notation for a chess move
 */
export function generateUCI(move: ChessMove): string {
  const { from, to, promotion } = move;
  const promotionNotation = promotion ? promotion[0].toLowerCase() : '';
  return `${from}${to}${promotionNotation}`;
}

/**
 * Generate Chess Unboxed wraparound notation
 */
export function generateWraparoundNotation(move: ChessMove, context: NotationContext): string {
  if (!move.isWraparound) {
    return generateSAN(move, context);
  }

  const baseNotation = generateSAN(move, context);
  const wraparoundSymbol = move.wraparoundType ? WRAPAROUND_SYMBOLS[move.wraparoundType] : '⟲';
  
  // Add wraparound indicator and path information
  let notation = `${baseNotation}${wraparoundSymbol}`;
  
  // Add distance information for complex wraparound moves
  if (move.wraparoundDistance && move.wraparoundDistance > 1) {
    notation += `[${move.wraparoundDistance}]`;
  }

  return notation;
}

/**
 * Calculate disambiguation requirements for a move
 */
function calculateDisambiguation(move: ChessMove, context: NotationContext): {
  file: boolean;
  rank: boolean;
  both: boolean;
} {
  if (move.disambiguation) {
    return {
      file: move.disambiguation.file || false,
      rank: move.disambiguation.rank || false,
      both: move.disambiguation.both || false
    };
  }

  const { from, to, piece } = move;
  const { position } = context;

  // Find all pieces of the same type and color that can move to the same square
  const sameTypePieces: Square[] = [];
  
  for (const square in position.board) {
    const boardPiece = position.board[square as Square];
    if (boardPiece && 
        boardPiece.type === piece.type && 
        boardPiece.color === piece.color && 
        square !== from) {
      
      // Check if this piece can also move to the target square
      if (context.engine && canPieceMoveToSquare(square as Square, to, context)) {
        sameTypePieces.push(square as Square);
      }
    }
  }

  if (sameTypePieces.length === 0) {
    return { file: false, rank: false, both: false };
  }

  // Check if file disambiguation is sufficient
  const sameFile = sameTypePieces.filter(square => square[0] === from[0]);
  const sameRank = sameTypePieces.filter(square => square[1] === from[1]);

  if (sameFile.length === 0) {
    return { file: true, rank: false, both: false };
  }

  if (sameRank.length === 0) {
    return { file: false, rank: true, both: false };
  }

  // Need both file and rank
  return { file: false, rank: false, both: true };
}

/**
 * Check if a piece can move to a specific square (simplified check)
 */
function canPieceMoveToSquare(from: Square, to: Square, context: NotationContext): boolean {
  if (!context.engine) return false;
  
  try {
    const legalMoves = context.engine.getLegalMoves(from);
    return legalMoves.includes(to);
  } catch {
    return false;
  }
}

/**
 * Add check and checkmate notation to a move string
 */
function addCheckNotation(notation: string, isCheck?: boolean, isCheckmate?: boolean): string {
  if (isCheckmate) {
    return `${notation}#`;
  } else if (isCheck) {
    return `${notation}+`;
  }
  return notation;
}

/**
 * Format move with annotations and evaluation
 */
export function formatMoveWithAnnotations(move: ChessMove, context: NotationContext): {
  notation: string;
  annotation?: string;
  evaluation?: {
    symbol: string;
    color: string;
    bg: string;
    score?: number;
  };
  isWraparound: boolean;
  wraparoundInfo?: {
    type: string;
    symbol: string;
    distance?: number;
    path?: Square[];
  };
} {
  // Generate appropriate notation based on mode
  const notation = context.isWraparoundMode 
    ? generateWraparoundNotation(move, context)
    : generateSAN(move, context);

  const result: ReturnType<typeof formatMoveWithAnnotations> = {
    notation,
    isWraparound: move.isWraparound || false
  };

  // Add annotation
  if (move.annotation) {
    result.annotation = move.annotation;
  }

  // Add evaluation
  if (move.evaluation) {
    const evalConfig = EVALUATION_CONFIG[move.evaluation];
    result.evaluation = {
      ...evalConfig,
      score: move.evaluationScore
    };
  }

  // Add wraparound information
  if (move.isWraparound) {
    result.wraparoundInfo = {
      type: move.wraparoundType || 'unknown',
      symbol: move.wraparoundType ? WRAPAROUND_SYMBOLS[move.wraparoundType] : '⟲',
      distance: move.wraparoundDistance,
      path: move.wraparoundPath
    };
  }

  return result;
}

/**
 * Generate PGN (Portable Game Notation) from move history
 */
export function generatePGN(
  moves: ChessMove[], 
  gameInfo: {
    white: string;
    black: string;
    result: string;
    date?: string;
    event?: string;
    site?: string;
  }
): string {
  const headers = [
    `[Event "${gameInfo.event || 'Chess Unboxed Game'}"]`,
    `[Site "${gameInfo.site || 'Chess Unboxed'}"]`,
    `[Date "${gameInfo.date || new Date().toISOString().split('T')[0]}"]`,
    `[White "${gameInfo.white}"]`,
    `[Black "${gameInfo.black}"]`,
    `[Result "${gameInfo.result}"]`
  ];

  // Generate moves with move numbers
  const moveStrings: string[] = [];
  for (let i = 0; i < moves.length; i += 2) {
    const moveNumber = Math.floor(i / 2) + 1;
    const whiteMove = moves[i];
    const blackMove = moves[i + 1];

    let moveString = `${moveNumber}.`;
    
    if (whiteMove) {
      moveString += ` ${whiteMove.san || generateSAN(whiteMove, { position: {} as GamePosition, moves, moveIndex: i, isWraparoundMode: false })}`;
    }
    
    if (blackMove) {
      moveString += ` ${blackMove.san || generateSAN(blackMove, { position: {} as GamePosition, moves, moveIndex: i + 1, isWraparoundMode: false })}`;
    }

    moveStrings.push(moveString);
  }

  return `${headers.join('\n')}\n\n${moveStrings.join(' ')} ${gameInfo.result}`;
}

/**
 * Parse move annotation from string
 */
export function parseMoveAnnotation(annotation: string): MoveAnnotation | undefined {
  const validAnnotations: MoveAnnotation[] = ['!', '?', '!!', '??', '!?', '?!'];
  return validAnnotations.find(a => a === annotation);
}

/**
 * Get evaluation from centipawn score
 */
export function getEvaluationFromScore(score: number): MoveEvaluation {
  const absScore = Math.abs(score);
  
  if (absScore >= 500) return 'blunder';
  if (absScore >= 200) return 'mistake';
  if (absScore >= 100) return 'inaccuracy';
  if (absScore <= -50) return 'excellent';
  if (absScore <= -100) return 'brilliant';
  
  return 'good';
}

/**
 * Calculate move distance considering wraparound
 */
export function calculateMoveDistance(from: Square, to: Square, isWraparound: boolean = false): number {
  const fromFile = from.charCodeAt(0) - 97; // a=0, b=1, etc.
  const fromRank = parseInt(from[1]) - 1;
  const toFile = to.charCodeAt(0) - 97;
  const toRank = parseInt(to[1]) - 1;

  if (!isWraparound) {
    return Math.max(Math.abs(toFile - fromFile), Math.abs(toRank - fromRank));
  }

  // Calculate both direct and wraparound distances
  const directFileDistance = Math.abs(toFile - fromFile);
  const directRankDistance = Math.abs(toRank - fromRank);
  const wraparoundFileDistance = 8 - directFileDistance;
  const wraparoundRankDistance = 8 - directRankDistance;

  const fileDistance = Math.min(directFileDistance, wraparoundFileDistance);
  const rankDistance = Math.min(directRankDistance, wraparoundRankDistance);

  return Math.max(fileDistance, rankDistance);
}

/**
 * Detect if a move uses wraparound
 */
export function detectWraparoundMove(from: Square, to: Square, piece: ChessPiece): {
  isWraparound: boolean;
  type?: 'horizontal' | 'vertical' | 'diagonal' | 'knight';
  distance?: number;
} {
  const fromFile = from.charCodeAt(0) - 97;
  const fromRank = parseInt(from[1]) - 1;
  const toFile = to.charCodeAt(0) - 97;
  const toRank = parseInt(to[1]) - 1;

  const fileDistance = Math.abs(toFile - fromFile);
  const rankDistance = Math.abs(toRank - fromRank);

  // Check if move crosses board edges in a way that suggests wraparound
  const usesHorizontalWrap = fileDistance > 4;
  const usesVerticalWrap = rankDistance > 4;

  if (!usesHorizontalWrap && !usesVerticalWrap) {
    return { isWraparound: false };
  }

  let type: 'horizontal' | 'vertical' | 'diagonal' | 'knight' = 'horizontal';

  if (piece.type === 'knight') {
    type = 'knight';
  } else if (usesHorizontalWrap && usesVerticalWrap) {
    type = 'diagonal';
  } else if (usesVerticalWrap) {
    type = 'vertical';
  } else {
    type = 'horizontal';
  }

  const distance = calculateMoveDistance(from, to, true);

  return {
    isWraparound: true,
    type,
    distance
  };
}