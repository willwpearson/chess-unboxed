/**
 * Custom Chess Engine with Wraparound Support
 * Extends chess.js functionality to support Chess Unboxed toroidal topology
 */

import { Chess, Square as ChessJSSquare } from 'chess.js';
import { PieceType, PieceColor, Square, ChessPiece, ChessMove } from '@/types/game';

// Coordinate system types for internal calculations
interface Position {
  file: number; // 0-7 (a-h)
  rank: number; // 0-7 (1-8)
}

interface WraparoundMove {
  from: Square;
  to: Square;
  piece: ChessPiece;
  captured?: ChessPiece;
  promotion?: PieceType;
  castling?: 'kingside' | 'queenside';
  enPassant?: boolean;
  isWraparound: boolean;
  wraparoundType?: 'horizontal' | 'vertical' | 'diagonal' | 'knight';
}

/**
 * Custom Chess Engine that supports both standard and wraparound chess
 */
export class WraparoundChessEngine {
  private chess: Chess;
  private isWraparoundMode: boolean;
  private position: Record<Square, ChessPiece | null>;

  constructor(fen?: string, wraparoundMode: boolean = false) {
    this.chess = new Chess(fen);
    this.isWraparoundMode = wraparoundMode;
    this.position = this.convertChessJSBoardToPosition();
  }

  /**
   * Enable or disable wraparound mode
   */
  setWraparoundMode(enabled: boolean): void {
    this.isWraparoundMode = enabled;
  }

  /**
   * Get current wraparound mode state
   */
  getWraparoundMode(): boolean {
    return this.isWraparoundMode;
  }

  /**
   * Convert algebraic notation to position coordinates
   */
  private algebraicToPosition(square: Square): Position {
    const file = square.charCodeAt(0) - 97; // 'a' = 0, 'b' = 1, etc.
    const rank = parseInt(square[1]) - 1; // '1' = 0, '2' = 1, etc.
    return { file, rank };
  }

  /**
   * Convert position coordinates to algebraic notation
   */
  private positionToAlgebraic(pos: Position): Square {
    const file = String.fromCharCode(97 + pos.file); // 0 = 'a', 1 = 'b', etc.
    const rank = (pos.rank + 1).toString(); // 0 = '1', 1 = '2', etc.
    return `${file}${rank}` as Square;
  }

  /**
   * Apply wraparound logic to position coordinates
   */
  private applyWraparound(pos: Position): Position {
    return {
      file: (pos.file + 8) % 8,
      rank: (pos.rank + 8) % 8
    };
  }

  /**
   * Check if a position is valid on the board
   */
  private isValidPosition(pos: Position): boolean {
    return pos.file >= 0 && pos.file < 8 && pos.rank >= 0 && pos.rank < 8;
  }

  /**
   * Convert chess.js board to our position format
   */
  private convertChessJSBoardToPosition(): Record<Square, ChessPiece | null> {
    const pos: Record<Square, ChessPiece | null> = {};
    const board = this.chess.board();
    
    for (let rank = 0; rank < 8; rank++) {
      for (let file = 0; file < 8; file++) {
        const square = this.positionToAlgebraic({ file, rank: 7 - rank });
        const piece = board[rank][file];
        
        if (piece) {
          pos[square] = {
            type: piece.type as PieceType,
            color: piece.color as PieceColor
          };
        } else {
          pos[square] = null;
        }
      }
    }
    
    return pos;
  }

  /**
   * Get piece at a specific square
   */
  getPiece(square: Square): ChessPiece | null {
    return this.position[square] || null;
  }

  /**
   * Get all legal moves for a piece at a given square
   */
  getLegalMoves(square: Square): Square[] {
    if (this.isWraparoundMode) {
      return this.getWraparoundMoves(square);
    } else {
      // Use chess.js for standard moves
      const moves = this.chess.moves({ square: square as ChessJSSquare, verbose: true });
      return moves.map(move => move.to as Square);
    }
  }

