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
import { BotConfig, GameState, ChessMove, Player, GamePosition } from '@/types/game';
import { useGameStore } from '@/store/gameStore';
import { ArrowLeft } from 'lucide-react';

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

export default function BotGamePage() {
  const router = useRouter();
  const { currentGame, setCurrentGame } = useGameStore();
  const [gameStarted, setGameStarted] = useState(false);
  const [botConfig, setBotConfig] = useState<BotConfig | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleStartGame = async (config: BotConfig) => {
    setIsLoading(true);
    setBotConfig(config);

    try {
      // Create players
      const humanPlayer: Player = {
        id: 'human-player',
        name: 'You',
        color: 'white',
        isBot: false,
        rating: 1200
      };

      const botPlayer: Player = {
        id: 'bot-player',
        name: `Bot (${config.difficulty})`,
        color: 'black',
        isBot: true,
        rating: config.difficulty === 'easy' ? 800 : 
               config.difficulty === 'medium' ? 1200 :
               config.difficulty === 'hard' ? 1600 : 2000
      };

      // Create game state
      const newGame: GameState = {
        gameId: `bot-game-${Date.now()}`,
        mode: 'bot',
        status: 'active',
        result: 'ongoing',
        position: INITIAL_POSITION,
        moves: [],
        players: {
          white: humanPlayer,
          black: botPlayer
        },
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      setCurrentGame(newGame);
      setGameStarted(true);
    } catch (error) {
      console.error('Error starting bot game:', error);
      alert('Failed to start game. Please try again.');
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
  };

  const handleResign = () => {
    if (confirm('Are you sure you want to resign?')) {
      if (currentGame) {
        setCurrentGame({
          ...currentGame,
          status: 'finished',
          result: 'black-wins',
          updatedAt: Date.now()
        });
      }
    }
  };

  const handleNewGame = () => {
    setGameStarted(false);
    setCurrentGame(null);
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
            
            <BotDifficultySelector
              onStartGame={handleStartGame}
              isLoading={isLoading}
            />
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

            <h1 className="text-2xl font-bold">
              Playing vs {botConfig?.difficulty} Bot
            </h1>

            <div className="w-24"></div> {/* Spacer for centering */}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Game Board */}
            <div className="lg:col-span-2 flex justify-center">
              <ChessBoard
                position={currentGame.position.board}
                onMove={handleMove}
                onResign={handleResign}
                currentPlayer={currentGame.position.turn}
                isPlayerTurn={currentGame.position.turn === 'white'}
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
