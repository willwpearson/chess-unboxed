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
import { ArrowLeft } from 'lucide-react';

export default function BotGamePage() {
  const router = useRouter();
  const { currentGame, initializeGame, makeMove, resignGame, offerDraw } = useGameStore();
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
        <main className="flex-1 container mx-auto px-4 py-8">
          <div className="max-w-6xl mx-auto">
            <div className="mb-6">
              <Button
                variant="outline"
                onClick={() => router.push('/')}
                className="flex items-center space-x-2"
              >
                <ArrowLeft size={16} />
                <span>Back to Home</span>
              </Button>
            </div>
            
            <div className="space-y-6">
              {/* Game Variant Selection */}
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">Select Game Variant</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button
                    onClick={() => setGameVariant('classic')}
                    className={`p-4 border-2 rounded-lg text-left transition-all ${
                      gameVariant === 'classic' 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <h3 className="font-semibold text-lg">Classic Chess</h3>
                    <p className="text-gray-600 text-sm mt-1">
                      Traditional chess with standard rules
                    </p>
                  </button>
                  
                  <button
                    onClick={() => setGameVariant('unboxed')}
                    className={`p-4 border-2 rounded-lg text-left transition-all ${
                      gameVariant === 'unboxed' 
                        ? 'border-purple-500 bg-purple-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <h3 className="font-semibold text-lg">Chess Unboxed</h3>
                    <p className="text-gray-600 text-sm mt-1">
                      Pieces can move across board edges - toroidal topology
                    </p>
                  </button>
                </div>
              </Card>

              <BotDifficultySelector
                onStartGame={handleStartGame}
                isLoading={isLoading}
              />
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
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6 flex items-center justify-between">
            <Button
              variant="outline"
              onClick={handleNewGame}
              className="flex items-center space-x-2"
            >
              <ArrowLeft size={16} />
              <span>New Game</span>
            </Button>

            <div className="text-center">
              <h1 className="text-2xl font-bold">
                {currentGame.variant === 'unboxed' ? 'Chess Unboxed' : 'Classic Chess'} vs {botConfig?.difficulty} Bot
              </h1>
              {currentGame.status === 'finished' && (
                <div className={`mt-2 text-lg font-semibold ${
                  currentGame.result === 'white-wins' ? 'text-green-600' :
                  currentGame.result === 'black-wins' ? 'text-red-600' : 'text-yellow-600'
                }`}>
                  {currentGame.result === 'white-wins' ? 'You Win!' :
                   currentGame.result === 'black-wins' ? 'Bot Wins!' : 'Draw!'}
                  {currentGame.endReason && (
                    <span className="text-sm text-gray-600 ml-2">
                      ({currentGame.endReason.replace('-', ' ')})
                    </span>
                  )}
                </div>
              )}
            </div>

            <div className="w-24"></div> {/* Spacer for centering */}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Game Board */}
            <div className="lg:col-span-2 flex justify-center">
              <ChessBoard
                position={currentGame.position.board}
                gameVariant={currentGame.variant}
                onMove={handleMove}
                onResign={handleResign}
                onOfferDraw={handleOfferDraw}
                currentPlayer={currentGame.position.turn}
                isPlayerTurn={currentGame.position.turn === 'white' && currentGame.status === 'active'}
                showCoordinates={true}
                boardTheme="classic"
              />
            </div>

            {/* Game Info and History */}
            <div className="space-y-6">
              <GameInfo
                game={currentGame}
              />
              
              <MoveHistory
                moves={currentGame.moves}
              />
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