  /**
   * Get wraparound moves for a piece at a given square
   */
  private getWraparoundMoves(square: Square): Square[] {
    const piece = this.getPiece(square);
    if (!piece) return [];

    const position = this.algebraicToPosition(square);
    let moves: Square[] = [];

    switch (piece.type) {
      case 'rook':
        moves = this.getRookWraparoundMoves(position);
        break;
      case 'bishop':
        moves = this.getBishopWraparoundMoves(position);
        break;
      case 'queen':
        moves = [
          ...this.getRookWraparoundMoves(position),
          ...this.getBishopWraparoundMoves(position)
        ];
        break;
      case 'knight':
        moves = this.getKnightWraparoundMoves(position);
        break;
      case 'king':
        moves = this.getKingWraparoundMoves(position);
        break;
      case 'pawn':
        moves = this.getPawnWraparoundMoves(position, piece.color);
        break;
    }

    // Filter out moves that would result in self-check
    return this.filterSelfCheckMoves(square, moves);
  }

  /**
   * Get rook wraparound moves (horizontal and vertical with edge wrapping)
   */
  private getRookWraparoundMoves(pos: Position): Square[] {
    const moves: Square[] = [];

    // Horizontal moves (left-right with wraparound)
    for (let file = 0; file < 8; file++) {
      if (file !== pos.file) {
        const targetPos = { file, rank: pos.rank };
        const targetSquare = this.positionToAlgebraic(targetPos);
        const targetPiece = this.getPiece(targetSquare);
        
        // Check if path is clear (considering wraparound)
        if (this.isRookPathClear(pos, targetPos)) {
          // Can move to empty square or capture opponent's piece
          if (!targetPiece || targetPiece.color !== this.getPiece(this.positionToAlgebraic(pos))?.color) {
            moves.push(targetSquare);
          }
        }
      }
    }

    // Vertical moves (up-down with wraparound)
    for (let rank = 0; rank < 8; rank++) {
      if (rank !== pos.rank) {
        const targetPos = { file: pos.file, rank };
        const targetSquare = this.positionToAlgebraic(targetPos);
        const targetPiece = this.getPiece(targetSquare);
        
        // Check if path is clear (considering wraparound)
        if (this.isRookPathClear(pos, targetPos)) {
          // Can move to empty square or capture opponent's piece
          if (!targetPiece || targetPiece.color !== this.getPiece(this.positionToAlgebraic(pos))?.color) {
            moves.push(targetSquare);
          }
        }
      }
    }

    return moves;
  }

  /**
   * Check if rook path is clear considering wraparound
   */
  private isRookPathClear(from: Position, to: Position): boolean {
    if (from.file === to.file) {
      // Vertical movement
      const rankDiff = to.rank - from.rank;
      const distance = Math.abs(rankDiff);
      const wraparoundDistance = 8 - distance;
      
      // Check both direct and wraparound paths, use the shorter one
      if (distance <= wraparoundDistance) {
        // Direct path
        const step = rankDiff > 0 ? 1 : -1;
        for (let i = 1; i < distance; i++) {
          const checkRank = from.rank + (i * step);
          const checkSquare = this.positionToAlgebraic({ file: from.file, rank: checkRank });
          if (this.getPiece(checkSquare)) return false;
        }
      } else {
        // Wraparound path
        const step = rankDiff > 0 ? -1 : 1;
        for (let i = 1; i < wraparoundDistance; i++) {
          const checkRank = (from.rank + (i * step) + 8) % 8;
          const checkSquare = this.positionToAlgebraic({ file: from.file, rank: checkRank });
          if (this.getPiece(checkSquare)) return false;
        }
      }
    } else if (from.rank === to.rank) {
      // Horizontal movement
      const fileDiff = to.file - from.file;
      const distance = Math.abs(fileDiff);
      const wraparoundDistance = 8 - distance;
      
      // Check both direct and wraparound paths, use the shorter one
      if (distance <= wraparoundDistance) {
        // Direct path
        const step = fileDiff > 0 ? 1 : -1;
        for (let i = 1; i < distance; i++) {
          const checkFile = from.file + (i * step);
          const checkSquare = this.positionToAlgebraic({ file: checkFile, rank: from.rank });
          if (this.getPiece(checkSquare)) return false;
        }
      } else {
        // Wraparound path
        const step = fileDiff > 0 ? -1 : 1;
        for (let i = 1; i < wraparoundDistance; i++) {
          const checkFile = (from.file + (i * step) + 8) % 8;
          const checkSquare = this.positionToAlgebraic({ file: checkFile, rank: from.rank });
          if (this.getPiece(checkSquare)) return false;
        }
      }
    }
    
    return true;
  }

