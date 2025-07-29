// Core game types
export type PieceType = 'pawn' | 'rook' | 'knight' | 'bishop' | 'queen' | 'king';
export type PieceColor = 'white' | 'black';
export type Square = string; // e.g., 'e4', 'a1'

export interface ChessPiece {
  type: PieceType;
  color: PieceColor;
}

export interface ChessMove {
  from: Square;
  to: Square;
  piece: ChessPiece;
  captured?: ChessPiece;
  promotion?: PieceType;
  castling?: 'kingside' | 'queenside';
  enPassant?: boolean;
  timestamp: number;
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
export type GameMode = 'bot' | 'multiplayer' | 'endless';
export type GameStatus = 'waiting' | 'active' | 'paused' | 'finished' | 'abandoned';
export type GameResult = 'white-wins' | 'black-wins' | 'draw' | 'ongoing';

export interface GameState {
  gameId: string;
  mode: GameMode;
  status: GameStatus;
  result: GameResult;
  position: GamePosition;
  moves: ChessMove[];
  players: {
    white: Player;
    black: Player;
  };
  timeControl?: TimeControl;
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
  endlessHighScore: number;
}

export interface UserPreferences {
  boardTheme: 'classic' | 'modern' | 'wood';
  pieceSet: 'classic' | 'modern' | 'symbols';
  showCoordinates: boolean;
  showPossibleMoves: boolean;
  soundEnabled: boolean;
  autoQueen: boolean;
}

// Lobby types
export interface Lobby {
  id: string;
  name: string;
  host: Player;
  guest?: Player;
  isPrivate: boolean;
  status: 'waiting' | 'full' | 'in-game';
  gameMode: GameMode;
  timeControl?: TimeControl;
  createdAt: number;
}

export interface TimeControl {
  initialTime: number; // seconds
  increment: number; // seconds per move
}

// Real-time communication types
export interface SocketEvents {
  // Client to server
  'join-lobby': { lobbyId: string; player: Player };
  'create-lobby': { lobby: Omit<Lobby, 'id' | 'createdAt'> };
  'leave-lobby': { lobbyId: string };
  'make-move': { gameId: string; move: ChessMove };
  'offer-draw': { gameId: string };
  'resign': { gameId: string };
  'start-endless': { player: Player };

  // Server to client
  'lobby-created': { lobby: Lobby };
  'lobby-joined': { lobby: Lobby };
  'lobby-left': { lobbyId: string };
  'game-started': { game: GameState };
  'move-made': { gameId: string; move: ChessMove; position: GamePosition };
  'game-ended': { gameId: string; result: GameResult; reason: string };
  'draw-offered': { gameId: string; offeredBy: PieceColor };
  'draw-accepted': { gameId: string };
  'draw-declined': { gameId: string };
  'player-resigned': { gameId: string; resignedBy: PieceColor };
  'time-update': { gameId: string; whiteTime: number; blackTime: number };
  'error': { message: string; code?: string };
}

// API types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: number;
}

export interface CreateLobbyRequest {
  name: string;
  isPrivate: boolean;
  timeControl?: TimeControl;
}

export interface JoinLobbyRequest {
  lobbyId: string;
  playerId: string;
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
  personality: 'aggressive' | 'defensive' | 'balanced';
}
