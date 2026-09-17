'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { BotDifficultySelector } from '@/components/game/BotDifficultySelector';
import { ChessBoard } from '@/components/game/ChessBoard';
import { MoveHistory } from '@/components/game/MoveHistory';
import { GameInfo } from '@/components/game/GameInfo';
import { GameOverModal } from '@/components/game/GameOverModal';
import { BotConfig, GameState, ChessMove, Player } from '@/types/game';
import { useGameStore } from '@/store/gameStore';
import { useUserStore } from '@/store/userStore';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ArrowLeft, Bot } from 'lucide-react';

export default function UnboxedBotGamePage() {
  const router = useRouter();
  const { currentGame, initializeGame, makeMove, resignGame, offerDraw, getCurrentFEN } = useGameStore();
  const { user } = useUserStore();
  const [gameStarted, setGameStarted] = useState(false);
  const [botConfig, setBotConfig] = useState<BotConfig | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showGameOverModal, setShowGameOverModal] = useState(false);
  const prevStatusRef = useRef(currentGame?.status);

  useEffect(() => {
    if (currentGame?.status === 'finished' && prevStatusRef.current !== 'finished') {
      setShowGameOverModal(true);
    }
    prevStatusRef.current = currentGame?.status;
  }, [currentGame?.status]);

  const handleStartGame = async (config: BotConfig) => {
    setIsLoading(true);
    setBotConfig(config);

    try {
      const success = await initializeGame('bot', 'unboxed', config);
      
      if (success) {
        setGameStarted(true);
      } else {
        alert('Failed to start game. Please try again.');
      }
    } catch (error) {
      console.error('Error starting bot game:', error);
      alert('Failed to start game. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMove = async (move: ChessMove) => {
    if (!currentGame) return;

    console.log('handleMove called with:', move);
    console.log('Current game turn:', currentGame.position.turn);
    console.log('Current game status:', currentGame.status);
    try {
      const success = await makeMove(move.from, move.to, move.promotion);
      console.log('makeMove result:', success);
      if (!success) {
        console.warn('Move rejected by game manager');
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

  const handleNewGame = () => {
    setGameStarted(false);
    setBotConfig(null);
    setShowGameOverModal(false);
  };

  if (!gameStarted || !currentGame) {
    return (
      <>
        <Header />
        <main className="flex-1 min-h-screen bg-surface-base">
          <div className="container mx-auto px-4 py-8">
            <div className="max-w-4xl mx-auto">
              <div className="mb-8">
                <Button
                  variant="secondary"
                  onClick={() => router.push('/')}
                  className="flex items-center space-x-2"
                >
                  <ArrowLeft size={16} />
                  <span>Back to Home</span>
                </Button>
              </div>

              <div className="space-y-8">
                {/* Game Mode Header */}
                <Card className="p-4 text-center bg-accent-primary/10">
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-accent-primary text-accent-primary-foreground mb-6">
                    <Bot size={40} />
                  </div>
                  <h2 className="text-3xl font-bold text-fg">Play vs. Bot</h2>
                </Card>

                <BotDifficultySelector
                  onStartGame={handleStartGame}
                  isLoading={isLoading}
                />
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-surface-base">
      {/* Modern Header - Purple theme for Unboxed */}
      <div className="bg-surface-raised border-b border-border-subtle">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-[1fr_auto_1fr] items-center min-h-16 py-2 gap-2">
            <div className="justify-self-start">
              <button
                onClick={handleNewGame}
                className="flex items-center space-x-2 px-3 py-2 text-sm text-fg-secondary hover:text-fg transition-colors"
              >
                <ArrowLeft size={16} />
                <span>New Game</span>
              </button>
            </div>

            <div className="justify-self-center text-center">
              <h1 className="text-lg font-semibold text-fg flex items-center justify-center flex-wrap gap-x-2 gap-y-1">
                <span>{botConfig?.difficulty} Bot</span>
                <Badge variant="info" size="sm">Unboxed</Badge>
              </h1>
            </div>

            <div />
          </div>
        </div>
      </div>

      {/* Main Game Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Chess Board - Main Focus */}
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
                isPlayerTurn={currentGame.position.turn === 'white' && currentGame.status === 'active'}
                showCoordinates={user?.preferences?.showCoordinates ?? true}
                boardTheme={user?.preferences?.boardTheme ?? "classic"}
              />
            </div>
          </div>

          {/* Side Panel - Modern and Compact */}
          <div className="w-full lg:w-80 space-y-4">
            <GameInfo game={currentGame} />
            <MoveHistory
              moves={currentGame.moves}
              isWraparoundMode={true}
            />
          </div>
        </div>
      </div>

      <GameOverModal
        isOpen={showGameOverModal}
        onClose={() => setShowGameOverModal(false)}
        result={currentGame.result}
        endReason={currentGame.endReason}
        perspective="white"
        onNewGame={handleNewGame}
      />
    </div>
  );
}