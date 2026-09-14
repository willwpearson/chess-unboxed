'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { ChessBoard } from '@/components/game/ChessBoard';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { RatingBadge } from '@/components/ui/RatingBadge';
import { useGameStore } from '@/store/gameStore';
import { usePuzzleStore } from '@/store/puzzleStore';
import { useUserStore } from '@/store/userStore';
import type { ChessMove } from '@/types/game';
import { ArrowLeft } from 'lucide-react';

export default function PuzzlePracticePage() {
  const router = useRouter();
  const { currentGame } = useGameStore();
  const { currentPuzzle, status, ratingChange, loadPuzzle, submitMove, reset } = usePuzzleStore();
  const { user } = useUserStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNextPuzzle = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/puzzles/next', { credentials: 'include' });
      const body = await response.json();
      if (!body.success) {
        setError(body.error || 'No puzzles available right now.');
        reset();
        return;
      }
      loadPuzzle(body.data);
    } catch (err) {
      console.error('Failed to load next puzzle:', err);
      setError('Failed to load the next puzzle.');
    } finally {
      setLoading(false);
    }
  }, [loadPuzzle, reset]);

  useEffect(() => {
    fetchNextPuzzle();
    // Only on mount — subsequent puzzles are fetched explicitly via the
    // "Next puzzle" button once a result is shown.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleMove = (move: ChessMove) => {
    if (status === 'checking' || status === 'solved' || status === 'failed') return;
    submitMove(move.from, move.to, move.promotion, 'practice');
  };

  const isPlayerTurn =
    !!currentPuzzle &&
    !!currentGame &&
    currentGame.position.turn === currentPuzzle.sideToMove &&
    status !== 'checking' &&
    status !== 'solved' &&
    status !== 'failed';

  return (
    <div className="min-h-screen bg-surface-base flex flex-col">
      <Header />
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="mb-6 flex items-center justify-between">
            <Button variant="secondary" onClick={() => router.push('/puzzles')} className="flex items-center space-x-2">
              <ArrowLeft size={16} />
              <span>Puzzles</span>
            </Button>
            {currentPuzzle && <RatingBadge rating={currentPuzzle.rating} />}
          </div>

          {loading && <Card className="p-8 text-center text-fg-secondary">Loading puzzle...</Card>}

          {!loading && error && (
            <Card className="p-8 text-center space-y-4">
              <p className="text-fg-secondary">{error}</p>
              <Button onClick={fetchNextPuzzle}>Try again</Button>
            </Card>
          )}

          {!loading && !error && currentGame && currentPuzzle && (
            <div className="flex flex-col items-center gap-4">
              <div className="w-full max-w-2xl">
                <ChessBoard
                  position={currentGame.position.board}
                  gameVariant="unboxed"
                  onMove={handleMove}
                  currentPlayer={currentGame.position.turn}
                  isPlayerTurn={isPlayerTurn}
                  showActionButtons={false}
                  showTurnIndicator
                  showCoordinates={user?.preferences?.showCoordinates ?? true}
                  boardTheme={user?.preferences?.boardTheme ?? 'classic'}
                />
              </div>

              {status === 'solved' && (
                <Card className="p-4 text-center w-full max-w-2xl bg-status-success/10">
                  <p className="text-status-success font-semibold mb-2">Solved!</p>
                  {typeof ratingChange === 'number' && (
                    <RatingBadge rating={currentPuzzle.rating} delta={ratingChange} className="mb-3 inline-block" />
                  )}
                  <div>
                    <Button onClick={fetchNextPuzzle}>Next puzzle</Button>
                  </div>
                </Card>
              )}

              {status === 'failed' && (
                <Card className="p-4 text-center w-full max-w-2xl bg-status-danger/10">
                  <p className="text-status-danger font-semibold mb-2">Not quite — that wasn&apos;t the solution.</p>
                  {typeof ratingChange === 'number' && (
                    <RatingBadge rating={currentPuzzle.rating} delta={ratingChange} className="mb-3 inline-block" />
                  )}
                  <div>
                    <Button onClick={fetchNextPuzzle}>Next puzzle</Button>
                  </div>
                </Card>
              )}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
