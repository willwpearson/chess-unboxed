/**
 * Promotion Dialog Component
 * Allows players to select promotion piece when a pawn reaches the end
 */
'use client';

import React from 'react';
import { PieceType, PieceColor } from '@/types/game';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';

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
  return (
    <Modal isOpen={isOpen} onClose={onCancel} title="Choose Promotion Piece" maxWidth="sm">
      <div className="grid grid-cols-2 gap-4 mb-6">
        {PROMOTION_PIECES.map((piece) => (
          <button
            key={piece}
            onClick={() => onPromote(piece)}
            className="flex flex-col items-center p-4 border border-border-subtle rounded-lg hover:border-accent-primary hover:bg-accent-primary/10 transition-all"
          >
            <div className="text-4xl mb-2 text-fg">
              {PIECE_SYMBOLS[piece][color]}
            </div>
            <span className="text-sm font-medium capitalize text-fg-secondary">
              {piece}
            </span>
          </button>
        ))}
      </div>

      <div className="flex justify-center">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </Modal>
  );
}
