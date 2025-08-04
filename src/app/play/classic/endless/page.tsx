'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { ChessBoard } from '@/components/game/ChessBoard';
import { MoveHistory } from '@/components/game/MoveHistory';
import { GameInfo } from '@/components/game/GameInfo';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { GameState, ChessMove, Player, GamePosition } from '@/types/game';
import { useGameStore } from '@/store/gameStore';
import { ArrowLeft, Infinity, Trophy, Target, AlertTriangle, Crown } from 'lucide-react';

// Initial chess position
const INITIAL_POSITION: GamePosition = {
  board: {
    a8: { type: 'rook', color: 'black' }, b8: { type: 'knight', color: 'black' }, c8: { type: 'bishop', color: 'black' }, d8: { type: 'queen', color: 'black' },
    e8: { type: 'king', color: 'black' }, f8: { type: 'bishop', color: 'black' }, g8: { type: 'knight', color: 'black' }, h8: { type: 'rook', color: 'black' },
    a7: { type: 'pawn', color: 'black' }, b7: { type: 'pawn', color: 'black' }, c7: { type: 'pawn', color: 'black' }, d7: { type: 'pawn', color: 'black' },
    e7: { type: 'pawn', color: 'black' }, f7: { type: 'pawn', color: 'black' }, g7: { type: 'pawn', color: 'black' }, h7: { type: 'pawn', color: 'black' },
    a2: { type: 'pawn', color: 'white' }, b2: { type: 'pawn', color: 'white' }, c2: { type: 'pawn', color: 'white' }, d2: { type: 'pawn', color: 'white' },
    e2: { type: 'pawn', color: 'white' }, f2: { type: 'pawn', color: 'white' }, g2: { type: 'pawn', color: 'white' }, h2: { type: 'pawn', color: 'white' },
    a1: { type: 'rook', color: 'white' }, b1: { type: 'knight', color: 'white' }, c1: { type: 'bishop', color: 'white' }, d1: { type: 'queen', color: 'white' },
    e1: { type: 'king', color: 'white' }, f1: { type: 'bishop', color: 'white' }, g1: { type: 'knight', color: 'white' }, h1: { type: 'rook', color: 'white' },
  },
  turn: 'white',
  castling: {
    whiteKingside: true,
    whiteQueenside: true,
    blackKingside: true,
    blackQueenside: true,
  },
  halfmoveClock: 0,
  fullmoveNumber: 1,
};