  /**
   * Get bishop wraparound moves (diagonal with edge wrapping)
   */
  private getBishopWraparoundMoves(pos: Position): Square[] {
    const moves: Square[] = [];
    
    // Four diagonal directions
    const directions = [
      { file: 1, rank: 1 },   // up-right
      { file: 1, rank: -1 },  // down-right
      { file: -1, rank: 1 },  // up-left
      { file: -1, rank: -1 }  // down-left
    ];

    for (const dir of directions) {
      for (let i = 1; i < 8; i++) {
        const targetFile = (pos.file + (i * dir.file) + 8) % 8;
        const targetRank = (pos.rank + (i * dir.rank) + 8) % 8;
        const targetPos = { file: targetFile, rank: targetRank };
        const targetSquare = this.positionToAlgebraic(targetPos);
        const targetPiece = this.getPiece(targetSquare);

        if (targetPiece) {
          // If it's an opponent's piece, we can capture it
          if (targetPiece.color !== this.getPiece(this.positionToAlgebraic(pos))?.color) {
            moves.push(targetSquare);
          }
          // Can't move further in this direction
          break;
        } else {
          // Empty square, can move here
          moves.push(targetSquare);
        }
      }
    }

    return moves;
  }

  /**
   * Get knight wraparound moves (L-shaped moves across edges)
   */
  private getKnightWraparoundMoves(pos: Position): Square[] {
    const moves: Square[] = [];
    
    // Knight move offsets
    const knightMoves = [
      { file: 2, rank: 1 },
      { file: 2, rank: -1 },
      { file: -2, rank: 1 },
      { file: -2, rank: -1 },
      { file: 1, rank: 2 },
      { file: 1, rank: -2 },
      { file: -1, rank: 2 },
      { file: -1, rank: -2 }
    ];

    for (const move of knightMoves) {
      const targetFile = (pos.file + move.file + 8) % 8;
      const targetRank = (pos.rank + move.rank + 8) % 8;
      const targetPos = { file: targetFile, rank: targetRank };
      const targetSquare = this.positionToAlgebraic(targetPos);
      const targetPiece = this.getPiece(targetSquare);

      // Can move to empty square or capture opponent's piece
      if (!targetPiece || targetPiece.color !== this.getPiece(this.positionToAlgebraic(pos))?.color) {
        moves.push(targetSquare);
      }
    }

    return moves;
  }

  /**
   * Get king wraparound moves (single-square moves across edges)
   */
  private getKingWraparoundMoves(pos: Position): Square[] {
    const moves: Square[] = [];
    
    // King move offsets (all 8 directions)
    const kingMoves = [
      { file: 1, rank: 0 },   // right
      { file: -1, rank: 0 },  // left
      { file: 0, rank: 1 },   // up
      { file: 0, rank: -1 },  // down
      { file: 1, rank: 1 },   // up-right
      { file: 1, rank: -1 },  // down-right
      { file: -1, rank: 1 },  // up-left
      { file: -1, rank: -1 }  // down-left
    ];

    for (const move of kingMoves) {
      const targetFile = (pos.file + move.file + 8) % 8;
      const targetRank = (pos.rank + move.rank + 8) % 8;
      const targetPos = { file: targetFile, rank: targetRank };
      const targetSquare = this.positionToAlgebraic(targetPos);
      const targetPiece = this.getPiece(targetSquare);

      // Can move to empty square or capture opponent's piece
      if (!targetPiece || targetPiece.color !== this.getPiece(this.positionToAlgebraic(pos))?.color) {
        moves.push(targetSquare);
      }
    }

    return moves;
  }

