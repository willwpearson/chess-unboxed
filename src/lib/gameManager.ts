/**
 * Comprehensive Game Management System
 * Handles game initialization, turn management, move validation, and game state transitions
 */

import { Chess } from 'chess.js';
import { WraparoundChessEngine } from './chessEngine';
import { normalizeColor, normalizePieceType } from './utils';
import { 
  GameState, 
  GameMode, 
  GameVariant, 
  GameStatus, 
  GameResult, 
  GameEndReason,
  Player, 
  ChessMove, 
  GamePosition, 
  PieceColor, 
  Square, 
  ChessPiece,
  PieceType,
  TimeControl,
  BotConfig,
  BotDifficulty
} from '@/types/game';

export interface GameInitializationOptions {
  mode: GameMode;
  variant: GameVariant;
  players: {
    white: Player;
    black: Player;
  };
  timeControl?: TimeControl;
  fen?: string;
}

export interface MoveValidationResult {
  isValid: boolean;
  move?: ChessMove;
  error?: string;
  gameEnd?: {
    result: GameResult;
    reason: GameEndReason;
  };
}

export interface GameAnalysis {
  isCheck: boolean;
  isCheckmate: boolean;
  isDraw: boolean;
  isStalemate: boolean;
  gameResult: GameResult;
  endReason?: GameEndReason;
  legalMoves: number;
}

/**
 * Comprehensive game management class
 */
export class GameManager {
  private engine: Chess | WraparoundChessEngine;
  private gameState: GameState;
  private moveCount: number = 0;
  private positionHistory: string[] = [];

  constructor(options: GameInitializationOptions) {
    this.gameState = this.initializeGameState(options);
    this.engine = this.createEngine(options.variant, options.fen);
    this.positionHistory.push(this.engine.fen());
  }