export default function ClassicEndlessGamePage() {
  const router = useRouter();
  const { currentGame, setCurrentGame } = useGameStore();
  const [gameStarted, setGameStarted] = useState(false);
  const [currentScore, setCurrentScore] = useState(0);
  const [difficulty, setDifficulty] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  const handleStartEndless = async () => {
    setIsLoading(true);

    try {
      // Create players
      const humanPlayer: Player = {
        id: 'endless-player',
        name: 'You',
        color: 'white',
        isBot: false,
        rating: 1200
      };

      const botPlayer: Player = {
        id: 'endless-bot',
        name: `Opponent ${difficulty}`,
        color: 'black',
        isBot: true,
        rating: 800 + (difficulty * 200)
      };

      // Create game state
      const newGame: GameState = {
        gameId: `endless-classic-${Date.now()}`,
        mode: 'endless',
        variant: 'classic',
        status: 'active',
        result: 'ongoing',
        position: INITIAL_POSITION,
        moves: [],
        moveHistory: [],
        players: {
          white: humanPlayer,
          black: botPlayer
        },
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      setCurrentGame(newGame);
      setGameStarted(true);
      setCurrentScore(0);
      setDifficulty(1);
    } catch (error) {
      console.error('Error starting endless mode:', error);
      alert('Failed to start endless mode. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMove = (move: ChessMove) => {
    if (!currentGame) return;

    // TODO: Validate move with chess.js
    console.log('Move made:', move);
    
    // For now, just add the move to history
    const updatedGame: GameState = {
      ...currentGame,
      moves: [...currentGame.moves, move],
      position: {
        ...currentGame.position,
        turn: currentGame.position.turn === 'white' ? 'black' : 'white'
      },
      updatedAt: Date.now()
    };

    setCurrentGame(updatedGame);

    // TODO: If it's bot's turn, make bot move
    // TODO: Check for game end conditions
  };

  const handleLoss = () => {
    if (currentGame) {
      setCurrentGame({
        ...currentGame,
        status: 'finished',
        result: 'black-wins',
        updatedAt: Date.now()
      });
    }
  };

  const handleRestart = () => {
    setGameStarted(false);
    setCurrentGame(null);
    setCurrentScore(0);
    setDifficulty(1);
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
                {/* Game Mode Header */}
                <div className="gaming-card p-8 text-center bg-gradient-to-br from-amber-500/20 to-orange-600/20">
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-r from-amber-500 to-orange-600 text-white mb-6">
                    <Crown size={40} />
                  </div>
                  <h2 className="text-3xl font-gaming font-bold gaming-title mb-4">Classic Chess - Endless Mode</h2>
                  <p className="text-gaming-text-secondary text-lg">
                    Face increasingly difficult opponents in traditional chess. One loss ends your run!
                  </p>
                </div>

                <div className="gaming-card p-6">
                  <div className="flex items-center justify-center mb-4">
                    <div className="bg-purple-600 p-4 rounded-full">
                      <Infinity size={32} className="text-white" />
                    </div>
                  </div>

                  <div className="space-y-6">
                    {/* Game Rules */}
                    <div className="bg-white rounded-lg p-6 border">
                      <h3 className="text-xl font-semibold mb-4 flex items-center">
                        <Target size={20} className="mr-2 text-purple-600" />
                        How it Works
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <h4 className="font-medium mb-2">📈 Progressive Difficulty</h4>
                          <p className="text-sm text-gray-600">
                            Each opponent gets stronger as you advance. Start easy, become a grandmaster!
                          </p>
                        </div>
                        <div>
                          <h4 className="font-medium mb-2">🎯 One Shot</h4>
                          <p className="text-sm text-gray-600">
                            Lose a single game and your run is over. How far can you go?
                          </p>
                        </div>
                        <div>
                          <h4 className="font-medium mb-2">🏆 Score System</h4>
                          <p className="text-sm text-gray-600">
                            Each win adds to your score. Beat your personal best!
                          </p>
                        </div>
                        <div>
                          <h4 className="font-medium mb-2">📊 Leaderboard</h4>
                          <p className="text-sm text-gray-600">
                            Compete with others for the highest endless mode score.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Warning */}
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <div className="flex items-center space-x-2 text-yellow-800">
                        <AlertTriangle size={20} />
                        <span className="font-medium">Challenge Warning</span>
                      </div>
                      <p className="text-yellow-700 mt-2 text-sm">
                        This mode is designed to be extremely challenging. Even experienced players 
                        rarely score above 10. Are you ready for the ultimate classic chess test?
                      </p>
                    </div>

                    {/* Start Button */}
                    <div className="text-center">
                      <button
                        onClick={handleStartEndless}
                        disabled={isLoading}
                        className="gaming-button px-8 py-4 text-lg font-semibold"
                      >
                        {isLoading ? (
                          <div className="flex items-center">
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                            Starting Challenge...
                          </div>
                        ) : (
                          <div className="flex items-center">
                            <Infinity size={20} className="mr-2" />
                            Begin Endless Challenge
                          </div>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  const isGameOver = currentGame.status === 'finished';

  return (
    <>
      <Header />
      <main className="flex-1 min-h-screen" style={{ background: 'var(--gaming-bg-primary)' }}>
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-7xl mx-auto">
            {/* Header with score */}
            <div className="mb-6 flex items-center justify-between">
              <button
                onClick={handleRestart}
                className="gaming-button-secondary flex items-center space-x-2"
              >
                <ArrowLeft size={16} />
                <span>New Run</span>
              </button>

              <div className="text-center">
                <h1 className="text-2xl font-gaming font-bold text-gaming-text-primary">Classic Chess - Endless Mode</h1>
                <div className="flex items-center space-x-6 mt-2">
                  <div className="flex items-center space-x-1">
                    <Trophy size={16} className="text-yellow-600" />
                    <span className="font-semibold">Score: {currentScore}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Target size={16} className="text-blue-600" />
                    <span className="font-semibold">Opponent: Level {difficulty}</span>
                  </div>
                </div>
              </div>

              <div className="w-24"></div> {/* Spacer */}
            </div>

            {/* Game Over Overlay */}
            {isGameOver && (
              <div className="mb-6">
                <div className="gaming-card p-6 text-center border-red-200 bg-red-50">
                  <h2 className="text-2xl font-bold text-red-900 mb-2">Game Over!</h2>
                  <p className="text-red-700 mb-4">
                    Final Score: <span className="font-bold">{currentScore}</span> wins
                  </p>
                  <div className="flex items-center justify-center space-x-4">
                    <button
                      onClick={handleRestart}
                      className="gaming-button"
                    >
                      <Infinity size={16} className="mr-2" />
                      Try Again
                    </button>
                    <button
                      onClick={() => router.push('/leaderboard')}
                      className="gaming-button-secondary"
                    >
                      <Trophy size={16} className="mr-2" />
                      View Leaderboard
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Game Board */}
              <div className="lg:col-span-2 flex justify-center">
                <ChessBoard
                  position={currentGame.position.board}
                  onMove={handleMove}
                  onResign={handleLoss}
                  currentPlayer={currentGame.position.turn}
                  isPlayerTurn={currentGame.position.turn === 'white' && !isGameOver}
                  showCoordinates={true}
                  boardTheme="classic"
                  gameVariant="classic"
                />
              </div>

              {/* Game Info and History */}
              <div className="space-y-6">
                <div className="gaming-card p-4">
                  <GameInfo game={currentGame} />
                </div>
                
                <div className="gaming-card p-4">
                  <MoveHistory moves={currentGame.moves} />
                </div>

                {/* Progress Card */}
                <div className="gaming-card p-4 bg-purple-50 border-purple-200">
                  <h3 className="font-gaming font-semibold text-purple-900 mb-4">Challenge Progress</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span>Current Opponent:</span>
                      <span className="font-semibold">Level {difficulty}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Bot Rating:</span>
                      <span className="font-semibold">{800 + (difficulty * 200)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Wins This Run:</span>
                      <span className="font-semibold text-green-600">{currentScore}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}