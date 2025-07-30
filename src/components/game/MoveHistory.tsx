/**
 * Move History Component
 * Displays the list of moves played in the game
 */
'use client';

import React from 'react';
import { ChessMove, PieceType } from '@/types/game';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { ScrollText } from 'lucide-react';

interface MoveHistoryProps {
  moves: ChessMove[];
  currentMoveIndex?: number;
  onMoveClick?: (moveIndex: number) => void;
}

export function MoveHistory({ moves, currentMoveIndex, onMoveClick }: MoveHistoryProps) {
  const formatMove = (move: ChessMove, moveIndex: number): string => {
    const { from, to, piece, captured, promotion, castling } = move;
    
    // Castling
    if (castling) {
      return castling === 'kingside' ? 'O-O' : 'O-O-O';
    }
    
    // Piece symbol (empty for pawns)
    const pieceSymbol = piece.type === 'pawn' ? '' : piece.type.charAt(0).toUpperCase();
    
    // Capture indicator
    const captureSymbol = captured ? 'x' : '';
    
    // Promotion
    const promotionSymbol = promotion ? `=${promotion.charAt(0).toUpperCase()}` : '';
    
    // Basic algebraic notation
    const moveNotation = `${pieceSymbol}${captureSymbol}${to}${promotionSymbol}`;
    
    return moveNotation;
  };

  const formatMoveNumber = (index: number): string => {
    return Math.floor(index / 2) + 1 + (index % 2 === 0 ? '.' : '...');
  };

  const formatTime = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  if (moves.length === 0) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <ScrollText size={20} />
            <h3 className="text-lg font-semibold">Move History</h3>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <ScrollText size={48} className="mx-auto mb-4 opacity-30" />
            <p>No moves yet</p>
            <p className="text-sm">Moves will appear here as the game progresses</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <ScrollText size={20} />
            <h3 className="text-lg font-semibold">Move History</h3>
          </div>
          <span className="text-sm text-gray-500">
            {moves.length} move{moves.length !== 1 ? 's' : ''}
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="max-h-96 overflow-y-auto space-y-1">
          {moves.map((move, index) => {
            const isCurrentMove = currentMoveIndex === index;
            const isWhiteMove = index % 2 === 0;
            
            return (
              <div
                key={index}
                className={`
                  flex items-center justify-between p-2 rounded cursor-pointer transition-colors
                  ${isCurrentMove ? 'bg-blue-100 border border-blue-300' : 'hover:bg-gray-50'}
                  ${onMoveClick ? 'cursor-pointer' : 'cursor-default'}
                `}
                onClick={() => onMoveClick?.(index)}
              >
                <div className="flex items-center space-x-3">
                  <span className="text-xs font-mono text-gray-500 w-8">
                    {formatMoveNumber(index)}
                  </span>
                  
                  <div className={`w-3 h-3 rounded-full ${isWhiteMove ? 'bg-gray-200' : 'bg-gray-800'}`} />
                  
                  <span className="font-mono text-sm">
                    {formatMove(move, index)}
                  </span>
                  
                  {move.captured && (
                    <span className="text-xs text-red-600 bg-red-50 px-1 rounded">
                      {move.captured.type}
                    </span>
                  )}
                  
                  {move.promotion && (
                    <span className="text-xs text-green-600 bg-green-50 px-1 rounded">
                      ={move.promotion}
                    </span>
                  )}
                </div>
                
                <span className="text-xs text-gray-400 font-mono">
                  {formatTime(move.timestamp)}
                </span>
              </div>
            );
          })}
        </div>
        
        {moves.length > 10 && (
          <div className="mt-3 pt-3 border-t text-center">
            <span className="text-xs text-gray-500">
              Scroll to see all moves
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
