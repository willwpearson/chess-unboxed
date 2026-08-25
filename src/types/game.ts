// Core game types
export type PieceType = 'pawn' | 'rook' | 'knight' | 'bishop' | 'queen' | 'king';
export type PieceColor = 'white' | 'black';
export type Square = string; // e.g., 'e4', 'a1'

// Chess.js integration types
export interface ChessJSMoveInfo {
  from: Square;
  to: Square;
  promotion?: PieceType;
  flags: string;
  piece: PieceType;
  captured?: PieceType;
  san: string;
  lan: string;
}

export interface ChessPiece {
  type: PieceType;
  color: PieceColor;
}

// Move annotation types
export type MoveAnnotation = '!' | '?' | '!!' | '??' | '!?' | '?!';
export type MoveEvaluation = 'blunder' | 'mistake' | 'inaccuracy' | 'good' | 'excellent' | 'brilliant';

export interface ChessMove {
  from: Square;
  to: Square;
  piece: ChessPiece;
  captured?: ChessPiece;
  promotion?: PieceType;
  castling?: 'kingside' | 'queenside';
  enPassant?: boolean;
  isWraparound?: boolean;
  wraparoundType?: 'horizontal' | 'vertical' | 'diagonal' | 'knight';
  timestamp: number;
  // Enhanced move information
  isCheck?: boolean;
  isCheckmate?: boolean;
  isStalemate?: boolean;
  annotation?: MoveAnnotation;
  evaluation?: MoveEvaluation;
  evaluationScore?: number; // Centipawn evaluation
  san?: string; // Standard Algebraic Notation
  lan?: string; // Long Algebraic Notation
  uci?: string; // Universal Chess Interface notation
  disambiguation?: {
    file?: boolean;
    rank?: boolean;
    both?: boolean;
  };
  // Wraparound specific
  wraparoundPath?: Square[]; // Path taken for wraparound moves
  wraparoundDistance?: number; // Distance traveled including wraparound
}

export interface GamePosition {
  board: Record<Square, ChessPiece | null>;
  turn: PieceColor;
  castling: {
    whiteKingside: boolean;
    whiteQueenside: boolean;
    blackKingside: boolean;
    blackQueenside: boolean;
  };
  enPassantTarget?: Square;
  halfmoveClock: number;
  fullmoveNumber: number;
}

// Game state types
export type GameMode = 'bot';
export type GameVariant = 'unboxed';
export type GameStatus = 'waiting' | 'active' | 'paused' | 'finished' | 'abandoned';
export type GameResult = 'white-wins' | 'black-wins' | 'draw' | 'ongoing';
export type GameEndReason = 'checkmate' | 'stalemate' | 'resignation' | 'timeout' | 'draw-agreement' | 'insufficient-material' | 'fifty-move-rule' | 'threefold-repetition' | 'abandoned';

export interface GameState {
  gameId: string;
  mode: GameMode;
  variant: GameVariant;
  status: GameStatus;
  result: GameResult;
  endReason?: GameEndReason;
  position: GamePosition;
  moves: ChessMove[];
  moveHistory: string[]; // PGN algebraic notation
  players: {
    white: Player;
    black: Player;
  };
  timeControl?: TimeControl;
  startedAt?: number;
  endedAt?: number;
  lastMoveAt?: number;
  createdAt: number;
  updatedAt: number;
}

// Player types
export interface Player {
  id: string;
  name: string;
  color: PieceColor;
  isBot: boolean;
  rating?: number;
  timeRemaining?: number;
}

export interface User {
  id: string;
  name: string;
  isOnline: boolean;
  currentGameId?: string;
  stats: PlayerStats;
  preferences: UserPreferences;
  createdAt: number;
}

export interface PlayerStats {
  gamesPlayed: number;
  wins: number;
  losses: number;
  draws: number;
  rating: number;
}

export interface UserPreferences {
  // Display settings
  theme: 'dark';
  language: 'en' | 'es' | 'fr' | 'de' | 'ru' | 'zh' | 'ja' | 'ko';
  timezone: string;
  dateFormat: 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD';
  
  // Game settings
  boardTheme: 'classic' | 'modern' | 'wood' | 'neon' | 'cyberpunk';
  pieceSet: 'classic' | 'modern' | 'symbols';
  showCoordinates: boolean;
  showPossibleMoves: boolean;
  moveAnimationSpeed: 'slow' | 'normal' | 'fast' | 'instant';
  soundEnabled: boolean;
  autoQueen: boolean;
  
  // Notification settings
  emailNotifications: {
    gameInvites: boolean;
    friendRequests: boolean;
    tournaments: boolean;
    dailyPuzzles: boolean;
    weeklyDigest: boolean;
  };
  pushNotifications: {
    moves: boolean;
    gameStart: boolean;
    gameEnd: boolean;
    friendActivity: boolean;
  };
  
  // Privacy settings
  profileVisibility: 'public' | 'friends' | 'private';
  showOnlineStatus: boolean;
  allowFriendRequests: boolean;
  showGameHistory: boolean;
  showRatingHistory: boolean;
}

export interface TimeControl {
  initialTime: number; // seconds
  increment: number; // seconds per move
}

// API types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: number;
}

export interface MakeMoveRequest {
  gameId: string;
  move: {
    from: Square;
    to: Square;
    promotion?: PieceType;
  };
}

// UI State types
export interface UIState {
  selectedSquare: Square | null;
  possibleMoves: Square[];
  draggedPiece: {
    piece: ChessPiece;
    from: Square;
  } | null;
  showPromotionDialog: boolean;
  promotionSquare: Square | null;
}

// Bot difficulty levels
export type BotDifficulty = 'easy' | 'medium' | 'hard' | 'expert';

export interface BotConfig {
  difficulty: BotDifficulty;
  thinkingTime: number; // ms
  personality: 'Aggressive' | 'Defensive' | 'Balanced';
}