  /**
   * Get pawn wraparound moves (forward moves and captures with edge wrapping)
   */
  private getPawnWraparoundMoves(pos: Position, color: PieceColor): Square[] {
    const moves: Square[] = [];
    const direction = color === 'white' ? 1 : -1;
    const startingRank = color === 'white' ? 1 : 6;

    // Forward move (with wraparound)
    const forwardRank = (pos.rank + direction + 8) % 8;
    const forwardSquare = this.positionToAlgebraic({ file: pos.file, rank: forwardRank });
    
    if (!this.getPiece(forwardSquare)) {
      moves.push(forwardSquare);
      
      // Double move from starting position (with wraparound)
      if (pos.rank === startingRank) {
        const doubleForwardRank = (forwardRank + direction + 8) % 8;
        const doubleForwardSquare = this.positionToAlgebraic({ file: pos.file, rank: doubleForwardRank });
        
        if (!this.getPiece(doubleForwardSquare)) {
          moves.push(doubleForwardSquare);
        }
      }
    }

    // Diagonal captures (with wraparound)
    const captureFiles = [
      (pos.file - 1 + 8) % 8,
      (pos.file + 1) % 8
    ];

    for (const captureFile of captureFiles) {
      const captureRank = (pos.rank + direction + 8) % 8;
      const captureSquare = this.positionToAlgebraic({ file: captureFile, rank: captureRank });
      const captureTarget = this.getPiece(captureSquare);

      if (captureTarget && captureTarget.color !== color) {
        moves.push(captureSquare);
      }
    }

    // TODO: En passant with wraparound (complex case)

    return moves;
  }

  /**
   * Filter out moves that would result in self-check
   */
  private filterSelfCheckMoves(fromSquare: Square, moves: Square[]): Square[] {
    if (!this.isWraparoundMode) {
      return moves; // Let chess.js handle this for standard mode
    }

    const validMoves: Square[] = [];
    const originalPiece = this.getPiece(fromSquare);
    
    if (!originalPiece) return [];

    for (const move of moves) {
      // Make temporary move
      const capturedPiece = this.getPiece(move);
      this.position[fromSquare] = null;
      this.position[move] = originalPiece;

      // Check if this move leaves king in check
      if (!this.isKingInCheckWraparound(originalPiece.color)) {
        validMoves.push(move);
      }

      // Undo temporary move
      this.position[fromSquare] = originalPiece;
      this.position[move] = capturedPiece;
    }

    return validMoves;
  }

  /**
   * Validate if a move is legal in wraparound mode
   */
  isValidWraparoundMove(from: Square, to: Square): boolean {
    const legalMoves = this.getLegalMoves(from);
    return legalMoves.includes(to);
  }

  /**
   * Make a move (handles both standard and wraparound modes)
   */
  makeMove(from: Square, to: Square, promotion?: PieceType): ChessMove | null {
    try {
      if (this.isWraparoundMode) {
        return this.makeWraparoundMove(from, to, promotion);
      } else {
        // Use chess.js for standard moves
        const moveResult = this.chess.move({
          from: from as ChessJSSquare,
          to: to as ChessJSSquare,
          promotion: promotion
        });

        if (moveResult) {
          this.position = this.convertChessJSBoardToPosition();
          
          const piece = this.getPiece(to);
          
          // Check for game state after move
          const isCheck = this.chess.inCheck();
          const isCheckmate = this.chess.isCheckmate();
          const isStalemate = this.chess.isStalemate();
          
          return {
            from,
            to,
            piece: piece!,
            captured: moveResult.captured ? { 
              type: moveResult.captured as PieceType, 
              color: moveResult.color === 'w' ? 'black' : 'white'
            } : undefined,
            promotion: moveResult.promotion as PieceType | undefined,
            castling: moveResult.flags.includes('k') ? 'kingside' : 
                     moveResult.flags.includes('q') ? 'queenside' : undefined,
            enPassant: moveResult.flags.includes('e'),
            isCheck,
            isCheckmate,
            isStalemate,
            san: moveResult.san,
            timestamp: Date.now()
          };
        }
      }
    } catch (error) {
      console.warn('Invalid move attempted:', error);
    }
    
    return null;
  }

