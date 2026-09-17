'use client';

import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Modal } from '@/components/ui/Modal';
import { Banner } from '@/components/ui/Banner';
import { Button } from '@/components/ui/Button';
import { GameEndReason, GameResult, PieceColor } from '@/types/game';

interface GameOverModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: GameResult;
  endReason?: GameEndReason;
  /** The viewing player's color, used to phrase the result from "you" won/lost/drew. */
  perspective: PieceColor;
  onNewGame?: () => void;
}

type Outcome = 'won' | 'lost' | 'drew';

function getOutcome(result: GameResult, perspective: PieceColor): Outcome {
  if (result === 'draw') return 'drew';
  return result === `${perspective}-wins` ? 'won' : 'lost';
}

export function GameOverModal({ isOpen, onClose, result, endReason, perspective, onNewGame }: GameOverModalProps) {
  const outcome = getOutcome(result, perspective);

  useEffect(() => {
    if (isOpen && outcome === 'won') {
      confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
    }
  }, [isOpen, outcome]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="sm">
      <div className="space-y-6 text-center">
        {outcome === 'won' && <Banner variant="success">You won!</Banner>}
        {outcome === 'lost' && <p className="text-2xl font-bold text-status-danger">You lost</p>}
        {outcome === 'drew' && <p className="text-2xl font-bold text-status-warning">Draw</p>}

        {endReason && (
          <p className="text-fg-secondary capitalize">{endReason.replace(/-/g, ' ')}</p>
        )}

        <div className="flex items-center justify-center gap-3">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          {onNewGame && (
            <Button variant="primary" onClick={onNewGame}>
              New Game
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}
