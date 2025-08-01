/**
 * Programming Chess Engine
 * Handles secure code execution and chess API for Programming Chess mode
 */

import { WraparoundChessEngine } from './chessEngine';
import {
  ProgrammingChessContext,
  ProgrammingChessMove,
  CodeExecutionResult,
  ProgrammingChessSettings,
  Square,
  ChessPiece,
  PieceColor,
  GameVariant
} from '@/types/game';

export class ProgrammingChessEngine {
  private chessEngine: WraparoundChessEngine;
  private settings: ProgrammingChessSettings;
  private currentPlayerColor: PieceColor;
  private consoleMessages: string[] = [];

  constructor(
    fen?: string,
    variant: GameVariant = 'programming',
    settings: Partial<ProgrammingChessSettings> = {}
  ) {
    const isWraparound = variant === 'programming_unboxed';
    this.chessEngine = new WraparoundChessEngine(fen, isWraparound);
    this.currentPlayerColor = this.chessEngine.turn();
    
    this.settings = {
      executionMode: 'manual',
      timeLimit: 5000, // 5 seconds
      memoryLimit: 50 * 1024 * 1024, // 50MB
      allowedAPIs: [
        'getPiece', 'getLegalMoves', 'isSquareAttacked', 'evaluatePosition',
        'getSquareColor', 'getDistance', 'isOnSameDiagonal', 'isOnSameRankOrFile',
        'getKingPosition', 'log', 'getWraparoundMoves', 'getWraparoundDistance',
        'isWraparoundPath'
      ],
      enableDebugging: true,
      showExecutionLogs: true,
      ...settings
    };
  }

  /**
   * Get current programming chess context for user code
   */
  getProgrammingChessContext(): ProgrammingChessContext {
    const position = this.chessEngine.getPosition();
    const pieces = this.getAllPieceSquares(position);
    
    return {
      board: position,
      pieces,
      gameState: {
        turn: this.chessEngine.turn(),
        moveNumber: Math.floor(this.chessEngine.getChessJS().history().length / 2) + 1,
        isCheck: this.chessEngine.inCheck(),
        isCheckmate: this.chessEngine.isCheckmate(),
        castlingRights: {
          whiteKingside: true, // TODO: Get from chess engine
          whiteQueenside: true,
          blackKingside: true,
          blackQueenside: true,
        },
        enPassantTarget: undefined // TODO: Get from chess engine
      },
      history: [] // TODO: Get move history
    };
  }

  /**
   * Get all piece squares organized by color
   */
  private getAllPieceSquares(position: Record<Square, ChessPiece | null>): {
    white: Square[];
    black: Square[];
  } {
    const pieces = { white: [] as Square[], black: [] as Square[] };
    
    for (const [square, piece] of Object.entries(position)) {
      if (piece) {
        pieces[piece.color].push(square as Square);
      }
    }
    
    return pieces;
  }

