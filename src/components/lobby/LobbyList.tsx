/**
 * Lobby List Component
 * Displays available lobbies for multiplayer games
 */
'use client';

import React, { useState } from 'react';
import { Lobby, TimeControl } from '@/types/game';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Users, Lock, Crown, Clock, Plus, RefreshCw } from 'lucide-react';

interface LobbyListProps {
  lobbies: Lobby[];
  onJoinLobby: (lobbyId: string) => void;
  onCreateLobby: () => void;
  onRefresh: () => void;
  isLoading?: boolean;
}

export function LobbyList({ lobbies, onJoinLobby, onCreateLobby, onRefresh, isLoading }: LobbyListProps) {
  const [selectedLobby, setSelectedLobby] = useState<string | null>(null);

  const formatTimeControl = (timeControl?: TimeControl): string => {
    if (!timeControl) return 'No time limit';
    
    const minutes = Math.floor(timeControl.initialTime / 60);
    const increment = timeControl.increment;
    
    return `${minutes}+${increment}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'waiting':
        return 'bg-green-100 text-green-800';
      case 'full':
        return 'bg-blue-100 text-blue-800';
      case 'in-game':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'waiting':
        return 'Waiting for player';
      case 'full':
        return 'Game full';
      case 'in-game':
        return 'Game in progress';
      default:
        return status;
    }
  };

  const renderLobby = (lobby: Lobby) => {
    const canJoin = lobby.status === 'waiting';
    const isSelected = selectedLobby === lobby.id;

    return (
      <div
        key={lobby.id}
        className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
          isSelected ? 'ring-2 ring-blue-500 ring-offset-2' : ''
        }`}
        onClick={() => setSelectedLobby(lobby.id)}
      >
        <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-1">
                {lobby.isPrivate && <Lock size={16} className="text-gray-500" />}
                <h3 className="font-semibold text-lg">{lobby.name}</h3>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(lobby.status)}`}>
                {getStatusText(lobby.status)}
              </span>
            </div>
            
            <div className="flex items-center space-x-2">
              <Users size={16} className="text-gray-500" />
              <span className="text-sm text-gray-600">
                {lobby.guest ? '2/2' : '1/2'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-3">
            {/* Host */}
            <div className="flex items-center space-x-2">
              <Crown size={16} className="text-yellow-500" />
              <div>
                <div className="text-sm font-medium">{lobby.host.name}</div>
                {lobby.host.rating && (
                  <div className="text-xs text-gray-500">Rating: {lobby.host.rating}</div>
                )}
              </div>
            </div>

            {/* Guest */}
            <div className="flex items-center space-x-2">
              <Users size={16} className="text-gray-500" />
              <div>
                {lobby.guest ? (
                  <>
                    <div className="text-sm font-medium">{lobby.guest.name}</div>
                    {lobby.guest.rating && (
                      <div className="text-xs text-gray-500">Rating: {lobby.guest.rating}</div>
                    )}
                  </>
                ) : (
                  <div className="text-sm text-gray-500 italic">Waiting for player...</div>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between text-sm text-gray-600">
            <div className="flex items-center space-x-1">
              <Clock size={14} />
              <span>{formatTimeControl(lobby.timeControl)}</span>
            </div>
            
            <div className="capitalize">
              {lobby.gameMode} mode
            </div>
          </div>

          {isSelected && canJoin && (
            <div className="mt-4 pt-3 border-t">
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  onJoinLobby(lobby.id);
                }}
                className="w-full bg-green-600 hover:bg-green-700 text-white"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Joining...
                  </div>
                ) : (
                  'Join Lobby'
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
      </div>
    );
  };

  if (lobbies.length === 0) {
    return (
      <div className="w-full max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Multiplayer Lobbies</h2>
          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              onClick={onRefresh}
              disabled={isLoading}
              className="flex items-center space-x-2"
            >
              <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
              <span>Refresh</span>
            </Button>
            <Button
              onClick={onCreateLobby}
              className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus size={16} />
              <span>Create Lobby</span>
            </Button>
          </div>
        </div>

        <Card>
          <CardContent className="p-12 text-center">
            <Users size={64} className="mx-auto mb-4 text-gray-400" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Active Lobbies</h3>
            <p className="text-gray-600 mb-6">
              Be the first to create a lobby and start playing with others!
            </p>
            <Button
              onClick={onCreateLobby}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3"
            >
              <Plus size={20} className="mr-2" />
              Create Your First Lobby
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Multiplayer Lobbies</h2>
          <p className="text-gray-600">Join an existing lobby or create your own</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            onClick={onRefresh}
            disabled={isLoading}
            className="flex items-center space-x-2"
          >
            <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </Button>
          <Button
            onClick={onCreateLobby}
            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus size={16} />
            <span>Create Lobby</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {lobbies.map(renderLobby)}
      </div>

      {selectedLobby && (
        <div className="mt-6 text-center text-sm text-gray-600">
          <p>💡 Click on a lobby to select it, then click "Join Lobby" to enter the game</p>
        </div>
      )}
    </div>
  );
}
