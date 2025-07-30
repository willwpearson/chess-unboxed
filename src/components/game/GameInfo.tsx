/**
 * Game Info Component
 * Displays current game information like players, time, status
 */
'use client';

import React from 'react';
import { GameState, Player, TimeControl } from '@/types/game';
import { Card, CardContent } from '@/components/ui/Card';
import { Clock, User, Trophy, Zap } from 'lucide-react';

interface GameInfoProps {
  game: GameState;
  timeControl?: TimeControl;
  whiteTimeRemaining?: number;
  blackTimeRemaining?: number;
}

export function GameInfo({ game, timeControl, whiteTimeRemaining, blackTimeRemaining }: GameInfoProps) {
  const formatTime = (seconds: number): string => {
    if (seconds < 0) return '0:00';
    
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusDisplay = () => {
    switch (game.status) {
      case 'waiting':
        return { text: 'Waiting for players', color: 'text-yellow-600 bg-yellow-50' };
      case 'active':
        return { text: 'In Progress', color: 'text-green-600 bg-green-50' };
      case 'paused':
        return { text: 'Paused', color: 'text-orange-600 bg-orange-50' };
      case 'finished':
        return { text: 'Finished', color: 'text-blue-600 bg-blue-50' };
      case 'abandoned':
        return { text: 'Abandoned', color: 'text-red-600 bg-red-50' };
      default:
        return { text: 'Unknown', color: 'text-gray-600 bg-gray-50' };
    }
  };

  const getResultDisplay = () => {
    switch (game.result) {
      case 'white-wins':
        return { text: 'White Wins', icon: Trophy, color: 'text-yellow-600' };
      case 'black-wins':
        return { text: 'Black Wins', icon: Trophy, color: 'text-gray-800' };
      case 'draw':
        return { text: 'Draw', icon: Zap, color: 'text-blue-600' };
      case 'ongoing':
        return null;
      default:
        return null;
    }
  };

  const renderPlayer = (player: Player, color: 'white' | 'black', timeRemaining?: number) => {
    const isCurrentTurn = game.position.turn === color;
    
    return (
      <div className={`flex items-center justify-between p-3 rounded-lg border ${
        isCurrentTurn ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'
      }`}>
        <div className="flex items-center space-x-3">
          <div className={`w-4 h-4 rounded-full ${color === 'white' ? 'bg-white border-2 border-gray-400' : 'bg-gray-800'}`} />
          <div>
            <div className="flex items-center space-x-2">
              <User size={16} />
              <span className="font-medium">{player.name}</span>
              {player.isBot && (
                <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                  BOT
                </span>
              )}
            </div>
            {player.rating && (
              <div className="text-sm text-gray-600">
                Rating: {player.rating}
              </div>
            )}
          </div>
        </div>
        
        {timeControl && timeRemaining !== undefined && (
          <div className={`flex items-center space-x-1 font-mono text-lg ${
            timeRemaining < 60 ? 'text-red-600' : timeRemaining < 300 ? 'text-orange-600' : 'text-gray-800'
          }`}>
            <Clock size={16} />
            <span>{formatTime(timeRemaining)}</span>
          </div>
        )}
        
        {isCurrentTurn && game.status === 'active' && (
          <div className="flex items-center space-x-1 text-blue-600">
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" />
            <span className="text-sm font-medium">Turn</span>
          </div>
        )}
      </div>
    );
  };

  const status = getStatusDisplay();
  const result = getResultDisplay();

  return (
    <Card className="w-full max-w-md">
      <CardContent className="p-4 space-y-4">
        {/* Game Status */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Game Info</h3>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${status.color}`}>
            {status.text}
          </span>
        </div>

        {/* Game Result */}
        {result && (
          <div className={`flex items-center justify-center space-x-2 p-3 rounded-lg border ${
            result.color.includes('yellow') ? 'bg-yellow-50 border-yellow-200' :
            result.color.includes('gray') ? 'bg-gray-50 border-gray-200' :
            'bg-blue-50 border-blue-200'
          }`}>
            <result.icon size={20} className={result.color} />
            <span className={`font-semibold ${result.color}`}>{result.text}</span>
          </div>
        )}

        {/* Players */}
        <div className="space-y-3">
          {renderPlayer(game.players.white, 'white', whiteTimeRemaining)}
          {renderPlayer(game.players.black, 'black', blackTimeRemaining)}
        </div>

        {/* Game Mode Info */}
        <div className="grid grid-cols-2 gap-4 pt-2 border-t">
          <div className="text-center">
            <div className="text-sm text-gray-600">Mode</div>
            <div className="font-medium capitalize">{game.mode}</div>
          </div>
          <div className="text-center">
            <div className="text-sm text-gray-600">Moves</div>
            <div className="font-medium">{game.moves.length}</div>
          </div>
        </div>

        {/* Time Control */}
        {timeControl && (
          <div className="text-center pt-2 border-t">
            <div className="text-sm text-gray-600">Time Control</div>
            <div className="font-medium">
              {formatTime(timeControl.initialTime)}
              {timeControl.increment > 0 && ` + ${timeControl.increment}s`}
            </div>
          </div>
        )}

        {/* Game ID */}
        <div className="text-center pt-2 border-t">
          <div className="text-xs text-gray-500">
            Game ID: {game.gameId.slice(-8)}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
