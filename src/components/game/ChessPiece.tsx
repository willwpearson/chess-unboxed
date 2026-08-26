'use client';

import Piece from 'react-chess-pieces';
import { PieceType, PieceColor } from '@/types/game';
import { cn } from '@/lib/utils';

const TYPE_TO_FEN: Record<PieceType, string> = {
  king: 'k',
  queen: 'q',
  rook: 'r',
  bishop: 'b',
  knight: 'n',
  pawn: 'p',
};

interface ChessPieceIconProps {
  type: PieceType;
  color: PieceColor;
  className?: string;
}

export function ChessPieceIcon({ type, color, className }: ChessPieceIconProps) {
  const letter = TYPE_TO_FEN[type];
  const fen = color === 'white' ? letter.toUpperCase() : letter;

  return (
    <div className={cn('chess-piece-svg w-full h-full', className)}>
      <Piece piece={fen} />
    </div>
  );
}
