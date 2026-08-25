'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { BotDifficultySelector } from '@/components/game/BotDifficultySelector';
import { ChessBoard } from '@/components/game/ChessBoard';
import { MoveHistory } from '@/components/game/MoveHistory';
import { GameInfo } from '@/components/game/GameInfo';
import { BotConfig, GameState, ChessMove, Player } from '@/types/game';
import { useGameStore } from '@/store/gameStore';
import { useUserStore } from '@/store/userStore';
import { ArrowLeft, Zap } from 'lucide-react';

export default function UnboxedBotGamePage() {
  const router = useRouter();
  const { currentGame, initializeGame, makeMove, resignGame, offerDraw, getCurrentFEN } = useGameStore();
  const { user } = useUserStore();
  const [gameStarted, setGameStarted] = useState(false);
  const [botConfig, setBotConfig] = useState<BotConfig | null>(null);
  const [isLoading, setIsLoading] = useState(false);

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
  };

  if (!gameStarted || !currentGame) {
    return (
      <>
        <Header />
        <main className="flex-1 min-h-screen bg-background">
          <div className="container mx-auto px-4 py-8">
            <div className="max-w-4xl mx-auto">
              <div className="mb-8">
                <button
                  onClick={() => router.push('/')}
                  className="gaming-button flex items-center space-x-2"
                >
                  <ArrowLeft size={16} />
                  <span>Back to Home</span>
                </button>
              </div>
              
              <div className="space-y-8">
                {/* Game Mode Header */}
                <div className="gaming-card p-8 text-center bg-gradient-to-br from-purple-500/20 to-pink-600/20">
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-r from-purple-500 to-pink-600 text-white mb-6">
                    <Zap size={40} />
                  </div>
                  <h2 className="text-3xl font-gaming font-bold gaming-title mb-4">Chess Unboxed vs Bot</h2>
                  <p className="text-gaming-text-secondary text-lg">
                    Revolutionary toroidal chess - pieces wrap around board edges for infinite possibilities.
                  </p>
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
    <div className="min-h-screen bg-gray-50">
      {/* Modern Header - Purple theme for Unboxed */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <button
              onClick={handleNewGame}
              className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft size={16} />
              <span>New Game</span>
            </button>

            <div className="text-center">
              <h1 className="text-lg font-semibold text-gray-900 flex items-center justify-center space-x-2">
                <span>Chess Unboxed vs {botConfig?.difficulty} Bot</span>
                <div className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-medium">
                  Unboxed
                </div>
              </h1>
              {currentGame.status === 'finished' && (
                <div className={`text-sm font-medium ${
                  currentGame.result === 'white-wins' ? 'text-green-600' :
                  currentGame.result === 'black-wins' ? 'text-red-600' : 'text-yellow-600'
                }`}>
                  {currentGame.result === 'white-wins' ? '1-0 You won!' :
                   currentGame.result === 'black-wins' ? '0-1 You lost' : '½-½ Draw'}
                  {currentGame.endReason && (
                    <span className="text-gray-500 ml-1">
                      ({currentGame.endReason.replace('-', ' ')})
                    </span>
                  )}
                </div>
              )}
            </div>

            <div className="w-24"></div> {/* Spacer for centering */}
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
    </div>
  );
}