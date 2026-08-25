'use client';

import React from 'react';
import { RotateCcw, Flag, Users } from 'lucide-react';
import { IconButton } from '@/components/ui/IconButton';

interface GameActionButtonsProps {
  onOfferDraw?: () => void;
  onResign?: () => void;
  onClearSelection?: () => void;
  isPlayerTurn: boolean;
  className?: string;
}

export function GameActionButtons({
  onOfferDraw,
  onResign,
  onClearSelection,
  isPlayerTurn,
  className = ''
}: GameActionButtonsProps) {
  return (
    <div className={`flex items-center justify-center space-x-2 ${className}`}>
      {onOfferDraw && (
        <IconButton
          variant="solid"
          size="md"
          aria-label="Offer draw"
          onClick={onOfferDraw}
          disabled={!isPlayerTurn}
        >
          <Users size={16} />
        </IconButton>
      )}

      {onResign && (
        <IconButton variant="danger" size="md" aria-label="Resign" onClick={onResign}>
          <Flag size={16} />
        </IconButton>
      )}

      {onClearSelection && (
        <IconButton variant="solid" size="md" aria-label="Clear selection" onClick={onClearSelection}>
          <RotateCcw size={16} />
        </IconButton>
      )}
    </div>
  );
}