  /**
   * Execute user code safely and return the result
   */
  async executeUserCode(code: string): Promise<CodeExecutionResult> {
    const startTime = Date.now();
    this.consoleMessages = [];
    
    try {
      // Validate code syntax
      this.validateCodeSyntax(code);
      
      // Create secure execution context
      const context = this.getProgrammingChessContext();
      const move = await this.runCodeInSandbox(code, context);
      
      if (!move) {
        throw new Error('Function must return a valid move object');
      }

      // Validate the returned move
      const validatedMove = this.validateMove(move);
      
      const executionTime = Date.now() - startTime;
      
      return {
        success: true,
        move: validatedMove,
        executionTime,
        logs: this.consoleMessages
      };
      
    } catch (error) {
      const executionTime = Date.now() - startTime;
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        executionTime,
        logs: this.consoleMessages
      };
    }
  }

  /**
   * Validate code syntax before execution
   */
  private validateCodeSyntax(code: string): void {
    // Check for dangerous patterns
    const dangerousPatterns = [
      /eval\s*\(/,
      /Function\s*\(/,
      /new\s+Function/,
      /document\./,
      /window\./,
      /global\./,
      /process\./,
      /require\s*\(/,
      /import\s+/,
      /export\s+/,
      /__proto__/,
      /constructor\s*\./,
      /prototype\s*\./
    ];

    for (const pattern of dangerousPatterns) {
      if (pattern.test(code)) {
        throw new Error(`Forbidden pattern detected: ${pattern.source}`);
      }
    }

    // Ensure makeMove function exists
    if (!code.includes('function makeMove')) {
      throw new Error('Code must contain a makeMove function');
    }

    // Basic syntax check using Function constructor (but not executing)
    try {
      new Function('context', code + '\nreturn makeMove;');
    } catch (error) {
      throw new Error(`Syntax error: ${error instanceof Error ? error.message : 'Invalid syntax'}`);
    }
  }

  /**
   * Run user code in a secure sandbox
   */
  private async runCodeInSandbox(code: string, context: ProgrammingChessContext): Promise<ProgrammingChessMove | null> {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`Code execution timeout (${this.settings.timeLimit}ms)`));
      }, this.settings.timeLimit);

      try {
        // Create sandbox with chess API
        const sandbox = this.createChessAPISandbox(context);
        
        // Create function with user code
        const userFunction = new Function(
          'context',
          `
          ${this.createAPIDefinitions(sandbox)}
          
          ${code}
          
          return makeMove(context);
          `
        );

        // Execute with timeout protection
        const result = userFunction(context);
        
        clearTimeout(timeoutId);
        resolve(result);
        
      } catch (error) {
        clearTimeout(timeoutId);
        reject(error);
      }
    });
  }

  /**
   * Create chess API sandbox for user code
   */
  private createChessAPISandbox(context: ProgrammingChessContext) {
    const sandbox = {
      // Basic piece information
      getPiece: (square: string): ChessPiece | null => {
        return context.board[square as Square] || null;
      },

      // Legal moves
      getLegalMoves: (square: string): string[] => {
        return this.chessEngine.getLegalMoves(square as Square);
      },

      // Square attack detection
      isSquareAttacked: (square: string, byColor: PieceColor): boolean => {
        // TODO: Implement attack detection
        return false;
      },

      // Position evaluation (simplified)
      evaluatePosition: (): number => {
        // Basic material evaluation
        let score = 0;
        const pieceValues = { pawn: 1, knight: 3, bishop: 3, rook: 5, queen: 9, king: 0 };
        
        for (const [square, piece] of Object.entries(context.board)) {
          if (piece) {
            const value = pieceValues[piece.type];
            score += piece.color === 'white' ? value : -value;
          }
        }
        
        return score;
      },

      // Utility functions
      getSquareColor: (square: string): 'light' | 'dark' => {
        const file = square.charCodeAt(0) - 97; // a=0, b=1, etc.
        const rank = parseInt(square[1]) - 1; // 1=0, 2=1, etc.
        return (file + rank) % 2 === 0 ? 'dark' : 'light';
      },

      getDistance: (from: string, to: string): number => {
        const fromFile = from.charCodeAt(0) - 97;
        const fromRank = parseInt(from[1]) - 1;
        const toFile = to.charCodeAt(0) - 97;
        const toRank = parseInt(to[1]) - 1;
        
        return Math.max(Math.abs(toFile - fromFile), Math.abs(toRank - fromRank));
      },

      isOnSameDiagonal: (square1: string, square2: string): boolean => {
        const file1 = square1.charCodeAt(0) - 97;
        const rank1 = parseInt(square1[1]) - 1;
        const file2 = square2.charCodeAt(0) - 97;
        const rank2 = parseInt(square2[1]) - 1;
        
        return Math.abs(file1 - file2) === Math.abs(rank1 - rank2);
      },

      isOnSameRankOrFile: (square1: string, square2: string): boolean => {
        return square1[0] === square2[0] || square1[1] === square2[1];
      },

      getKingPosition: (color: PieceColor): string | null => {
        for (const [square, piece] of Object.entries(context.board)) {
          if (piece && piece.type === 'king' && piece.color === color) {
            return square;
          }
        }
        return null;
      },

      // Console logging
      log: (...args: any[]): void => {
        const message = args.map(arg => 
          typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
        ).join(' ');
        this.consoleMessages.push(message);
      },

      // Wraparound functions (only available in unboxed mode)
      getWraparoundMoves: (square: string): string[] => {
        if (this.chessEngine.getWraparoundMode()) {
          return this.chessEngine.getLegalMoves(square as Square);
        }
        return [];
      },

      getWraparoundDistance: (from: string, to: string): number => {
        if (!this.chessEngine.getWraparoundMode()) return 0;
        
        const fromFile = from.charCodeAt(0) - 97;
        const fromRank = parseInt(from[1]) - 1;
        const toFile = to.charCodeAt(0) - 97;
        const toRank = parseInt(to[1]) - 1;
        
        const fileDiff = Math.abs(toFile - fromFile);
        const rankDiff = Math.abs(toRank - fromRank);
        const wraparoundFileDiff = 8 - fileDiff;
        const wraparoundRankDiff = 8 - rankDiff;
        
        return Math.max(
          Math.min(fileDiff, wraparoundFileDiff),
          Math.min(rankDiff, wraparoundRankDiff)
        );
      },

      isWraparoundPath: (from: string, to: string): boolean => {
        if (!this.chessEngine.getWraparoundMode()) return false;
        
        const fromFile = from.charCodeAt(0) - 97;
        const fromRank = parseInt(from[1]) - 1;
        const toFile = to.charCodeAt(0) - 97;
        const toRank = parseInt(to[1]) - 1;
        
        const fileDiff = Math.abs(toFile - fromFile);
        const rankDiff = Math.abs(toRank - fromRank);
        
        // Check if wraparound path is shorter
        return fileDiff > 4 || rankDiff > 4;
      }
    };

    return sandbox;
  }

  /**
   * Create API definitions string for user code
   */
  private createAPIDefinitions(sandbox: any): string {
    const definitions = Object.keys(sandbox)
      .filter(key => this.settings.allowedAPIs.includes(key))
      .map(key => `const ${key} = arguments[1].${key};`)
      .join('\n');
    
    return definitions;
  }

  /**
   * Validate move returned by user code
   */
  private validateMove(move: any): ProgrammingChessMove {
    if (!move || typeof move !== 'object') {
      throw new Error('Move must be an object');
    }

    if (!move.from || !move.to || !move.piece) {
      throw new Error('Move must have from, to, and piece properties');
    }

    if (typeof move.from !== 'string' || typeof move.to !== 'string') {
      throw new Error('from and to must be strings (e.g., "e2", "e4")');
    }

    if (!/^[a-h][1-8]$/.test(move.from) || !/^[a-h][1-8]$/.test(move.to)) {
      throw new Error('Invalid square notation (must be like "e2", "e4")');
    }

    const validPieces = ['pawn', 'rook', 'knight', 'bishop', 'queen', 'king'];
    if (!validPieces.includes(move.piece)) {
      throw new Error(`Invalid piece type: ${move.piece}`);
    }

    // Verify the move is legal
    const legalMoves = this.chessEngine.getLegalMoves(move.from as Square);
    if (!legalMoves.includes(move.to as Square)) {
      throw new Error(`Illegal move: ${move.from} to ${move.to}`);
    }

    // Verify piece type matches
    const piece = this.chessEngine.getPiece(move.from as Square);
    if (!piece || piece.type !== move.piece) {
      throw new Error(`Piece type mismatch: expected ${piece?.type}, got ${move.piece}`);
    }

    // Verify it's the player's turn
    if (piece.color !== this.currentPlayerColor) {
      throw new Error(`Not your turn: it's ${this.currentPlayerColor}'s turn`);
    }

    return {
      from: move.from as Square,
      to: move.to as Square,
      piece: move.piece,
      promotion: move.promotion
    };
  }

  /**
   * Execute a programming chess move
   */
  executeMove(move: ProgrammingChessMove): boolean {
    const result = this.chessEngine.makeMove(move.from, move.to, move.promotion);
    if (result) {
      this.currentPlayerColor = this.chessEngine.turn();
      return true;
    }
    return false;
  }

  /**
   * Get current chess engine state
   */
  getChessEngine(): WraparoundChessEngine {
    return this.chessEngine;
  }

  /**
   * Update settings
   */
  updateSettings(newSettings: Partial<ProgrammingChessSettings>): void {
    this.settings = { ...this.settings, ...newSettings };
  }

  /**
   * Get current settings
   */
  getSettings(): ProgrammingChessSettings {
    return { ...this.settings };
  }

  /**
   * Reset the game
   */
  reset(): void {
    this.chessEngine.reset();
    this.currentPlayerColor = this.chessEngine.turn();
    this.consoleMessages = [];
  }
}

