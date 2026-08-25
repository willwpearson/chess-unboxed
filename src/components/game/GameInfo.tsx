/**
 * Game Info Component
 * Displays current game information like players, time, status
 */
'use client';

import React from 'react';
import { GameState, Player, TimeControl } from '@/types/game';
import { Badge } from '@/components/ui/Badge';
import { Clock, Trophy, Zap } from 'lucide-react';

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

  const getStatusDisplay = (): { text: string; variant: 'warning' | 'success' | 'info' | 'danger' | 'default' } => {
    switch (game.status) {
      case 'waiting':
        return { text: 'Waiting for players', variant: 'warning' };
      case 'active':
        return { text: 'In Progress', variant: 'success' };
      case 'paused':
        return { text: 'Paused', variant: 'warning' };
      case 'finished':
        return { text: 'Finished', variant: 'info' };
      case 'abandoned':
        return { text: 'Abandoned', variant: 'danger' };
      default:
        return { text: 'Unknown', variant: 'default' };
    }
  };

  const getResultDisplay = (): { text: string; icon: typeof Trophy; variant: 'warning' | 'default' | 'info' } | null => {
    switch (game.result) {
      case 'white-wins':
        return { text: 'White Wins', icon: Trophy, variant: 'warning' };
      case 'black-wins':
        return { text: 'Black Wins', icon: Trophy, variant: 'default' };
      case 'draw':
        return { text: 'Draw', icon: Zap, variant: 'info' };
      case 'ongoing':
        return null;
      default:
        return null;
    }
  };

  const renderPlayer = (player: Player, color: 'white' | 'black', timeRemaining?: number) => {
    const isCurrentTurn = game.position.turn === color;

    return (
      <div
        className={`relative p-3 rounded-lg transition-all duration-200 border ${
          isCurrentTurn
            ? 'bg-status-success/10 border-status-success/30 shadow-sm'
            : 'bg-surface-raised border-border-subtle'
        }`}
      >
        {/* Current turn indicator */}
        {isCurrentTurn && game.status === 'active' && (
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-status-success rounded-full animate-pulse shadow-sm" />
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 flex-1">
            <div
              className={`w-3 h-3 rounded-full ${
                color === 'white' ? 'bg-surface-raised border border-border-strong shadow-sm' : 'bg-fg'
              }`}
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2">
                <span className="font-medium text-fg truncate">{player.name}</span>
                {player.isBot && (
                  <Badge variant="info" size="sm">
                    BOT
                  </Badge>
                )}
              </div>
              {player.rating && <div className="text-xs text-fg-muted">{player.rating}</div>}
            </div>
          </div>

          {/* Timer */}
          {timeControl && timeRemaining !== undefined && (
            <div
              className={`flex items-center space-x-1 font-mono text-sm ${
                timeRemaining < 60
                  ? 'text-status-danger'
                  : timeRemaining < 300
                    ? 'text-status-warning'
                    : 'text-fg'
              }`}
            >
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
    <div className="w-full bg-surface-raised rounded-xl shadow-sm border border-border-subtle">
      {/* Header */}
      <div className="p-3 border-b border-border-subtle">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-fg">Game Info</h3>
          <Badge variant={status.variant} size="sm">
            {status.text}
          </Badge>
        </div>
      </div>

      <div className="p-3 space-y-3">
        {/* Game Result */}
        {result && (
          <div
            className={`flex items-center justify-center space-x-2 p-2.5 rounded-lg border ${
              result.variant === 'warning'
                ? 'bg-status-warning/10 border-status-warning/30 text-status-warning'
                : result.variant === 'info'
                  ? 'bg-status-info/10 border-status-info/30 text-status-info'
                  : 'bg-surface-sunken border-border-subtle text-fg-secondary'
            }`}
          >
            <result.icon size={16} />
            <span className="text-sm font-semibold">{result.text}</span>
          </div>
        )}

        {/* Players */}
        <div className="space-y-2">
          {renderPlayer(game.players.white, 'white', whiteTimeRemaining)}
          {renderPlayer(game.players.black, 'black', blackTimeRemaining)}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border-subtle">
          <div className="text-center">
            <div className="text-xs text-fg-muted">Moves</div>
            <div className="text-sm font-semibold text-fg">{game.moves.length}</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-fg-muted">Mode</div>
            <div className="text-sm font-semibold text-fg capitalize">{game.mode}</div>
          </div>
        </div>

        {/* Time Control */}
        {timeControl && (
          <div className="text-center pt-2 border-t border-border-subtle">
            <div className="text-xs text-fg-muted">Time Control</div>
            <div className="text-sm font-semibold text-fg">
              {formatTime(timeControl.initialTime)}
              {timeControl.increment > 0 && ` +${timeControl.increment}s`}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
