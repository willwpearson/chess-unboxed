'use client';

import React from 'react';
import { PieceColor } from '@/types/game';
import { Badge } from '@/components/ui/Badge';

interface TurnIndicatorProps {
  currentPlayer: PieceColor;
  isPlayerTurn: boolean;
  isWraparoundMode?: boolean;
  className?: string;
}

export function TurnIndicator({
  currentPlayer,
  isPlayerTurn,
  isWraparoundMode = false,
  className = ''
}: TurnIndicatorProps) {
  return (
    <div className={`flex justify-center ${className}`}>
      <div
        className={`inline-flex items-center space-x-3 px-4 py-2 rounded-full shadow-sm border transition-all duration-200 ${
          isPlayerTurn
            ? 'bg-status-success/10 text-status-success border-status-success/30'
            : 'bg-surface-sunken text-fg-secondary border-border-subtle'
        }`}
      >
        <div
          className={`w-2 h-2 rounded-full ${
            isPlayerTurn ? 'bg-status-success animate-pulse' : 'bg-fg-muted'
          }`}
        />
        <span className="font-medium text-sm">
          {isPlayerTurn ? 'Your move' : `${currentPlayer === 'white' ? 'White' : 'Black'} to move`}
        </span>
        {isWraparoundMode && (
          <Badge variant="info" size="sm">
            Unboxed
          </Badge>
        )}
      </div>
    </div>
  );
}
