'use client';

import React from 'react';
import { RotateCcw, Flag, Users } from 'lucide-react';

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

      {onClearSelection && (
        <button
          onClick={onClearSelection}
          className="flex items-center space-x-1 px-3 py-2 bg-white rounded-full shadow-md border hover:shadow-lg transition-all duration-200 text-sm"
        >
          <RotateCcw size={14} />
          <span className="hidden sm:inline">Clear</span>
        </button>
      )}
    </div>
  );
}