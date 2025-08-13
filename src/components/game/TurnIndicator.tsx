'use client';

import React from 'react';
import { PieceColor } from '@/types/game';

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
  );
}