  /**
   * Make a wraparound move
   */
  private makeWraparoundMove(from: Square, to: Square, promotion?: PieceType): ChessMove | null {
    if (!this.isValidWraparoundMove(from, to)) {
      return null;
    }

    const movingPiece = this.getPiece(from);
    const capturedPiece = this.getPiece(to);

    if (!movingPiece) return null;

    // Update position
    this.position[from] = null;
    this.position[to] = promotion ? 
      { ...movingPiece, type: promotion } : 
      movingPiece;

    // Check for game state after move
    const opponentColor = movingPiece.color === 'white' ? 'black' : 'white';
    const isCheck = this.isKingInCheckWraparound(opponentColor);
    const isCheckmate = isCheck && !this.hasLegalMovesWraparound(opponentColor);
    const isStalemate = !isCheck && !this.hasLegalMovesWraparound(opponentColor);

    // Detect wraparound characteristics
    const wraparoundInfo = this.detectWraparoundCharacteristics(from, to, movingPiece);

    return {
      from,
      to,
      piece: movingPiece,
      captured: capturedPiece || undefined,
      promotion,
      enPassant: false, // TODO: Implement en passant for wraparound
      castling: undefined, // TODO: Implement castling for wraparound
      isCheck,
      isCheckmate,
      isStalemate,
      isWraparound: true,
      wraparoundType: wraparoundInfo.type,
      wraparoundDistance: wraparoundInfo.distance,
      wraparoundPath: wraparoundInfo.path,
      timestamp: Date.now()
    };
  }

  /**
   * Detect wraparound characteristics of a move
   */
  private detectWraparoundCharacteristics(from: Square, to: Square, piece: ChessPiece): {
    type: 'horizontal' | 'vertical' | 'diagonal' | 'knight';
    distance: number;
    path: Square[];
  } {
    const fromPos = this.algebraicToPosition(from);
    const toPos = this.algebraicToPosition(to);
    
    const fileDiff = Math.abs(toPos.file - fromPos.file);
    const rankDiff = Math.abs(toPos.rank - fromPos.rank);
    
    let type: 'horizontal' | 'vertical' | 'diagonal' | 'knight' = 'horizontal';
    
    if (piece.type === 'knight') {
      type = 'knight';
    } else if (fileDiff > 0 && rankDiff > 0) {
      type = 'diagonal';
    } else if (rankDiff > 0) {
      type = 'vertical';
    } else {
      type = 'horizontal';
    }
    
    // Calculate shortest distance considering wraparound
    const directDistance = Math.max(fileDiff, rankDiff);
    const wraparoundFileDistance = 8 - fileDiff;
    const wraparoundRankDistance = 8 - rankDiff;
    const wraparoundDistance = Math.max(wraparoundFileDistance, wraparoundRankDistance);
    
    const distance = Math.min(directDistance, wraparoundDistance);
    
    // Generate path (simplified for now)
    const path: Square[] = [from, to];
    
    return { type, distance, path };
  }

  /**
   * Get current FEN string
   */
  fen(): string {
    if (this.isWraparoundMode) {
      // TODO: Generate FEN for wraparound position
      return this.chess.fen(); // Fallback for now
    }
    return this.chess.fen();
  }

  /**
   * Get current turn
   */
  turn(): PieceColor {
    return this.chess.turn() === 'w' ? 'white' : 'black';
  }

  /**
   * Check if a king is in check in wraparound mode
   */
  private isKingInCheckWraparound(kingColor: PieceColor): boolean {
    // Find the king
    const kingSquare = this.findKing(kingColor);
    if (!kingSquare) return false;

    const kingPos = this.algebraicToPosition(kingSquare);
    
    // Check if any opponent piece can attack the king
    for (const square in this.position) {
      const piece = this.position[square as Square];
      if (piece && piece.color !== kingColor) {
        const piecePos = this.algebraicToPosition(square as Square);
        if (this.canPieceAttackSquareWraparound(piece, piecePos, kingPos)) {
          return true;
        }
      }
    }
    
    return false;
  }

  /**
   * Find the king of a given color
   */
  private findKing(color: PieceColor): Square | null {
    for (const square in this.position) {
      const piece = this.position[square as Square];
      if (piece && piece.type === 'king' && piece.color === color) {
        return square as Square;
      }
    }
    return null;
  }

