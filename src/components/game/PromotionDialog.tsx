/**
 * Promotion Dialog Component
 * Allows players to select promotion piece when a pawn reaches the end
 */
'use client';

import React from 'react';
import { PieceType, PieceColor } from '@/types/game';
import { Button } from '@/components/ui/Button';
import { Crown, Castle, Church, Trophy } from 'lucide-react';

interface PromotionDialogProps {
  isOpen: boolean;
  color: PieceColor;
  onPromote: (piece: PieceType) => void;
  onCancel: () => void;
}

const PIECE_SYMBOLS: Record<PieceType, Record<PieceColor, string>> = {
  queen: { white: '♕', black: '♛' },
  rook: { white: '♖', black: '♜' },
  bishop: { white: '♗', black: '♝' },
  knight: { white: '♘', black: '♞' },
  king: { white: '♔', black: '♚' },
  pawn: { white: '♙', black: '♟' },
};

const PROMOTION_PIECES: PieceType[] = ['queen', 'rook', 'bishop', 'knight'];

export function PromotionDialog({ isOpen, color, onPromote, onCancel }: PromotionDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 shadow-xl max-w-md w-full mx-4">
        <h2 className="text-xl font-bold text-center mb-4">
          Choose Promotion Piece
        </h2>
        
        <div className="grid grid-cols-2 gap-4 mb-6">
          {PROMOTION_PIECES.map((piece) => (
            <button
              key={piece}
              onClick={() => onPromote(piece)}
              className="flex flex-col items-center p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all"
            >
              <div className="text-4xl mb-2">
                {PIECE_SYMBOLS[piece][color]}
              </div>
              <span className="text-sm font-medium capitalize">
                {piece}
              </span>
            </button>
          ))}
        </div>
        
        <div className="flex justify-center">
          <Button
            variant="outline"
            onClick={onCancel}
            className="text-gray-600"
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}