/**
 * Default code templates for different skill levels
 */
export const CODE_TEMPLATES = {
  beginner: {
    classic: `function makeMove(context) {
  // Beginner template: Make any legal move
  const { board, pieces, gameState } = context;
  const myColor = gameState.turn;
  const myPieces = pieces[myColor];
  
  // Try each piece and find a legal move
  for (const square of myPieces) {
    const piece = getPiece(square);
    if (piece) {
      const moves = getLegalMoves(square);
      if (moves.length > 0) {
        // Take the first available move
        return {
          from: square,
          to: moves[0],
          piece: piece.type
        };
      }
    }
  }
  
  return null;
}`,
    unboxed: `function makeMove(context) {
  // Beginner Unboxed: Try wraparound moves first
  const { board, pieces, gameState } = context;
  const myColor = gameState.turn;
  const myPieces = pieces[myColor];
  
  // Look for wraparound opportunities first
  for (const square of myPieces) {
    const piece = getPiece(square);
    if (piece) {
      const wraparoundMoves = getWraparoundMoves(square);
      if (wraparoundMoves.length > 0) {
        log('Found wraparound move!');
        return {
          from: square,
          to: wraparoundMoves[0],
          piece: piece.type
        };
      }
    }
  }
  
  // Fallback to regular moves
  for (const square of myPieces) {
    const piece = getPiece(square);
    if (piece) {
      const moves = getLegalMoves(square);
      if (moves.length > 0) {
        return {
          from: square,
          to: moves[0],
          piece: piece.type
        };
      }
    }
  }
  
  return null;
}`
  },
  
  intermediate: {
    classic: `function makeMove(context) {
  // Intermediate template: Basic tactics
  const { board, pieces, gameState } = context;
  const myColor = gameState.turn;
  const myPieces = pieces[myColor];
  const opponentColor = myColor === 'white' ? 'black' : 'white';
  
  // 1. Look for captures
  for (const square of myPieces) {
    const piece = getPiece(square);
    if (piece) {
      const moves = getLegalMoves(square);
      for (const moveSquare of moves) {
        const target = getPiece(moveSquare);
        if (target && target.color === opponentColor) {
          log('Found capture: ' + square + ' takes ' + moveSquare);
          return {
            from: square,
            to: moveSquare,
            piece: piece.type
          };
        }
      }
    }
  }
  
  // 2. Develop pieces toward center
  const centerSquares = ['d4', 'd5', 'e4', 'e5'];
  for (const square of myPieces) {
    const piece = getPiece(square);
    if (piece && (piece.type === 'knight' || piece.type === 'bishop')) {
      const moves = getLegalMoves(square);
      for (const moveSquare of moves) {
        if (centerSquares.includes(moveSquare)) {
          return {
            from: square,
            to: moveSquare,
            piece: piece.type
          };
        }
      }
    }
  }
  
  // 3. Make any legal move
  for (const square of myPieces) {
    const piece = getPiece(square);
    if (piece) {
      const moves = getLegalMoves(square);
      if (moves.length > 0) {
        return {
          from: square,
          to: moves[0],
          piece: piece.type
        };
      }
    }
  }
  
  return null;
}`,
    unboxed: `function makeMove(context) {
  // Intermediate Unboxed: Tactical wraparound play
  const { board, pieces, gameState } = context;
  const myColor = gameState.turn;
  const myPieces = pieces[myColor];
  const opponentColor = myColor === 'white' ? 'black' : 'white';
  
  // 1. Look for wraparound attacks
  for (const square of myPieces) {
    const piece = getPiece(square);
    if (piece) {
      const wraparoundMoves = getWraparoundMoves(square);
      for (const moveSquare of wraparoundMoves) {
        const target = getPiece(moveSquare);
        if (target && target.color === opponentColor) {
          log('Wraparound capture: ' + square + ' to ' + moveSquare);
          return {
            from: square,
            to: moveSquare,
            piece: piece.type
          };
        }
      }
    }
  }
  
  // 2. Look for regular captures
  for (const square of myPieces) {
    const piece = getPiece(square);
    if (piece) {
      const moves = getLegalMoves(square);
      for (const moveSquare of moves) {
        const target = getPiece(moveSquare);
        if (target && target.color === opponentColor) {
          return {
            from: square,
            to: moveSquare,
            piece: piece.type
          };
        }
      }
    }
  }
  
  // 3. Use wraparound for positioning
  for (const square of myPieces) {
    const piece = getPiece(square);
    if (piece && piece.type === 'rook') {
      const wraparoundMoves = getWraparoundMoves(square);
      if (wraparoundMoves.length > 0) {
        log('Strategic wraparound move');
        return {
          from: square,
          to: wraparoundMoves[0],
          piece: piece.type
        };
      }
    }
  }
  
  // 4. Make any legal move
  for (const square of myPieces) {
    const piece = getPiece(square);
    if (piece) {
      const moves = getLegalMoves(square);
      if (moves.length > 0) {
        return {
          from: square,
          to: moves[0],
          piece: piece.type
        };
      }
    }
  }
  
  return null;
}`
  }
};