  /**
   * Initialize a new game state
   */
  private initializeGameState(options: GameInitializationOptions): GameState {
    const now = Date.now();
    
    return {
      gameId: `${options.mode}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      mode: options.mode,
      variant: options.variant,
      status: 'active',
      result: 'ongoing',
      position: this.createInitialPosition(options.fen),
      moves: [],
      moveHistory: [],
      players: options.players,
      timeControl: options.timeControl,
      startedAt: now,
      createdAt: now,
      updatedAt: now
    };
  }

  /**
   * Create appropriate chess engine based on variant
   */
  private createEngine(variant: GameVariant, fen?: string): Chess | WraparoundChessEngine {
    const isWraparound = variant === 'unboxed' || variant === 'programming_unboxed';
    
    if (isWraparound) {
      return new WraparoundChessEngine(fen, true);
    } else {
      const chess = new Chess();
      if (fen) {
        try {
          chess.load(fen);
        } catch (error) {
          console.warn('Invalid FEN provided, using default position:', error);
        }
      }
      return chess;
    }
  }

  /**
   * Create initial chess position
   */
  private createInitialPosition(fen?: string): GamePosition {
    const chess = new Chess();
    if (fen) {
      try {
        chess.load(fen);
      } catch (error) {
        console.warn('Invalid FEN, using default position');
      }
    }

    const board = chess.board();
    const position: Record<Square, ChessPiece | null> = {};

    // Convert chess.js board to our format
    for (let rank = 0; rank < 8; rank++) {
      for (let file = 0; file < 8; file++) {
        const square = `${String.fromCharCode(97 + file)}${8 - rank}` as Square;
        const piece = board[rank][file];
        
        if (piece) {
          position[square] = {
            type: normalizePieceType(piece.type),
            color: normalizeColor(piece.color)
          };
        } else {
          position[square] = null;
        }
      }
    }

    return {
      board: position,
      turn: chess.turn() === 'w' ? 'white' : 'black',
      castling: {
        whiteKingside: chess.getCastlingRights('w').k,
        whiteQueenside: chess.getCastlingRights('w').q,
        blackKingside: chess.getCastlingRights('b').k,
        blackQueenside: chess.getCastlingRights('b').q,
      },
      enPassantTarget: undefined, // TODO: Extract from FEN when available
      halfmoveClock: 0, // TODO: Extract from FEN
      fullmoveNumber: chess.moveNumber()
    };
  }

  /**
   * Validate and make a move
   */
  public makeMove(from: Square, to: Square, promotion?: PieceType): MoveValidationResult {
    console.log(`[DEBUG] GameManager.makeMove: ${from} -> ${to}, promotion=${promotion}, engine type=${this.engine instanceof WraparoundChessEngine ? 'WraparoundChessEngine' : 'Chess.js'}`);
    
    try {
      // Validate it's the correct player's turn
      const currentPlayer = this.getCurrentPlayer();
      const piece = this.gameState.position.board[from];
      
      console.log('GameManager validation - currentPlayer:', currentPlayer, 'piece.color:', piece?.color, 'match:', piece?.color === currentPlayer);
      
      if (!piece) {
        console.log('GameManager: No piece at source square');
        return { isValid: false, error: 'No piece at source square' };
      }

      if (normalizeColor(piece.color) !== currentPlayer) {
        console.log('GameManager: Not your turn');
        return { isValid: false, error: 'Not your turn' };
      }

      // Attempt the move using appropriate engine
      let moveResult: ChessMove | null = null;
      let algebraicNotation = '';

      console.log('GameManager: Attempting move with engine type:', this.engine instanceof WraparoundChessEngine ? 'WraparoundChessEngine' : 'Chess.js');

      if (this.engine instanceof WraparoundChessEngine) {
        moveResult = this.engine.makeMove(from, to, promotion);
        console.log('WraparoundChessEngine moveResult:', moveResult);
        if (moveResult) {
          algebraicNotation = this.generateAlgebraicNotation(moveResult);
        }
      } else {
        // Convert promotion piece type to chess.js format
        const chessPromotion = promotion ? this.convertToChessJSPromotion(promotion) : undefined;
        
        const chessMove = this.engine.move({
          from: from,
          to: to,
          promotion: chessPromotion
        });

        if (chessMove) {
          algebraicNotation = chessMove.san;
          moveResult = {
            from,
            to,
            piece: piece,
            captured: chessMove.captured ? {
              type: chessMove.captured as PieceType,
              color: chessMove.color === 'w' ? 'black' : 'white'
            } : undefined,
            promotion: chessMove.promotion as PieceType | undefined,
            castling: chessMove.flags.includes('k') ? 'kingside' : 
                     chessMove.flags.includes('q') ? 'queenside' : undefined,
            enPassant: chessMove.flags.includes('e'),
            timestamp: Date.now()
          };
        }
      }

      if (!moveResult) {
        console.log('GameManager: Move failed - no moveResult');
        return { isValid: false, error: 'Invalid move' };
      }

      console.log('GameManager: Move successful, updating game state');

      // Update game state
      this.updateGameStateAfterMove(moveResult, algebraicNotation);

      // Analyze new position
      const analysis = this.analyzePosition();
      let gameEnd = undefined;

      if (analysis.gameResult !== 'ongoing') {
        gameEnd = {
          result: analysis.gameResult,
          reason: analysis.endReason!
        };
        this.endGame(analysis.gameResult, analysis.endReason!);
      }

      console.log('GameManager: Returning successful move result');
      return {
        isValid: true,
        move: moveResult,
        gameEnd
      };

    } catch (error) {
      console.error('Move validation error:', error);
      return { isValid: false, error: 'Move validation failed' };
    }
  }

  /**
   * Update game state after a successful move
   */
  private updateGameStateAfterMove(move: ChessMove, algebraicNotation: string): void {
    const now = Date.now();

    // Add move to history
    this.gameState.moves.push(move);
    this.gameState.moveHistory.push(algebraicNotation);

    // Update position
    this.gameState.position = this.getCurrentPosition();
    
    // Update timestamps
    this.gameState.lastMoveAt = now;
    this.gameState.updatedAt = now;

    // Add to position history for draw detection
    this.positionHistory.push(this.engine.fen());
    this.moveCount++;
  }

  /**
   * Get current board position from engine
   */
  private getCurrentPosition(): GamePosition {
    if (this.engine instanceof WraparoundChessEngine) {
      return {
        board: this.engine.getPosition(),
        turn: this.engine.turn(),
        castling: {
          whiteKingside: true, // TODO: Track castling rights in wraparound mode
          whiteQueenside: true,
          blackKingside: true,
          blackQueenside: true,
        },
        halfmoveClock: 0, // TODO: Implement halfmove clock
        fullmoveNumber: Math.floor(this.moveCount / 2) + 1
      };
    } else {
      const chess = this.engine;
      const board = chess.board();
      const position: Record<Square, ChessPiece | null> = {};

      // Convert chess.js board to our format
      for (let rank = 0; rank < 8; rank++) {
        for (let file = 0; file < 8; file++) {
          const square = `${String.fromCharCode(97 + file)}${8 - rank}` as Square;
          const piece = board[rank][file];
          
          if (piece) {
            position[square] = {
              type: normalizePieceType(piece.type),
              color: normalizeColor(piece.color)
            };
          } else {
            position[square] = null;
          }
        }
      }

      return {
        board: position,
        turn: chess.turn() === 'w' ? 'white' : 'black',
        castling: {
          whiteKingside: chess.getCastlingRights('w').k,
          whiteQueenside: chess.getCastlingRights('w').q,
          blackKingside: chess.getCastlingRights('b').k,
          blackQueenside: chess.getCastlingRights('b').q,
        },
        enPassantTarget: undefined, // TODO: Extract from FEN when available
        halfmoveClock: 0, // TODO: Extract from FEN
        fullmoveNumber: chess.moveNumber()
      };
    }
  }

  /**
   * Analyze current position for game end conditions
   */
  private analyzePosition(): GameAnalysis {
    const isCheck = this.engine.inCheck();
    const isCheckmate = this.engine.isCheckmate();
    const isDraw = this.engine.isDraw();
    
    // Additional draw detection
    const isStalemate = !isCheck && this.getLegalMoves().length === 0;
    const isThreefoldRepetition = this.checkThreefoldRepetition();
    const isFiftyMoveRule = this.checkFiftyMoveRule();
    const isInsufficientMaterial = this.checkInsufficientMaterial();

    let gameResult: GameResult = 'ongoing';
    let endReason: GameEndReason | undefined;

    if (isCheckmate) {
      gameResult = this.getCurrentPlayer() === 'white' ? 'black-wins' : 'white-wins';
      endReason = 'checkmate';
    } else if (isStalemate) {
      gameResult = 'draw';
      endReason = 'stalemate';
    } else if (isThreefoldRepetition) {
      gameResult = 'draw';
      endReason = 'threefold-repetition';
    } else if (isFiftyMoveRule) {
      gameResult = 'draw';
      endReason = 'fifty-move-rule';
    } else if (isInsufficientMaterial) {
      gameResult = 'draw';
      endReason = 'insufficient-material';
    } else if (isDraw) {
      gameResult = 'draw';
      endReason = 'stalemate'; // Default draw reason
    }

    return {
      isCheck,
      isCheckmate,
      isDraw: gameResult === 'draw',
      isStalemate,
      gameResult,
      endReason,
      legalMoves: this.getLegalMoves().length
    };
  }

  /**
   * Check for threefold repetition
   */
  private checkThreefoldRepetition(): boolean {
    // For wraparound mode, disable threefold repetition for now
    // since FEN generation isn't properly implemented
    if (this.engine instanceof WraparoundChessEngine) {
      return false;
    }
    
    const currentPosition = this.engine.fen().split(' ')[0]; // Board position only
    let count = 0;
    
    for (const position of this.positionHistory) {
      if (position.split(' ')[0] === currentPosition) {
        count++;
        if (count >= 3) return true;
      }
    }
    
    return false;
  }

  /**
   * Check for fifty-move rule
   */
  private checkFiftyMoveRule(): boolean {
    // TODO: Implement proper fifty-move rule tracking
    return false;
  }

  /**
   * Check for insufficient material
   */
  private checkInsufficientMaterial(): boolean {
    const pieces: ChessPiece[] = [];
    
    for (const square in this.gameState.position.board) {
      const piece = this.gameState.position.board[square as Square];
      if (piece) {
        pieces.push(piece);
      }
    }

    // King vs King
    if (pieces.length === 2) return true;

    // King and Bishop/Knight vs King
    if (pieces.length === 3) {
      const nonKings = pieces.filter(p => p.type !== 'king');
      if (nonKings.length === 1 && ['bishop', 'knight'].includes(nonKings[0].type)) {
        return true;
      }
    }

    // King and Bishop vs King and Bishop (same color squares)
    if (pieces.length === 4) {
      const bishops = pieces.filter(p => p.type === 'bishop');
      if (bishops.length === 2) {
        // TODO: Check if bishops are on same color squares
        return false; // Simplified for now
      }
    }

    return false;
  }

  /**
   * Get all legal moves for current position
   */
  private getLegalMoves(): string[] {
    if (this.engine instanceof WraparoundChessEngine) {
      // Generate all legal moves for wraparound mode
      const moves: string[] = [];
      const currentPlayer = this.getCurrentPlayer();
      
      for (const square in this.gameState.position.board) {
        const piece = this.gameState.position.board[square as Square];
        if (piece && normalizeColor(piece.color) === currentPlayer) {
          const legalMoves = this.engine.getLegalMoves(square as Square);
          for (const to of legalMoves) {
            moves.push(`${square}${to}`); // Simple move notation
          }
        }
      }
      
      return moves;
    } else {
      return this.engine.moves();
    }
  }

  /**
   * Convert our promotion piece type to chess.js format
   */
  private convertToChessJSPromotion(piece: PieceType): string {
    switch (piece) {
      case 'queen': return 'q';
      case 'rook': return 'r';
      case 'bishop': return 'b';
      case 'knight': return 'n';
      default: return 'q'; // Default to queen
    }
  }

  /**
   * Generate algebraic notation for a move (for wraparound moves)
   */
  private generateAlgebraicNotation(move: ChessMove): string {
    // Simplified algebraic notation generation
    const pieceSymbol = move.piece.type === 'pawn' ? '' : 
                       move.piece.type.charAt(0).toUpperCase();
    
    let notation = pieceSymbol;
    
    if (move.captured) {
      if (move.piece.type === 'pawn') {
        notation += move.from.charAt(0); // File of capturing pawn
      }
      notation += 'x';
    }
    
    notation += move.to;
    
    if (move.promotion) {
      notation += '=' + move.promotion.charAt(0).toUpperCase();
    }
    
    if (move.castling) {
      notation = move.castling === 'kingside' ? 'O-O' : 'O-O-O';
    }

    // TODO: Add check/checkmate indicators

    return notation;
  }

  /**
   * End the game with a result and reason
   */
  private endGame(result: GameResult, reason: GameEndReason): void {
    const now = Date.now();
    
    this.gameState.status = 'finished';
    this.gameState.result = result;
    this.gameState.endReason = reason;
    this.gameState.endedAt = now;
    this.gameState.updatedAt = now;
  }

  /**
   * Resign the game
   */
  public resign(player: PieceColor): void {
    const result: GameResult = player === 'white' ? 'black-wins' : 'white-wins';
    this.endGame(result, 'resignation');
  }

  /**
   * Offer/accept draw
   */
  public offerDraw(): void {
    this.endGame('draw', 'draw-agreement');
  }

  /**
   * Get current player to move
   */
  public getCurrentPlayer(): PieceColor {
    return this.gameState.position.turn;
  }

  /**
   * Get legal moves for a specific square
   */
  public getLegalMovesForSquare(square: Square): Square[] {
    if (this.engine instanceof WraparoundChessEngine) {
      return this.engine.getLegalMoves(square);
    } else {
      const moves = this.engine.moves({ square: square as any, verbose: true });
      return moves.map(move => move.to as Square);
    }
  }

  /**
   * Get current game state
   */
  public getGameState(): GameState {
    return { ...this.gameState };
  }

  /**
   * Get current FEN string
   */
  public getFEN(): string {
    return this.engine.fen();
  }

  /**
   * Check if game is over
   */
  public isGameOver(): boolean {
    return this.gameState.status === 'finished';
  }

  /**
   * Get game analysis
   */
  public getAnalysis(): GameAnalysis {
    return this.analyzePosition();
  }
}

/**
 * Bot move generation utilities
 */
export class BotManager {
  private difficulty: BotDifficulty;
  private gameManager: GameManager;

  constructor(gameManager: GameManager, difficulty: BotDifficulty) {
    this.gameManager = gameManager;
    this.difficulty = difficulty;
  }

  /**
   * Generate bot move based on difficulty
   */
  public async generateMove(): Promise<ChessMove | null> {
    if (this.gameManager.isGameOver()) {
      return null;
    }

    // Add thinking delay based on difficulty
    const thinkingTime = this.getThinkingTime();
    await new Promise(resolve => setTimeout(resolve, thinkingTime));

    const legalMoves = this.getAllLegalMoves();
    console.log('Bot getAllLegalMoves result:', legalMoves, 'length:', legalMoves.length);
    if (legalMoves.length === 0) {
      console.log('No legal moves found for bot');
      return null;
    }

    switch (this.difficulty) {
      case 'easy':
        return this.generateRandomMove(legalMoves);
      case 'medium':
        return this.generateBasicMove(legalMoves);
      case 'hard':
        return this.generateTacticalMove(legalMoves);
      case 'expert':
        return this.generateStrategicMove(legalMoves);
      default:
        return this.generateRandomMove(legalMoves);
    }
  }

  private getThinkingTime(): number {
    switch (this.difficulty) {
      case 'easy': return 500;
      case 'medium': return 1000;
      case 'hard': return 1500;
      case 'expert': return 2000;
      default: return 500;
    }
  }

  private getAllLegalMoves(): { from: Square; to: Square; piece: ChessPiece }[] {
    const moves: { from: Square; to: Square; piece: ChessPiece }[] = [];
    const gameState = this.gameManager.getGameState();
    
    for (const square in gameState.position.board) {
      const piece = gameState.position.board[square as Square];
      if (piece && normalizeColor(piece.color) === gameState.position.turn) {
        const legalMoves = this.gameManager.getLegalMovesForSquare(square as Square);
        for (const to of legalMoves) {
          moves.push({ from: square as Square, to, piece });
        }
      }
    }
    
    return moves;
  }

  private generateRandomMove(legalMoves: { from: Square; to: Square; piece: ChessPiece }[]): ChessMove | null {
    if (legalMoves.length === 0) return null;
    
    const randomMove = legalMoves[Math.floor(Math.random() * legalMoves.length)];
    return {
      from: randomMove.from,
      to: randomMove.to,
      piece: randomMove.piece,
      timestamp: Date.now()
    };
  }

  private generateBasicMove(legalMoves: { from: Square; to: Square; piece: ChessPiece }[]): ChessMove | null {
    // Prefer captures, then random
    const gameState = this.gameManager.getGameState();
    const captures = legalMoves.filter(move => 
      gameState.position.board[move.to] !== null
    );
    
    if (captures.length > 0) {
      const randomCapture = captures[Math.floor(Math.random() * captures.length)];
      return {
        from: randomCapture.from,
        to: randomCapture.to,
        piece: randomCapture.piece,
        captured: gameState.position.board[randomCapture.to] || undefined,
        timestamp: Date.now()
      };
    }
    
    return this.generateRandomMove(legalMoves);
  }

  private generateTacticalMove(legalMoves: { from: Square; to: Square; piece: ChessPiece }[]): ChessMove | null {
    // TODO: Implement basic tactical evaluation
    return this.generateBasicMove(legalMoves);
  }

  private generateStrategicMove(legalMoves: { from: Square; to: Square; piece: ChessPiece }[]): ChessMove | null {
    // TODO: Implement strategic evaluation
    return this.generateTacticalMove(legalMoves);
  }
}

/**
 * Factory function to create a new game
 */
export function createGame(options: GameInitializationOptions): GameManager {
  return new GameManager(options);
}

/**
 * Factory function to create bot player
 */
export function createBotPlayer(name: string, color: PieceColor, difficulty: BotDifficulty): Player {
  const rating = {
    easy: 800,
    medium: 1200,
    hard: 1600,
    expert: 2000
  }[difficulty];

  return {
    id: `bot-${difficulty}-${Date.now()}`,
    name: `${name} (${difficulty})`,
    color,
    isBot: true,
    rating
  };
}

/**
 * Factory function to create human player
 */
export function createHumanPlayer(name: string, color: PieceColor, rating: number = 1200): Player {
  return {
    id: `human-${Date.now()}`,
    name,
    color,
    isBot: false,
    rating
  };
}