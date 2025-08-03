/**
 * Chess Board Component
 * The main chess board interface for gameplay with chess.js integration
 */
'use client';

import React, { useState, useRef, useCallback, useMemo } from 'react';
import { Chess, Square as ChessJSSquare } from 'chess.js';
import { ChessPiece, Square, ChessMove, PieceType, PieceColor, GameVariant } from '@/types/game';
import { WraparoundChessEngine } from '@/lib/chessEngine';
import { useGameStore } from '@/store/gameStore';
import { getPieceSymbol, normalizeColor, normalizePieceType } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { PromotionDialog } from './PromotionDialog';
import { Crown, RotateCcw, Flag, Users, RefreshCw } from 'lucide-react';

interface ChessBoardProps {
  position?: Record<Square, ChessPiece | null>;
  chess?: Chess;
  fen?: string;
  gameVariant?: GameVariant;
  onMove: (move: ChessMove) => void;
  onResign?: () => void;
  onOfferDraw?: () => void;
  currentPlayer: PieceColor;
  isPlayerTurn: boolean;
  showCoordinates?: boolean;
  boardTheme?: 'classic' | 'modern' | 'wood';
}


const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
const RANKS = ['8', '7', '6', '5', '4', '3', '2', '1'];

export function ChessBoard({
  position,
  chess: propChess,
  fen,
  gameVariant = 'classic',
  onMove,
  onResign,
  onOfferDraw,
  currentPlayer,
  isPlayerTurn,
  showCoordinates = true,
  boardTheme = 'classic'
}: ChessBoardProps) {
  const { ui, setSelectedSquare, setPossibleMoves, setDraggedPiece, showPromotionDialog, hidePromotionDialog, getLegalMoves: storeLegalMoves } = useGameStore();
  const [draggedElement, setDraggedElement] = useState<HTMLElement | null>(null);
  const [pendingMove, setPendingMove] = useState<{ from: Square; to: Square } | null>(null);
  const boardRef = useRef<HTMLDivElement>(null);
  
  // Determine if we're in wraparound mode
  const isWraparoundMode = gameVariant === 'unboxed' || gameVariant === 'programming_unboxed';
  
  // Create and manage chess engine instance
  const chessEngine = useMemo(() => {
    if (isWraparoundMode) {
      return new WraparoundChessEngine(fen, true);
    } else if (propChess) {
      return propChess;
    } else {
      const instance = new Chess();
      if (fen) {
        try {
          console.log('Loading FEN into chess instance:', fen);
          instance.load(fen);
          console.log('Chess instance after loading FEN:', instance.fen());
        } catch (error) {
          console.warn('Invalid FEN provided, using default position:', error);
        }
      } else {
        console.log('No FEN provided, using default starting position');
      }
      return instance;
    }
  }, [propChess, fen, isWraparoundMode, currentPlayer]); // Add currentPlayer to force refresh on turn changes

  // For backward compatibility, maintain chess reference
  const chess = chessEngine instanceof WraparoundChessEngine ? chessEngine.getChessJS() : chessEngine;
  
  // Convert chess engine board to our position format
  const boardPosition = useMemo(() => {
    if (position) return position;
    
    if (chessEngine instanceof WraparoundChessEngine) {
      return chessEngine.getPosition();
    }
    
    const pos: Record<Square, ChessPiece | null> = {};
    const board = chess.board();
    
    for (let rank = 0; rank < 8; rank++) {
      for (let file = 0; file < 8; file++) {
        const square = `${String.fromCharCode(97 + file)}${8 - rank}` as Square;
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
  }, [chess, chessEngine, position]);
  
  // Helper function to convert our square format to chess.js format
  const toChessJSSquare = useCallback((square: Square): ChessJSSquare => square as ChessJSSquare, []);
  
  // Helper function to get legal moves for a square
  const getLegalMoves = useCallback((square: Square): Square[] => {
    // Prefer using the store's legal moves function if available (for GameManager integration)  
    if (storeLegalMoves) {
      return storeLegalMoves(square);
    }
    
    if (chessEngine instanceof WraparoundChessEngine) {
      return chessEngine.getLegalMoves(square);
    } else {
      const moves = chess.moves({ square: toChessJSSquare(square), verbose: true });
      return moves.map(move => move.to as Square);
    }
  }, [chess, chessEngine, toChessJSSquare, storeLegalMoves]);
  
  // Helper function to check if a move requires promotion
  const requiresPromotion = useCallback((from: Square, to: Square): boolean => {
    const piece = boardPosition[from];
    if (!piece || piece.type !== 'pawn') return false;
    
    const fromRank = parseInt(from[1]);
    const toRank = parseInt(to[1]);
    
    return (normalizeColor(piece.color) === 'white' && fromRank === 7 && toRank === 8) ||
           (normalizeColor(piece.color) === 'black' && fromRank === 2 && toRank === 1);
  }, [boardPosition]);

  const getSquareColor = (file: string, rank: string) => {
    const fileIndex = FILES.indexOf(file);
    const rankIndex = parseInt(rank);
    const isLight = (fileIndex + rankIndex) % 2 === 0;
    
    const themes = {
      classic: {
        light: 'bg-amber-100',
        dark: 'bg-amber-800'
      },
      modern: {
        light: 'bg-slate-100',
        dark: 'bg-slate-600'
      },
      wood: {
        light: 'bg-yellow-200',
        dark: 'bg-yellow-800'
      }
    };
    
    return isLight ? themes[boardTheme].light : themes[boardTheme].dark;
  };

  const getSquareName = (file: string, rank: string): Square => `${file}${rank}`;

  // Helper function to check if a move would be a wraparound move
  const isWraparoundMove = useCallback((from: Square, to: Square): boolean => {
    if (!isWraparoundMode) return false;
    
    const fromFile = from.charCodeAt(0) - 97; // a=0, b=1, etc.
    const toFile = to.charCodeAt(0) - 97;
    
    // Check for horizontal wraparound only (file difference > 4 means likely wraparound)
    const fileDiff = Math.abs(toFile - fromFile);
    const horizontalWrap = fileDiff > 4;
    
    return horizontalWrap;
  }, [isWraparoundMode]);

  // Helper function to get wraparound visual indicators
  const getWraparoundIndicators = useCallback((from: Square, to: Square) => {
    if (!isWraparoundMove(from, to)) return null;
    
    const fromFile = from.charCodeAt(0) - 97;
    const toFile = to.charCodeAt(0) - 97;
    
    const fileDiff = Math.abs(toFile - fromFile);
    
    if (fileDiff > 4) {
      return 'horizontal-wrap';
    }
    
    return null;
  }, [isWraparoundMove]);

  const handleSquareClick = useCallback((square: Square) => {
    console.log('Square clicked:', square, 'isPlayerTurn:', isPlayerTurn, 'currentPlayer:', currentPlayer);
    if (!isPlayerTurn) return;

    const piece = boardPosition[square];
    console.log('Piece on clicked square:', piece);
    
    if (ui.selectedSquare) {
      if (ui.selectedSquare === square) {
        // Deselect
        setSelectedSquare(null);
        setPossibleMoves([]);
      } else if (ui.possibleMoves.includes(square)) {
        console.log('Attempting move from', ui.selectedSquare, 'to', square);
        // Check if this move requires promotion
        if (requiresPromotion(ui.selectedSquare, square)) {
          console.log('Move requires promotion');
          setPendingMove({ from: ui.selectedSquare, to: square });
          showPromotionDialog(square);
          return;
        }

        // Always use onMove callback - let the GameManager handle the move validation
        console.log('Calling onMove to let GameManager handle the move');
        const sourcePiece = boardPosition[ui.selectedSquare]!;
        const moveToAttempt: ChessMove = {
          from: ui.selectedSquare,
          to: square,
          piece: {
            type: sourcePiece.type,
            color: sourcePiece.color
          },
          timestamp: Date.now()
        };
        
        console.log('Calling onMove with move:', moveToAttempt);
        onMove(moveToAttempt);
        setSelectedSquare(null);
        setPossibleMoves([]);
      } else if (piece && normalizeColor(piece.color) === currentPlayer) {
        // Select new piece and calculate legal moves
        console.log('Selecting piece - piece.color:', piece.color, 'currentPlayer:', currentPlayer);
        setSelectedSquare(square);
        const legalMoves = getLegalMoves(square);
        console.log('Legal moves for', square, ':', legalMoves);
        setPossibleMoves(legalMoves);
      } else {
        console.log('Cannot select piece - piece.color:', piece?.color, 'currentPlayer:', currentPlayer, 'match:', piece?.color === currentPlayer);
        setSelectedSquare(null);
        setPossibleMoves([]);
      }
    } else if (piece && normalizeColor(piece.color) === currentPlayer) {
      // Select piece and calculate legal moves
      console.log('Selecting piece (no previous selection) - piece.color:', piece.color, 'currentPlayer:', currentPlayer);
      setSelectedSquare(square);
      const legalMoves = getLegalMoves(square);
      console.log('Legal moves for', square, '(no prev selection):', legalMoves);
      setPossibleMoves(legalMoves);
    } else if (piece) {
      console.log('Cannot select piece (no previous selection) - piece.color:', piece.color, 'currentPlayer:', currentPlayer, 'match:', piece.color === currentPlayer);
    }
  }, [ui.selectedSquare, ui.possibleMoves, boardPosition, currentPlayer, isPlayerTurn, onMove, setSelectedSquare, setPossibleMoves, chess, chessEngine, getLegalMoves, toChessJSSquare, requiresPromotion, showPromotionDialog]);

  const handleDragStart = useCallback((e: React.DragEvent, square: Square) => {
    if (!isPlayerTurn) {
      e.preventDefault();
      return;
    }

    const piece = boardPosition[square];
    if (!piece || normalizeColor(piece.color) !== currentPlayer) {
      e.preventDefault();
      return;
    }

    setDraggedPiece({ piece, from: square });
    setDraggedElement(e.currentTarget as HTMLElement);
    
    // Show possible moves for the dragged piece
    const legalMoves = getLegalMoves(square);
    setPossibleMoves(legalMoves);
    
    // Hide the dragged element
    setTimeout(() => {
      if (draggedElement) {
        draggedElement.style.opacity = '0.5';
      }
    }, 0);
  }, [boardPosition, currentPlayer, isPlayerTurn, setDraggedPiece, getLegalMoves, setPossibleMoves, draggedElement]);

  const handleDragEnd = useCallback(() => {
    if (draggedElement) {
      draggedElement.style.opacity = '1';
    }
    setDraggedElement(null);
    setDraggedPiece(null);
    setPossibleMoves([]);
  }, [draggedElement, setDraggedPiece, setPossibleMoves]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, square: Square) => {
    e.preventDefault();
    
    if (!ui.draggedPiece) return;

    // Check if this move requires promotion
    if (requiresPromotion(ui.draggedPiece.from, square)) {
      setPendingMove({ from: ui.draggedPiece.from, to: square });
      showPromotionDialog(square);
      return;
    }

    // Always use onMove callback - let the GameManager handle the move validation
    const moveToAttempt: ChessMove = {
      from: ui.draggedPiece.from,
      to: square,
      piece: ui.draggedPiece.piece,
      timestamp: Date.now()
    };
    
    console.log('Drag-drop: Calling onMove with move:', moveToAttempt);
    onMove(moveToAttempt);
  }, [ui.draggedPiece, boardPosition, onMove, chess, chessEngine, toChessJSSquare, requiresPromotion, showPromotionDialog]);

  const handlePromotion = useCallback((piece: PieceType) => {
    if (!pendingMove) return;

    // Always use onMove callback - let the GameManager handle the move validation
    const sourcePiece = boardPosition[pendingMove.from]!;
    const moveToAttempt: ChessMove = {
      from: pendingMove.from,
      to: pendingMove.to,
      piece: sourcePiece,
      promotion: piece,
      timestamp: Date.now()
    };
    
    console.log('Promotion: Calling onMove with move:', moveToAttempt);
    onMove(moveToAttempt);

    // Clean up
    setPendingMove(null);
    hidePromotionDialog();
    setSelectedSquare(null);
    setPossibleMoves([]);
  }, [pendingMove, chess, chessEngine, boardPosition, onMove, toChessJSSquare, hidePromotionDialog, setSelectedSquare, setPossibleMoves]);

  const handlePromotionCancel = useCallback(() => {
    setPendingMove(null);
    hidePromotionDialog();
    setSelectedSquare(null);
    setPossibleMoves([]);
  }, [hidePromotionDialog, setSelectedSquare, setPossibleMoves]);

  const renderPiece = (piece: ChessPiece | null, square: Square) => {
    if (!piece) return null;

    console.log('Rendering piece:', piece, 'on square:', square);
    const symbol = getPieceSymbol(piece.type, piece.color);
    console.log('Symbol:', symbol);
    const isDragged = ui.draggedPiece?.from === square;

    return (
      <div
        className={`absolute inset-0 flex items-center justify-center text-4xl cursor-pointer select-none transition-opacity ${
          isDragged ? 'opacity-50' : ''
        }`}
        draggable={isPlayerTurn && normalizeColor(piece.color) === currentPlayer}
        onDragStart={(e) => handleDragStart(e, square)}
        onDragEnd={handleDragEnd}
        onClick={() => handleSquareClick(square)}
      >
        {symbol}
      </div>
    );
  };

  const renderSquare = (file: string, rank: string) => {
    const square = getSquareName(file, rank);
    const piece = boardPosition[square];
    if (square === 'e1' || square === 'e8') {
      console.log(`Square ${square}:`, piece, 'from boardPosition:', boardPosition);
    }
    const isSelected = ui.selectedSquare === square;
    const isPossibleMove = ui.possibleMoves.includes(square);
    const isLastMove = false; // TODO: Implement last move highlighting
    
    // Check if this square would be a wraparound move
    const isWraparoundTarget = ui.selectedSquare && isWraparoundMove(ui.selectedSquare, square);
    const wraparoundType = ui.selectedSquare ? getWraparoundIndicators(ui.selectedSquare, square) : null;

    return (
      <div
        key={square}
        className={`
          relative aspect-square cursor-pointer transition-all duration-200
          ${getSquareColor(file, rank)}
          ${isSelected ? 'ring-4 ring-yellow-400 ring-inset' : ''}
          ${isPossibleMove && !isWraparoundTarget ? 'ring-2 ring-blue-400 ring-inset' : ''}
          ${isPossibleMove && isWraparoundTarget ? 'ring-2 ring-purple-500 ring-inset bg-purple-100 bg-opacity-30' : ''}
          ${isLastMove ? 'ring-2 ring-green-400 ring-inset' : ''}
        `}
        onClick={() => handleSquareClick(square)}
        onDragOver={handleDragOver}
        onDrop={(e) => handleDrop(e, square)}
      >
        {/* Coordinate labels */}
        {showCoordinates && (
          <>
            {file === 'a' && (
              <div className="absolute left-1 top-1 text-xs font-semibold opacity-70">
                {rank}
              </div>
            )}
            {rank === '1' && (
              <div className="absolute right-1 bottom-1 text-xs font-semibold opacity-70">
                {file}
              </div>
            )}
          </>
        )}

        {/* Possible move indicator */}
        {isPossibleMove && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className={`w-6 h-6 rounded-full ${
              isWraparoundTarget 
                ? piece ? 'ring-4 ring-purple-500' : 'bg-purple-500 opacity-60'
                : piece ? 'ring-4 ring-blue-400' : 'bg-blue-400 opacity-60'
            }`} />
          </div>
        )}

        {/* Wraparound indicator */}
        {isWraparoundTarget && wraparoundType && (
          <div className="absolute top-1 right-1">
            <div className="w-3 h-3 bg-purple-500 rounded-full flex items-center justify-center">
              <span className="text-xs text-white font-bold">
                {wraparoundType === 'horizontal-wrap' ? '↔' : '⟲'}
              </span>
            </div>
          </div>
        )}

        {/* Chess piece */}
        {renderPiece(piece, square)}
      </div>
    );
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      {/* Board */}
      <div 
        ref={boardRef}
        className={`relative p-4 rounded-lg shadow-2xl ${
          isWraparoundMode ? 'bg-purple-900' : 'bg-amber-900'
        }`}
      >
        {/* Wraparound indicators - only left-right */}
        {isWraparoundMode && (
          <>
            {/* Left-right connection indicators */}
            <div className="absolute -left-2 top-1/2 transform -translate-y-1/2 -rotate-90 text-purple-300 text-sm font-bold">
              ↔ Wraps ↔
            </div>
            <div className="absolute -right-2 top-1/2 transform -translate-y-1/2 -rotate-90 text-purple-300 text-sm font-bold">
              ↔ Wraps ↔
            </div>
          </>
        )}
        
        <div className={`grid grid-cols-8 gap-0 w-96 h-96 border-2 ${
          isWraparoundMode ? 'border-purple-900' : 'border-amber-900'
        }`}>
          {RANKS.map(rank => 
            FILES.map(file => renderSquare(file, rank))
          )}
        </div>
      </div>

      {/* Game Controls */}
      <div className="flex items-center space-x-3">
        {onOfferDraw && (
          <Button
            variant="outline"
            size="sm"
            onClick={onOfferDraw}
            disabled={!isPlayerTurn}
            className="flex items-center space-x-1"
          >
            <Users size={16} />
            <span>Offer Draw</span>
          </Button>
        )}
        
        {onResign && (
          <Button
            variant="outline"
            size="sm"
            onClick={onResign}
            className="flex items-center space-x-1 text-red-600 border-red-200 hover:bg-red-50"
          >
            <Flag size={16} />
            <span>Resign</span>
          </Button>
        )}

        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setSelectedSquare(null);
            setPossibleMoves([]);
          }}
          className="flex items-center space-x-1"
        >
          <RotateCcw size={16} />
          <span>Clear</span>
        </Button>
      </div>

      {/* Game mode and turn indicator */}
      <div className="text-center space-y-2">
        {/* Mode indicator */}
        <div className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full text-sm ${
          isWraparoundMode 
            ? 'bg-purple-100 text-purple-800 border border-purple-300' 
            : 'bg-amber-100 text-amber-800 border border-amber-300'
        }`}>
          <RefreshCw size={14} />
          <span className="font-medium">
            {isWraparoundMode ? 'Chess Unboxed' : 'Classic Chess'}
          </span>
        </div>
        
        {/* Turn indicator */}
        <div className={`inline-flex items-center space-x-2 px-4 py-2 rounded-full ${
          isPlayerTurn ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
        }`}>
          <Crown size={16} />
          <span className="font-medium">
            {isPlayerTurn ? 'Your Turn' : `${currentPlayer === 'white' ? 'White' : 'Black'} to Move`}
          </span>
        </div>
      </div>

      {/* Promotion Dialog */}
      <PromotionDialog
        isOpen={ui.showPromotionDialog}
        color={currentPlayer}
        onPromote={handlePromotion}
        onCancel={handlePromotionCancel}
      />
    </div>
  );
}