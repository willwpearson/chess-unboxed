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
  boardTheme?: 'classic' | 'modern' | 'wood' | 'neon' | 'cyberpunk';
  showActionButtons?: boolean;
  showTurnIndicator?: boolean;
}


const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
const RANKS = ['8', '7', '6', '5', '4', '3', '2', '1'];

export function ChessBoard({
  position,
  chess: propChess,
  fen,
  gameVariant = 'unboxed',
  onMove,
  onResign,
  onOfferDraw,
  currentPlayer,
  isPlayerTurn,
  showCoordinates = true,
  boardTheme = 'classic',
  showActionButtons = true,
  showTurnIndicator = true
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
    if (position) {
      // Normalize the position prop if it contains raw chess.js piece types
      const normalizedPosition: Record<Square, ChessPiece | null> = {};
      for (const [square, piece] of Object.entries(position)) {
        if (piece) {
          normalizedPosition[square as Square] = {
            type: normalizePieceType(piece.type as string),
            color: normalizeColor(piece.color as string)
          };
        } else {
          normalizedPosition[square as Square] = null;
        }
      }
      return normalizedPosition;
    }
    
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
            type: normalizePieceType(piece.type),
            color: normalizeColor(piece.color)
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
    
    return (piece.color === 'white' && fromRank === 7 && toRank === 8) ||
           (piece.color === 'black' && fromRank === 2 && toRank === 1);
  }, [boardPosition]);

  const getSquareColor = (file: string, rank: string) => {
    const fileIndex = FILES.indexOf(file);
    const rankIndex = parseInt(rank);
    const isLight = (fileIndex + rankIndex) % 2 === 0;
    
    // Modern Chess.com-like styling
    return `chess-square ${boardTheme} ${isLight ? 'light' : 'dark'}`;
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
    const isMyPiece = isPlayerTurn && normalizeColor(piece.color) === currentPlayer;

    return (
      <div
        className={`absolute inset-0 flex items-center justify-center cursor-pointer select-none transition-all duration-200 ${
          isDragged ? 'opacity-50 scale-110' : ''
        } ${isMyPiece ? 'hover:scale-105' : ''}`}
        draggable={isMyPiece}
        onDragStart={(e) => handleDragStart(e, square)}
        onDragEnd={handleDragEnd}
        onClick={() => handleSquareClick(square)}
      >
        <span className="text-3xl sm:text-4xl md:text-5xl drop-shadow-sm">
          {symbol}
        </span>
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
          ${isSelected ? 'ring-2 ring-yellow-500 ring-inset shadow-inner' : ''}
          ${isPossibleMove && !isWraparoundTarget ? 'ring-1 ring-blue-400 ring-inset' : ''}
          ${isPossibleMove && isWraparoundTarget ? 'ring-1 ring-purple-500 ring-inset' : ''}
          ${isLastMove ? 'ring-1 ring-green-500 ring-inset' : ''}
        `}
        onClick={() => handleSquareClick(square)}
        onDragOver={handleDragOver}
        onDrop={(e) => handleDrop(e, square)}
      >
        {/* Possible move indicator - modern dots */}
        {isPossibleMove && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            {piece ? (
              // Capture indicator - ring around edge
              <div className={`absolute inset-1 rounded-full border-2 ${
                isWraparoundTarget ? 'border-purple-500' : 'border-blue-500'
              }`} />
            ) : (
              // Move indicator - small dot
              <div className={`w-3 md:w-6 h-3 md:h-6 rounded-full ${
                isWraparoundTarget ? 'bg-purple-500' : 'bg-blue-500'
              } opacity-70`} />
            )}
          </div>
        )}

        {/* Chess piece */}
        {renderPiece(piece, square)}
      </div>
    );
  };

  return (
    <div className="w-full max-w-none flex flex-col items-center">
      {/* CSS animations for particle flow */}
      <style jsx>{`
        @keyframes flowRight {
          0% {
            transform: translateX(0) scale(1);
            opacity: 1;
          }
          50% {
            opacity: 0.8;
            transform: translateX(32px) scale(0.8);
          }
          100% {
            transform: translateX(64px) scale(0.3);
            opacity: 0;
          }
        }
        
        @keyframes flowLeft {
          0% {
            transform: translateX(0) scale(1);
            opacity: 1;
          }
          50% {
            opacity: 0.8;
            transform: translateX(-32px) scale(0.8);
          }
          100% {
            transform: translateX(-64px) scale(0.3);
            opacity: 0;
          }
        }
      `}</style>
      
      {/* Modern Chess Board Container */}
      <div className="relative w-full max-w-[min(100vw-2rem,100vh-8rem)] aspect-square">
        <div 
          ref={boardRef}
          className={`relative w-full h-full rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.12)] ${
            isWraparoundMode ? 'bg-gradient-to-br from-purple-400 to-indigo-400' : 'bg-gradient-to-br from-amber-500 to-orange-500'
          }`}
        >
          {/* Wraparound portals - off to the sides */}
          {isWraparoundMode && (
            <>
              {/* Left portal */}
              <div className="absolute -left-16 top-0 bottom-0 w-12">
                {/* Portal structure */}
                <div className="relative w-full h-full">
                  {/* Portal ring */}
                  <div className="absolute inset-0 rounded-full border-3 border-purple-400 shadow-[0_0_20px_rgba(147,51,234,0.4)] animate-pulse"></div>
                  <div className="absolute inset-1 rounded-full border-2 border-indigo-400 animate-pulse [animation-delay:0.5s]"></div>
                  
                  {/* Portal center */}
                  <div className="absolute inset-3 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 shadow-inner animate-pulse"></div>
                  
                </div>
                
                {/* Horizontal particles flowing toward board - distributed across full height */}
                {[...Array(12)].map((_, i) => (
                  <div
                    key={`left-flow-${i}`}
                    className="absolute w-1.5 h-1.5 bg-purple-400 rounded-full"
                    style={{
                      top: `${5 + i * 8}%`,
                      left: '100%',
                      animationName: 'flowRight',
                      animationDuration: '3s',
                      animationIterationCount: 'infinite',
                      animationDelay: `${i * 0.3}s`,
                      animationTimingFunction: 'ease-out'
                    }}
                  ></div>
                ))}
                
                {/* Secondary flow particles */}
                {[...Array(8)].map((_, i) => (
                  <div
                    key={`left-flow-sec-${i}`}
                    className="absolute w-1 h-1 bg-indigo-300 rounded-full"
                    style={{
                      top: `${8 + i * 10}%`,
                      left: '100%',
                      animationName: 'flowRight',
                      animationDuration: '2.5s',
                      animationIterationCount: 'infinite',
                      animationDelay: `${0.2 + i * 0.4}s`,
                      animationTimingFunction: 'ease-out'
                    }}
                  ></div>
                ))}
              </div>
              
              {/* Right portal */}
              <div className="absolute -right-16 top-0 bottom-0 w-12">
                {/* Portal structure */}
                <div className="relative w-full h-full">
                  {/* Portal ring */}
                  <div className="absolute inset-0 rounded-full border-3 border-purple-400 shadow-[0_0_20px_rgba(147,51,234,0.4)] animate-pulse"></div>
                  <div className="absolute inset-1 rounded-full border-2 border-indigo-400 animate-pulse [animation-delay:0.5s]"></div>
                  
                  {/* Portal center */}
                  <div className="absolute inset-3 rounded-full bg-gradient-to-l from-purple-600 to-indigo-600 shadow-inner animate-pulse"></div>
                  
                </div>
                
                {/* Horizontal particles flowing toward board - distributed across full height */}
                {[...Array(12)].map((_, i) => (
                  <div
                    key={`right-flow-${i}`}
                    className="absolute w-1.5 h-1.5 bg-purple-400 rounded-full"
                    style={{
                      top: `${5 + i * 8}%`,
                      right: '100%',
                      animationName: 'flowLeft',
                      animationDuration: '3s',
                      animationIterationCount: 'infinite',
                      animationDelay: `${i * 0.3}s`,
                      animationTimingFunction: 'ease-out'
                    }}
                  ></div>
                ))}
                
                {/* Secondary flow particles */}
                {[...Array(8)].map((_, i) => (
                  <div
                    key={`right-flow-sec-${i}`}
                    className="absolute w-1 h-1 bg-indigo-300 rounded-full"
                    style={{
                      top: `${8 + i * 10}%`,
                      right: '100%',
                      animationName: 'flowLeft',
                      animationDuration: '2.5s',
                      animationIterationCount: 'infinite',
                      animationDelay: `${0.2 + i * 0.4}s`,
                      animationTimingFunction: 'ease-out'
                    }}
                  ></div>
                ))}
              </div>
            </>
          )}
          
          {/* Chess Board Grid */}
          <div className="w-full h-full p-3 md:p-4">
            <div className="w-full h-full grid grid-cols-8 gap-0 rounded-lg overflow-hidden shadow-inner">
              {RANKS.map(rank => 
                FILES.map(file => renderSquare(file, rank))
              )}
            </div>
          </div>

          {/* Rank and File Labels */}
          {showCoordinates && (
            <>
              {/* File labels (a-h) at bottom */}
              <div className="absolute bottom-0 left-3 right-3 md:left-4 md:right-4 flex justify-between pointer-events-none">
                {FILES.map(file => (
                  <div key={file} className="w-[12.5%] text-center">
                    <span className="text-xs font-medium text-gray-600">{file}</span>
                  </div>
                ))}
              </div>
              {/* Rank labels (1-8) on left */}
              <div className="absolute top-3 bottom-3 md:top-4 md:bottom-4 left-1 flex flex-col justify-between pointer-events-none">
                {RANKS.map(rank => (
                  <div key={rank} className="h-[12.5%] flex items-center">
                    <span className="text-xs font-medium text-gray-600">{rank}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Modern Action Buttons - Floating */}
        {showActionButtons && (
          <div className="absolute -bottom-16 left-1/2 transform -translate-x-1/2 flex items-center space-x-2">
            {onOfferDraw && (
              <button
                onClick={onOfferDraw}
                disabled={!isPlayerTurn}
                className="flex items-center space-x-1 px-3 py-2 bg-white rounded-full shadow-md border hover:shadow-lg transition-all duration-200 disabled:opacity-50 text-sm"
              >
                <Users size={14} />
                <span className="hidden sm:inline">Draw</span>
              </button>
            )}
            
            {onResign && (
              <button
                onClick={onResign}
                className="flex items-center space-x-1 px-3 py-2 bg-white rounded-full shadow-md border hover:shadow-lg transition-all duration-200 text-red-600 hover:bg-red-50 text-sm"
              >
                <Flag size={14} />
                <span className="hidden sm:inline">Resign</span>
              </button>
            )}

            <button
              onClick={() => {
                setSelectedSquare(null);
                setPossibleMoves([]);
              }}
              className="flex items-center space-x-1 px-3 py-2 bg-white rounded-full shadow-md border hover:shadow-lg transition-all duration-200 text-sm"
            >
              <RotateCcw size={14} />
              <span className="hidden sm:inline">Clear</span>
            </button>
          </div>
        )}
      </div>

      {/* Modern Turn Indicator */}
      {showTurnIndicator && (
        <div className="mt-20 mb-4">
          <div className={`inline-flex items-center space-x-3 px-4 py-2 rounded-full shadow-sm border transition-all duration-200 ${
            isPlayerTurn 
              ? 'bg-green-50 text-green-800 border-green-200' 
              : 'bg-slate-50 text-slate-700 border-slate-200'
          }`}>
            <div className={`w-2 h-2 rounded-full ${
              isPlayerTurn ? 'bg-green-500 animate-pulse' : 'bg-slate-400'
            }`} />
            <span className="font-medium text-sm">
              {isPlayerTurn ? 'Your move' : `${currentPlayer === 'white' ? 'White' : 'Black'} to move`}
            </span>
            {isWraparoundMode && (
              <div className="ml-2 px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs font-medium">
                Unboxed
              </div>
            )}
          </div>
        </div>
      )}

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