  /**
   * Check if a piece can attack a specific square in wraparound mode
   */
  private canPieceAttackSquareWraparound(piece: ChessPiece, piecePos: Position, targetPos: Position): boolean {
    const targetSquare = this.positionToAlgebraic(targetPos);
    
    // Get all possible moves for this piece type from its position
    let possibleMoves: Square[] = [];
    
    switch (piece.type) {
      case 'rook':
        possibleMoves = this.getRookWraparoundMoves(piecePos);
        break;
      case 'bishop':
        possibleMoves = this.getBishopWraparoundMoves(piecePos);
        break;
      case 'queen':
        possibleMoves = [
          ...this.getRookWraparoundMoves(piecePos),
          ...this.getBishopWraparoundMoves(piecePos)
        ];
        break;
      case 'knight':
        possibleMoves = this.getKnightWraparoundMoves(piecePos);
        break;
      case 'king':
        possibleMoves = this.getKingWraparoundMoves(piecePos);
        break;
      case 'pawn':
        // For attack detection, only consider pawn captures
        possibleMoves = this.getPawnCaptureSquares(piecePos, piece.color);
        break;
    }
    
    return possibleMoves.includes(targetSquare);
  }

  /**
   * Get squares that a pawn can capture (for attack detection)
   */
  private getPawnCaptureSquares(pos: Position, color: PieceColor): Square[] {
    const moves: Square[] = [];
    const direction = color === 'white' ? 1 : -1;

    // Diagonal captures (with wraparound)
    const captureFiles = [
      (pos.file - 1 + 8) % 8,
      (pos.file + 1) % 8
    ];

    for (const captureFile of captureFiles) {
      const captureRank = (pos.rank + direction + 8) % 8;
      const captureSquare = this.positionToAlgebraic({ file: captureFile, rank: captureRank });
      moves.push(captureSquare);
    }

    return moves;
  }

  /**
   * Check if current position is in check
   */
  inCheck(): boolean {
    if (this.isWraparoundMode) {
      return this.isKingInCheckWraparound(this.turn());
    }
    return this.chess.inCheck();
  }

  /**
   * Check if current position is checkmate
   */
  isCheckmate(): boolean {
    if (this.isWraparoundMode) {
      const currentPlayer = this.turn();
      
      // Must be in check to be checkmate
      if (!this.isKingInCheckWraparound(currentPlayer)) {
        return false;
      }
      
      // Check if there are any legal moves available
      return !this.hasLegalMovesWraparound(currentPlayer);
    }
    return this.chess.isCheckmate();
  }

  /**
   * Check if current position is draw
   */
  isDraw(): boolean {
    if (this.isWraparoundMode) {
      const currentPlayer = this.turn();
      
      // Stalemate: not in check but no legal moves
      if (!this.isKingInCheckWraparound(currentPlayer) && !this.hasLegalMovesWraparound(currentPlayer)) {
        return true;
      }
      
      // TODO: Implement other draw conditions (50-move rule, insufficient material, etc.)
      return false;
    }
    return this.chess.isDraw();
  }

  /**
   * Check if a player has any legal moves in wraparound mode
   */
  private hasLegalMovesWraparound(color: PieceColor): boolean {
    for (const square in this.position) {
      const piece = this.position[square as Square];
      if (piece && piece.color === color) {
        const legalMoves = this.getWraparoundMoves(square as Square);
        if (legalMoves.length > 0) {
          return true;
        }
      }
    }
    return false;
  }

  /**
   * Get game status
   */
  isGameOver(): boolean {
    return this.isCheckmate() || this.isDraw();
  }

  /**
   * Reset to initial position
   */
  reset(): void {
    this.chess.reset();
    this.position = this.convertChessJSBoardToPosition();
  }

  /**
   * Load position from FEN
   */
  load(fen: string): boolean {
    try {
      this.chess.load(fen);
      this.position = this.convertChessJSBoardToPosition();
      return true;
    } catch (error) {
      console.warn('Invalid FEN:', error);
      return false;
    }
  }

  /**
   * Get current board position
   */
  getPosition(): Record<Square, ChessPiece | null> {
    return { ...this.position };
  }

  /**
   * Get chess.js instance (for standard mode compatibility)
   */
  getChessJS(): Chess {
    return this.chess;
  }
}