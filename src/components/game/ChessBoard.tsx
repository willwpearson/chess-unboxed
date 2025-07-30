/**
 * Chess Board Component
 * The main chess board interface for gameplay
 */
'use client';

import React, { useState, useRef, useCallback } from 'react';
import { ChessPiece, Square, ChessMove, PieceType, PieceColor } from '@/types/game';
import { useGameStore } from '@/store/gameStore';
import { Button } from '@/components/ui/Button';
import { Crown, RotateCcw, Flag, Users } from 'lucide-react';

interface ChessBoardProps {
  position: Record<Square, ChessPiece | null>;
  onMove: (move: ChessMove) => void;
  onResign?: () => void;
  onOfferDraw?: () => void;
  currentPlayer: PieceColor;
  isPlayerTurn: boolean;
  showCoordinates?: boolean;
  boardTheme?: 'classic' | 'modern' | 'wood';
}

const PIECE_SYMBOLS: Record<PieceType, Record<PieceColor, string>> = {
  king: { white: '♔', black: '♚' },
  queen: { white: '♕', black: '♛' },
  rook: { white: '♖', black: '♜' },
  bishop: { white: '♗', black: '♝' },
  knight: { white: '♘', black: '♞' },
  pawn: { white: '♙', black: '♟' },
};

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
const RANKS = ['8', '7', '6', '5', '4', '3', '2', '1'];

export function ChessBoard({
  position,
  onMove,
  onResign,
  onOfferDraw,
  currentPlayer,
  isPlayerTurn,
  showCoordinates = true,
  boardTheme = 'classic'
}: ChessBoardProps) {
  const { ui, setSelectedSquare, setPossibleMoves, setDraggedPiece } = useGameStore();
  const [draggedElement, setDraggedElement] = useState<HTMLElement | null>(null);
  const boardRef = useRef<HTMLDivElement>(null);

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

  const handleSquareClick = useCallback((square: Square) => {
    if (!isPlayerTurn) return;

    const piece = position[square];
    
    if (ui.selectedSquare) {
      if (ui.selectedSquare === square) {
        // Deselect
        setSelectedSquare(null);
        setPossibleMoves([]);
      } else if (ui.possibleMoves.includes(square)) {
        // Make move
        const move: ChessMove = {
          from: ui.selectedSquare,
          to: square,
          piece: position[ui.selectedSquare]!,
          captured: piece || undefined,
          timestamp: Date.now()
        };
        onMove(move);
        setSelectedSquare(null);
        setPossibleMoves([]);
      } else if (piece && piece.color === currentPlayer) {
        // Select new piece
        setSelectedSquare(square);
        // TODO: Calculate possible moves
        setPossibleMoves([]);
      } else {
        setSelectedSquare(null);
        setPossibleMoves([]);
      }
    } else if (piece && piece.color === currentPlayer) {
      // Select piece
      setSelectedSquare(square);
      // TODO: Calculate possible moves
      setPossibleMoves([]);
    }
  }, [ui.selectedSquare, ui.possibleMoves, position, currentPlayer, isPlayerTurn, onMove, setSelectedSquare, setPossibleMoves]);

  const handleDragStart = useCallback((e: React.DragEvent, square: Square) => {
    if (!isPlayerTurn) {
      e.preventDefault();
      return;
    }

    const piece = position[square];
    if (!piece || piece.color !== currentPlayer) {
      e.preventDefault();
      return;
    }

    setDraggedPiece({ piece, from: square });
    setDraggedElement(e.currentTarget as HTMLElement);
    
    // Hide the dragged element
    setTimeout(() => {
      if (draggedElement) {
        draggedElement.style.opacity = '0.5';
      }
    }, 0);
  }, [position, currentPlayer, isPlayerTurn, setDraggedPiece]);

  const handleDragEnd = useCallback((e: React.DragEvent) => {
    if (draggedElement) {
      draggedElement.style.opacity = '1';
    }
    setDraggedElement(null);
    setDraggedPiece(null);
  }, [draggedElement, setDraggedPiece]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, square: Square) => {
    e.preventDefault();
    
    if (!ui.draggedPiece) return;

    const move: ChessMove = {
      from: ui.draggedPiece.from,
      to: square,
      piece: ui.draggedPiece.piece,
      captured: position[square] || undefined,
      timestamp: Date.now()
    };

    onMove(move);
  }, [ui.draggedPiece, position, onMove]);

  const renderPiece = (piece: ChessPiece | null, square: Square) => {
    if (!piece) return null;

    const symbol = PIECE_SYMBOLS[piece.type][piece.color];
    const isDragged = ui.draggedPiece?.from === square;

    return (
      <div
        className={`absolute inset-0 flex items-center justify-center text-4xl cursor-pointer select-none transition-opacity ${
          isDragged ? 'opacity-50' : ''
        }`}
        draggable={isPlayerTurn && piece.color === currentPlayer}
        onDragStart={(e) => handleDragStart(e, square)}
        onDragEnd={handleDragEnd}
      >
        {symbol}
      </div>
    );
  };

  const renderSquare = (file: string, rank: string) => {
    const square = getSquareName(file, rank);
    const piece = position[square];
    const isSelected = ui.selectedSquare === square;
    const isPossibleMove = ui.possibleMoves.includes(square);
    const isLastMove = false; // TODO: Implement last move highlighting

    return (
      <div
        key={square}
        className={`
          relative aspect-square cursor-pointer transition-all duration-200
          ${getSquareColor(file, rank)}
          ${isSelected ? 'ring-4 ring-yellow-400 ring-inset' : ''}
          ${isPossibleMove ? 'ring-2 ring-blue-400 ring-inset' : ''}
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
            <div className={`w-6 h-6 rounded-full ${piece ? 'ring-4 ring-blue-400' : 'bg-blue-400 opacity-60'}`} />
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
        className="relative bg-amber-900 p-4 rounded-lg shadow-2xl"
      >
        <div className="grid grid-cols-8 gap-0 w-96 h-96 border-2 border-amber-900">
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

      {/* Turn indicator */}
      <div className="text-center">
        <div className={`inline-flex items-center space-x-2 px-4 py-2 rounded-full ${
          isPlayerTurn ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
        }`}>
          <Crown size={16} />
          <span className="font-medium">
            {isPlayerTurn ? 'Your Turn' : `${currentPlayer === 'white' ? 'White' : 'Black'} to Move`}
          </span>
        </div>
      </div>
    </div>
  );
}
