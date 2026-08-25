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
      <div className={`relative p-3 rounded-lg transition-all duration-200 ${
        isCurrentTurn 
          ? 'bg-green-50 border border-green-200 shadow-sm' 
          : 'bg-white border border-gray-200'
      }`}>
        {/* Current turn indicator */}
        {isCurrentTurn && game.status === 'active' && (
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse shadow-sm" />
        )}
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 flex-1">
            <div className={`w-3 h-3 rounded-full ${
              color === 'white' ? 'bg-white border border-gray-400 shadow-sm' : 'bg-gray-800'
            }`} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2">
                <span className="font-medium text-gray-900 truncate">{player.name}</span>
                {player.isBot && (
                  <span className="text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded font-medium">
                    BOT
                  </span>
                )}
              </div>
              {player.rating && (
                <div className="text-xs text-gray-500">
                  {player.rating}
                </div>
              )}
            </div>
          </div>
          
          {/* Timer */}
          {timeControl && timeRemaining !== undefined && (
            <div className={`flex items-center space-x-1 font-mono text-sm ${
              timeRemaining < 60 ? 'text-red-600' : timeRemaining < 300 ? 'text-orange-600' : 'text-gray-800'
            }`}>
              <Clock size={14} />
              <span>{formatTime(timeRemaining)}</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  const status = getStatusDisplay();
  const result = getResultDisplay();

  return (
    <div className="w-full bg-white rounded-xl shadow-sm border border-gray-200">
      {/* Header */}
      <div className="p-3 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900">Game Info</h3>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${status.color}`}>
            {status.text}
          </span>
        </div>
      </div>

      <div className="p-3 space-y-3">
        {/* Game Result */}
        {result && (
          <div className={`flex items-center justify-center space-x-2 p-2.5 rounded-lg ${
            result.color.includes('yellow') ? 'bg-yellow-50 border border-yellow-200' :
            result.color.includes('gray') ? 'bg-gray-50 border border-gray-200' :
            'bg-blue-50 border border-blue-200'
          }`}>
            <result.icon size={16} className={result.color} />
            <span className={`text-sm font-semibold ${result.color}`}>{result.text}</span>
          </div>
        )}

        {/* Players */}
        <div className="space-y-2">
          {renderPlayer(game.players.white, 'white', whiteTimeRemaining)}
          {renderPlayer(game.players.black, 'black', blackTimeRemaining)}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-100">
          <div className="text-center">
            <div className="text-xs text-gray-500">Moves</div>
            <div className="text-sm font-semibold text-gray-900">{game.moves.length}</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-gray-500">Mode</div>
            <div className="text-sm font-semibold text-gray-900 capitalize">{game.mode}</div>
          </div>
        </div>

        {/* Time Control */}
        {timeControl && (
          <div className="text-center pt-2 border-t border-gray-100">
            <div className="text-xs text-gray-500">Time Control</div>
            <div className="text-sm font-semibold text-gray-900">
              {formatTime(timeControl.initialTime)}
              {timeControl.increment > 0 && ` +${timeControl.increment}s`}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
