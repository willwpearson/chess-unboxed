'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { ChessBoard } from '@/components/game/ChessBoard';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { RatingBadge } from '@/components/ui/RatingBadge';
import { useGameStore } from '@/store/gameStore';
import { usePuzzleStore } from '@/store/puzzleStore';
import { useUserStore } from '@/store/userStore';
import type { ChessMove } from '@/types/game';
import { ArrowLeft } from 'lucide-react';

interface DailyPuzzleData {
  puzzleId: string;
  startingFen: string;
  sideToMove: 'white' | 'black';
  isWraparoundMode: boolean;
  rating: number;
  date: string;
  attempted: boolean;
  solved: boolean | null;
}

export default function DailyPuzzlePage() {
  const router = useRouter();
  const { currentGame } = useGameStore();
  const { currentPuzzle, status, ratingChange, loadPuzzle, submitMove } = usePuzzleStore();
  const { user } = useUserStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dailyMeta, setDailyMeta] = useState<DailyPuzzleData | null>(null);

  const fetchDaily = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/puzzles/daily', { credentials: 'include' });
      const body = await response.json();
      if (!body.success) {
        setError(body.error || 'No daily puzzle available right now.');
        return;
      }
      setDailyMeta(body.data);
      if (!body.data.attempted) {
        loadPuzzle(body.data);
      }
    } catch (err) {
      console.error('Failed to load daily puzzle:', err);
      setError('Failed to load the daily puzzle.');
    } finally {
      setLoading(false);
    }
  }, [loadPuzzle]);

  useEffect(() => {
    fetchDaily();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleMove = (move: ChessMove) => {
    if (status === 'checking' || status === 'solved' || status === 'failed') return;
    submitMove(move.from, move.to, move.promotion, 'daily');
  };

  const isPlayerTurn =
    !!currentPuzzle &&
    !!currentGame &&
    currentGame.position.turn === currentPuzzle.sideToMove &&
    status !== 'checking' &&
    status !== 'solved' &&
    status !== 'failed';

  const alreadyAttempted = dailyMeta?.attempted && !currentPuzzle;

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
            <div className="flex items-center gap-2">
              <Badge variant="info">Daily · {dailyMeta?.date}</Badge>
              {dailyMeta && <RatingBadge rating={dailyMeta.rating} />}
            </div>
          </div>

          {loading && <Card className="p-8 text-center text-fg-secondary">Loading today&apos;s puzzle...</Card>}

          {!loading && error && (
            <Card className="p-8 text-center space-y-4">
              <p className="text-fg-secondary">{error}</p>
            </Card>
          )}

          {!loading && !error && alreadyAttempted && (
            <Card className="p-8 text-center space-y-2">
              <p className="text-fg font-semibold">
                {dailyMeta?.solved ? "You already solved today's puzzle." : "You already attempted today's puzzle."}
              </p>
              <p className="text-fg-secondary text-sm">Come back tomorrow for a new one.</p>
            </Card>
          )}

          {!loading && !error && !alreadyAttempted && currentGame && currentPuzzle && (
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
                  {typeof ratingChange === 'number' && currentPuzzle && (
                    <RatingBadge rating={currentPuzzle.rating} delta={ratingChange} />
                  )}
                </Card>
              )}

              {status === 'failed' && (
                <Card className="p-4 text-center w-full max-w-2xl bg-status-danger/10">
                  <p className="text-status-danger font-semibold mb-2">Not quite — that wasn&apos;t the solution.</p>
                  {typeof ratingChange === 'number' && currentPuzzle && (
                    <RatingBadge rating={currentPuzzle.rating} delta={ratingChange} />
                  )}
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
