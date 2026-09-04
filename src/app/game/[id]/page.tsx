'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { ChessBoard } from '@/components/game/ChessBoard';
import { MoveHistory } from '@/components/game/MoveHistory';
import { GameInfo } from '@/components/game/GameInfo';
import { ChessMove } from '@/types/game';
import { useGameStore } from '@/store/gameStore';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { LoadingSpinner } from '@/components/ui/Loading';
import { ArrowLeft, Users } from 'lucide-react';

export default function MultiplayerGamePage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const {
    currentGame,
    myColor,
    drawOfferedBy,
    initializeMultiplayerGame,
    unsubscribeFromGame,
    makeMove,
    resignGame,
    offerDraw,
    acceptDraw,
    getCurrentFEN,
  } = useGameStore();

  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated || !user) {
      router.push('/login');
      return;
    }

    let cancelled = false;
    initializeMultiplayerGame(params.id, user.id).then((success) => {
      if (cancelled) return;
      setStatus(success ? 'ready' : 'error');
    });

    return () => {
      cancelled = true;
      unsubscribeFromGame();
    };
  }, [authLoading, isAuthenticated, user, params.id, initializeMultiplayerGame, unsubscribeFromGame]);

  const handleMove = async (move: ChessMove) => {
    try {
      const success = await makeMove(move.from, move.to, move.promotion);
      if (!success) {
        console.warn('Move rejected');
      }
    } catch (error) {
      console.error('Error making move:', error);
    }
  };

  const handleResign = () => {
    if (confirm('Are you sure you want to resign?')) {
      resignGame();
    }
  };

  const handleOfferDraw = () => {
    if (confirm('Do you want to offer a draw?')) {
      offerDraw();
    }
  };

  if (authLoading || status === 'loading') {
    return (
      <>
        <Header />
        <main className="flex-1 min-h-screen flex items-center justify-center bg-surface-base">
          <LoadingSpinner size="lg" />
        </main>
        <Footer />
      </>
    );
  }

  if (status === 'error' || !currentGame || !myColor) {
    return (
      <>
        <Header />
        <main className="flex-1 min-h-screen flex items-center justify-center bg-surface-base">
          <Card className="p-8 text-center max-w-md">
            <p className="text-status-danger mb-4">Couldn&apos;t load this game.</p>
            <Button onClick={() => router.push('/dashboard')}>Back to Dashboard</Button>
          </Card>
        </main>
        <Footer />
      </>
    );
  }

  const opponentOffered = drawOfferedBy !== null && drawOfferedBy !== myColor;

  return (
    <div className="min-h-screen bg-surface-base">
      <div className="bg-surface-raised border-b border-border-subtle">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <button
              onClick={() => router.push('/dashboard')}
              className="flex items-center space-x-2 px-3 py-2 text-sm text-fg-secondary hover:text-fg transition-colors"
            >
              <ArrowLeft size={16} />
              <span>Leave</span>
            </button>

            <div className="text-center">
              <h1 className="text-lg font-semibold text-fg flex items-center justify-center space-x-2">
                <Users size={18} />
                <span>You are {myColor === 'white' ? 'White' : 'Black'}</span>
                <Badge variant="info" size="sm">Unboxed</Badge>
              </h1>
              {currentGame.status === 'finished' && (
                <div
                  className={`text-sm font-medium ${
                    currentGame.result === `${myColor}-wins`
                      ? 'text-status-success'
                      : currentGame.result === 'draw'
                      ? 'text-status-warning'
                      : 'text-status-danger'
                  }`}
                >
                  {currentGame.result === 'white-wins'
                    ? '1-0 White won'
                    : currentGame.result === 'black-wins'
                    ? '0-1 Black won'
                    : '½-½ Draw'}
                  {currentGame.endReason && (
                    <span className="text-fg-muted ml-1">({currentGame.endReason.replace('-', ' ')})</span>
                  )}
                </div>
              )}
            </div>

            <div className="w-24"></div>
          </div>
        </div>
      </div>

      {opponentOffered && currentGame.status !== 'finished' && (
        <div className="bg-accent-primary/10 border-b border-accent-primary/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-center gap-4">
            <span className="text-sm text-fg">Your opponent offered a draw.</span>
            <Button size="sm" onClick={() => acceptDraw()}>Accept</Button>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1 flex justify-center items-start">
            <div className="w-full max-w-2xl">
              <ChessBoard
                position={currentGame.position.board}
                fen={getCurrentFEN() || undefined}
                gameVariant="unboxed"
                onMove={handleMove}
                onResign={handleResign}
                onOfferDraw={handleOfferDraw}
                currentPlayer={currentGame.position.turn}
                isPlayerTurn={currentGame.position.turn === myColor && currentGame.status === 'active'}
                showCoordinates
                boardTheme="classic"
              />
            </div>
          </div>

          <div className="w-full lg:w-80 space-y-4">
            <GameInfo game={currentGame} />
            <MoveHistory moves={currentGame.moves} isWraparoundMode={true} />
          </div>
        </div>
      </div>
    </div>
  );
}
