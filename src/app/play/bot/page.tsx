'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { BotDifficultySelector } from '@/components/game/BotDifficultySelector';
import { ChessBoard } from '@/components/game/ChessBoard';
import { MoveHistory } from '@/components/game/MoveHistory';
import { GameInfo } from '@/components/game/GameInfo';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { BotConfig, GameState, ChessMove, Player, GameVariant } from '@/types/game';
import { useGameStore } from '@/store/gameStore';
import { useUserStore } from '@/store/userStore';
import { ArrowLeft } from 'lucide-react';

export default function BotGamePage() {
  const router = useRouter();
  const { currentGame, initializeGame, makeMove, resignGame, offerDraw, getCurrentFEN } = useGameStore();
  const { user } = useUserStore();
  const [gameStarted, setGameStarted] = useState(false);
  const [botConfig, setBotConfig] = useState<BotConfig | null>(null);
  const [gameVariant, setGameVariant] = useState<GameVariant>('classic');
  const [isLoading, setIsLoading] = useState(false);

  const handleStartGame = async (config: BotConfig) => {
    setIsLoading(true);
    setBotConfig(config);

    try {
      const success = await initializeGame('bot', gameVariant, config);
      
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
  };

  if (!gameStarted || !currentGame) {
    return (
      <>
        <Header />
        <main className="flex-1 min-h-screen" style={{ background: 'var(--gaming-bg-primary)' }}>
          <div className="container mx-auto px-4 py-8">
            <div className="max-w-4xl mx-auto">
              <div className="mb-8">
                <button
                  onClick={() => router.push('/')}
                  className="gaming-button-secondary flex items-center space-x-2"
                >
                  <ArrowLeft size={16} />
                  <span>Back to Home</span>
                </button>
              </div>
              
              <div className="space-y-8">
                {/* Game Variant Selection */}
                <div className="gaming-card p-8">
                  <h2 className="text-3xl font-gaming font-bold gaming-title mb-6 text-center">Select Game Variant</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <button
                      onClick={() => setGameVariant('classic')}
                      className={`gaming-card gaming-glow p-6 text-left transition-all ${
                        gameVariant === 'classic' 
                          ? 'border-gaming-accent-primary bg-gaming-accent-primary/10' 
                          : 'hover:border-gaming-accent-primary/50'
                      }`}
                    >
                      <h3 className="font-gaming font-bold text-xl text-gaming-text-primary mb-2">Classic Chess</h3>
                      <p className="text-gaming-text-secondary">
                        Traditional chess with standard 8x8 board rules and classic gameplay
                      </p>
                    </button>
                    
                    <button
                      onClick={() => setGameVariant('unboxed')}
                      className={`gaming-card gaming-glow p-6 text-left transition-all ${
                        gameVariant === 'unboxed' 
                          ? 'border-gaming-accent-primary bg-gaming-accent-primary/10' 
                          : 'hover:border-gaming-accent-primary/50'
                      }`}
                    >
                      <h3 className="font-gaming font-bold text-xl text-gaming-text-primary mb-2">Chess Unboxed</h3>
                      <p className="text-gaming-text-secondary">
                        Revolutionary toroidal chess - pieces wrap around board edges for infinite possibilities
                      </p>
                    </button>
                  </div>
                </div>

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
    <>
      <Header />
      <main className="flex-1 min-h-screen" style={{ background: 'var(--gaming-bg-primary)' }}>
        <div className="container mx-auto px-4 py-4">
          {/* Top Bar - Minimal */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={handleNewGame}
              className="gaming-button-secondary flex items-center space-x-2"
            >
              <ArrowLeft size={16} />
              <span>New Game</span>
            </button>

            <div className="text-center">
              <h1 className="text-xl font-gaming font-bold text-gaming-text-primary">
                {currentGame.variant === 'unboxed' ? 'Chess Unboxed' : 'Classic Chess'} vs {botConfig?.difficulty} Bot
              </h1>
              {currentGame.status === 'finished' && (
                <div className={`mt-1 text-lg font-gaming font-bold ${
                  currentGame.result === 'white-wins' ? 'text-gaming-accent-secondary' :
                  currentGame.result === 'black-wins' ? 'text-gaming-accent-danger' : 'text-yellow-500'
                }`}>
                  {currentGame.result === 'white-wins' ? 'Victory!' :
                   currentGame.result === 'black-wins' ? 'Defeat!' : 'Draw!'}
                  {currentGame.endReason && (
                    <span className="text-sm text-gaming-text-secondary ml-2">
                      ({currentGame.endReason.replace('-', ' ')})
                    </span>
                  )}
                </div>
              )}
            </div>

            <div className="w-32"></div> {/* Spacer for centering */}
          </div>

          {/* Main Game Layout - Board Dominant */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 h-[calc(100vh-12rem)] min-h-[500px]">
            {/* Chess Board - Takes majority of space */}
            <div className="lg:col-span-3 flex items-center justify-center">
              <div className="w-full max-w-2xl lg:max-w-3xl">
                <ChessBoard
                  position={currentGame.position.board}
                  fen={getCurrentFEN() || undefined}
                  gameVariant={currentGame.variant}
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

            {/* Side Panel - Game Info and History */}
            <div className="lg:col-span-1 space-y-4 overflow-y-auto max-h-[500px] lg:max-h-none">
              <div className="gaming-card p-3 lg:p-4">
                <GameInfo game={currentGame} />
              </div>
              
              <div className="gaming-card p-3 lg:p-4">
                <MoveHistory moves={currentGame.moves} />
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
