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
   * Only horizontal (left-right) wraparound for unboxed mode
   */
  private applyWraparound(pos: Position): Position {
    return {
      file: (pos.file + 8) % 8,
      rank: pos.rank // No vertical wraparound
    };
  }

  /**
   * Check if a position is valid on the board
   */
  private isValidPosition(pos: Position): boolean {
    return pos.file >= 0 && pos.file < 8 && pos.rank >= 0 && pos.rank < 8;
  }

  /**
   * Convert chess.js piece type to our PieceType
   */
  private convertChessJSPieceType(chessJSType: string): PieceType {
    const typeMap: Record<string, PieceType> = {
      'p': 'pawn',
      'r': 'rook',
      'n': 'knight',
      'b': 'bishop',
      'q': 'queen',
      'k': 'king'
    };
    return typeMap[chessJSType] || 'pawn'; // fallback
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
            type: this.convertChessJSPieceType(piece.type),
            color: piece.color === 'w' ? 'white' : 'black'
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
    try {
      if (this.isWraparoundMode) {
        const moves = this.getWraparoundMoves(square);
        console.log(`getLegalMoves for ${square} in wraparound mode:`, moves);
        return moves;
      } else {
        // Use chess.js for standard moves
        const moves = this.chess.moves({ square: square as ChessJSSquare, verbose: true });
        return moves.map(move => move.to as Square);
      }
    } catch (error) {
      console.error(`Error getting legal moves for ${square}:`, error);
      return [];
    }
  }

  /**
   * Get wraparound moves for a piece at a given square
   */
  private getWraparoundMoves(square: Square): Square[] {
    const piece = this.getPiece(square);
    console.log(`getWraparoundMoves for ${square}: piece =`, piece);
    
    if (!piece) {
      console.log(`No piece found at ${square}`);
      return [];
    }

    const position = this.algebraicToPosition(square);
    console.log(`Position for ${square}:`, position);
    
    let moves: Square[] = [];

    switch (piece.type) {
      case 'rook':
        moves = this.getRookWraparoundMoves(position);
        break;
      case 'bishop':
        console.log(`Getting bishop moves for ${square}`);
        moves = this.getBishopWraparoundMoves(position);
        console.log(`Bishop moves result:`, moves);
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

    console.log(`Raw moves before filtering for ${square}:`, moves);

    // Filter out moves that would result in self-check
    const filteredMoves = this.filterSelfCheckMoves(square, moves);
    console.log(`Filtered moves for ${square}:`, filteredMoves);
    
    return filteredMoves;
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

    // Vertical moves (up-down without wraparound)
    for (let rank = 0; rank < 8; rank++) {
      if (rank !== pos.rank) {
        const targetPos = { file: pos.file, rank };
        const targetSquare = this.positionToAlgebraic(targetPos);
        const targetPiece = this.getPiece(targetSquare);
        
        // Check if path is clear (no vertical wraparound)
        if (this.isRookPathClearVertical(pos, targetPos)) {
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
   * Check if rook path is clear considering horizontal wraparound only
   */
  private isRookPathClear(from: Position, to: Position): boolean {
    if (from.rank === to.rank) {
      // Horizontal movement - allow wraparound
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
   * Check if vertical rook path is clear (no wraparound)
   */
  private isRookPathClearVertical(from: Position, to: Position): boolean {
    if (from.file === to.file) {
      // Vertical movement - no wraparound, direct path only
      const rankDiff = to.rank - from.rank;
      const distance = Math.abs(rankDiff);
      const step = rankDiff > 0 ? 1 : -1;
      
      for (let i = 1; i < distance; i++) {
        const checkRank = from.rank + (i * step);
        const checkSquare = this.positionToAlgebraic({ file: from.file, rank: checkRank });
        if (this.getPiece(checkSquare)) return false;
      }
    }
    
    return true;
  }

  /**
   * Get bishop wraparound moves (diagonal with horizontal edge wrapping only)
   */
  private getBishopWraparoundMoves(pos: Position): Square[] {
    console.log(`getBishopWraparoundMoves called with pos:`, pos);
    const moves: Square[] = [];
    
    try {
      // Four diagonal directions
      const directions = [
        { file: 1, rank: 1 },   // up-right
        { file: 1, rank: -1 },  // down-right
        { file: -1, rank: 1 },  // up-left
        { file: -1, rank: -1 }  // down-left
      ];

      const originalPiece = this.getPiece(this.positionToAlgebraic(pos));
      console.log(`Original piece at ${this.positionToAlgebraic(pos)}:`, originalPiece);
      
      if (!originalPiece) {
        console.error('No piece found at position for bishop moves:', pos);
        return [];
      }

      for (const dir of directions) {
        console.log(`Checking direction:`, dir);
        
        for (let i = 1; i < 8; i++) {
          const targetFile = (pos.file + (i * dir.file) + 8) % 8; // Horizontal wraparound
          const targetRank = pos.rank + (i * dir.rank); // No vertical wraparound
          
          console.log(`Step ${i}: targetFile=${targetFile}, targetRank=${targetRank}`);
          
          // Skip if rank goes out of bounds
          if (targetRank < 0 || targetRank > 7) {
            console.log(`Rank ${targetRank} out of bounds, breaking`);
            break;
          }
          
          const targetPos = { file: targetFile, rank: targetRank };
          const targetSquare = this.positionToAlgebraic(targetPos);
          const targetPiece = this.getPiece(targetSquare);
          
          console.log(`Target square ${targetSquare}: piece =`, targetPiece);

          if (targetPiece) {
            // If it's an opponent's piece, we can capture it
            if (targetPiece.color !== originalPiece.color) {
              moves.push(targetSquare);
              console.log(`Added capture move: ${targetSquare}`);
            } else {
              console.log(`Blocked by own piece at ${targetSquare}`);
            }
            // Can't move further in this direction
            break;
          } else {
            // Empty square, can move here
            moves.push(targetSquare);
            console.log(`Added move: ${targetSquare}`);
          }
        }
      }
    } catch (error) {
      console.error('Error in getBishopWraparoundMoves:', error);
    }

    console.log(`Final bishop moves:`, moves);
    return moves;
  }

  /**
   * Get knight wraparound moves (L-shaped moves with horizontal wraparound only)
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
      const targetFile = (pos.file + move.file + 8) % 8; // Horizontal wraparound
      const targetRank = pos.rank + move.rank; // No vertical wraparound
      
      // Skip if rank goes out of bounds
      if (targetRank < 0 || targetRank > 7) continue;
      
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
   * Get king wraparound moves (single-square moves with horizontal wraparound only)
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
      const targetFile = (pos.file + move.file + 8) % 8; // Horizontal wraparound
      const targetRank = pos.rank + move.rank; // No vertical wraparound
      
      // Skip if rank goes out of bounds
      if (targetRank < 0 || targetRank > 7) continue;
      
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
   * Get pawn wraparound moves (forward moves and captures with horizontal wraparound only)
   */
  private getPawnWraparoundMoves(pos: Position, color: PieceColor): Square[] {
    const moves: Square[] = [];
    const direction = color === 'white' ? 1 : -1;
    const startingRank = color === 'white' ? 1 : 6;

    // Forward move (no vertical wraparound)
    const forwardRank = pos.rank + direction;
    
    if (forwardRank >= 0 && forwardRank <= 7) {
      const forwardSquare = this.positionToAlgebraic({ file: pos.file, rank: forwardRank });
      
      if (!this.getPiece(forwardSquare)) {
        moves.push(forwardSquare);
        
        // Double move from starting position (no vertical wraparound)
        if (pos.rank === startingRank) {
          const doubleForwardRank = forwardRank + direction;
          if (doubleForwardRank >= 0 && doubleForwardRank <= 7) {
            const doubleForwardSquare = this.positionToAlgebraic({ file: pos.file, rank: doubleForwardRank });
            
            if (!this.getPiece(doubleForwardSquare)) {
              moves.push(doubleForwardSquare);
            }
          }
        }
      }
    }

    // Diagonal captures (with horizontal wraparound only)
    const captureFiles = [
      (pos.file - 1 + 8) % 8, // Horizontal wraparound
      (pos.file + 1) % 8      // Horizontal wraparound
    ];

    for (const captureFile of captureFiles) {
      const captureRank = pos.rank + direction; // No vertical wraparound
      if (captureRank >= 0 && captureRank <= 7) {
        const captureSquare = this.positionToAlgebraic({ file: captureFile, rank: captureRank });
        const captureTarget = this.getPiece(captureSquare);

        if (captureTarget && captureTarget.color !== color) {
          moves.push(captureSquare);
        }
      }
    }

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
    
    if (!originalPiece) {
      return [];
    }

    for (const move of moves) {
      // Make temporary move
      const capturedPiece = this.getPiece(move);
      this.position[fromSquare] = null;
      this.position[move] = originalPiece;

      // Check if this move leaves king in check
      const wouldBeInCheck = this.isKingInCheckWraparound(originalPiece.color);
      
      if (!wouldBeInCheck) {
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
    console.log(`isValidWraparoundMove: ${from} -> ${to}, legal moves:`, legalMoves);
    const isValid = legalMoves.includes(to);
    console.log(`Move ${to} is in legal moves: ${isValid}`);
    return isValid;
  }

  /**
   * Make a move (handles both standard and wraparound modes)
   */
  makeMove(from: Square, to: Square, promotion?: PieceType): ChessMove | null {
    console.log(`WraparoundChessEngine.makeMove: ${from} -> ${to}, wraparoundMode: ${this.isWraparoundMode}`);
    
    try {
      if (this.isWraparoundMode) {
        const result = this.makeWraparoundMove(from, to, promotion);
        console.log(`Wraparound move result:`, result);
        return result;
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
    
    console.log(`Move ${from} -> ${to} failed`);
    return null;
  }

  /**
   * Make a wraparound move
   */
  private makeWraparoundMove(from: Square, to: Square, promotion?: PieceType): ChessMove | null {
    console.log(`makeWraparoundMove: ${from} -> ${to}`);
    
    const isValid = this.isValidWraparoundMove(from, to);
    console.log(`isValidWraparoundMove result: ${isValid}`);
    
    if (!isValid) {
      console.log(`Move ${from} -> ${to} is not valid in wraparound mode`);
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

    // Manually advance the turn in the underlying chess.js instance
    this.advanceTurn();

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
   * Get squares that a pawn can capture (for attack detection, horizontal wraparound only)
   */
  private getPawnCaptureSquares(pos: Position, color: PieceColor): Square[] {
    const moves: Square[] = [];
    const direction = color === 'white' ? 1 : -1;

    // Diagonal captures (with horizontal wraparound only)
    const captureFiles = [
      (pos.file - 1 + 8) % 8, // Horizontal wraparound
      (pos.file + 1) % 8      // Horizontal wraparound
    ];

    for (const captureFile of captureFiles) {
      const captureRank = pos.rank + direction; // No vertical wraparound
      if (captureRank >= 0 && captureRank <= 7) {
        const captureSquare = this.positionToAlgebraic({ file: captureFile, rank: captureRank });
        moves.push(captureSquare);
      }
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

  /**
   * Manually advance the turn in chess.js for wraparound mode
   */
  private advanceTurn(): void {
    try {
      // Create a temporary chess instance to make a dummy move
      const tempChess = new Chess(this.chess.fen());
      const moves = tempChess.moves();
      
      if (moves.length > 0) {
        // Make any legal move to advance the turn
        tempChess.move(moves[0]);
        
        // Extract just the turn from the new FEN and apply it to our instance
        const currentFen = this.chess.fen().split(' ');
        const newFen = tempChess.fen().split(' ');
        
        // Update our chess instance with the new turn
        currentFen[1] = newFen[1]; // Update turn (w/b)
        this.chess.load(currentFen.join(' '));
        
        // Undo the move we made in the temp instance to keep the board state correct
        tempChess.undo();
      }
    } catch (error) {
      console.warn('Could not advance turn:', error);
    }
  }
}