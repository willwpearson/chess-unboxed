'use client';

import React, { useState, useEffect } from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { LobbyList } from '@/components/lobby/LobbyList';
import { CreateLobbyModal } from '@/components/lobby/CreateLobbyModal';
import { Lobby, GameMode, TimeControl } from '@/types/game';

// Mock data for demonstration
const MOCK_LOBBIES: Lobby[] = [
  {
    id: 'lobby-1',
    name: 'Quick Chess Game',
    host: {
      id: 'player-1',
      name: 'Alice',
      color: 'white',
      isBot: false,
      rating: 1450
    },
    isPrivate: false,
    status: 'waiting',
    gameMode: 'multiplayer',
    timeControl: {
      initialTime: 600,
      increment: 5
    },
    createdAt: Date.now() - 300000
  },
  {
    id: 'lobby-2',
    name: 'Blitz Match',
    host: {
      id: 'player-2',
      name: 'Bob',
      color: 'white',
      isBot: false,
      rating: 1200
    },
    guest: {
      id: 'player-3',
      name: 'Charlie',
      color: 'black',
      isBot: false,
      rating: 1180
    },
    isPrivate: false,
    status: 'full',
    gameMode: 'multiplayer',
    timeControl: {
      initialTime: 300,
      increment: 3
    },
    createdAt: Date.now() - 150000
  },
  {
    id: 'lobby-3',
    name: 'Private Game',
    host: {
      id: 'player-4',
      name: 'Diana',
      color: 'white',
      isBot: false,
      rating: 1600
    },
    isPrivate: true,
    status: 'waiting',
    gameMode: 'multiplayer',
    timeControl: {
      initialTime: 1800,
      increment: 15
    },
    createdAt: Date.now() - 600000
  },
  {
    id: 'lobby-4',
    name: 'Endless Challenge',
    host: {
      id: 'player-5',
      name: 'Eve',
      color: 'white',
      isBot: false,
      rating: 1350
    },
    isPrivate: false,
    status: 'waiting',
    gameMode: 'endless',
    createdAt: Date.now() - 60000
  }
];

export default function LobbyPage() {
  const [lobbies, setLobbies] = useState<Lobby[]>(MOCK_LOBBIES);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleRefreshLobbies = async () => {
    setIsLoading(true);
    
    try {
      // TODO: Fetch real lobbies from API
      // const response = await fetch('/api/lobbies');
      // const data = await response.json();
      // setLobbies(data.lobbies);
      
      // For now, simulate refresh
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('Refreshed lobbies');
    } catch (error) {
      console.error('Error refreshing lobbies:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinLobby = async (lobbyId: string) => {
    setIsLoading(true);
    
    try {
      // TODO: Implement join lobby API call
      // const response = await fetch(`/api/lobbies/${lobbyId}/join`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ playerId: getCurrentPlayerId() })
      // });
      
      console.log('Joining lobby:', lobbyId);
      alert(`Joining lobby: ${lobbyId} (Implementation pending)`);
    } catch (error) {
      console.error('Error joining lobby:', error);
      alert('Failed to join lobby. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateLobby = async (lobbyData: {
    name: string;
    isPrivate: boolean;
    gameMode: GameMode;
    timeControl?: TimeControl;
  }) => {
    setIsLoading(true);
    
    try {
      // TODO: Implement create lobby API call
      // const response = await fetch('/api/lobbies', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     ...lobbyData,
      //     hostId: getCurrentPlayerId()
      //   })
      // });
      
      const newLobby: Lobby = {
        id: `lobby-${Date.now()}`,
        name: lobbyData.name,
        host: {
          id: 'current-player',
          name: 'You',
          color: 'white',
          isBot: false,
          rating: 1200
        },
        isPrivate: lobbyData.isPrivate,
        status: 'waiting',
        gameMode: lobbyData.gameMode,
        timeControl: lobbyData.timeControl,
        createdAt: Date.now()
      };

      setLobbies(prev => [newLobby, ...prev]);
      setShowCreateModal(false);
      
      console.log('Created lobby:', newLobby);
    } catch (error) {
      console.error('Error creating lobby:', error);
      alert('Failed to create lobby. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-refresh lobbies every 30 seconds
  useEffect(() => {
    const interval = setInterval(handleRefreshLobbies, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        <LobbyList
          lobbies={lobbies}
          onJoinLobby={handleJoinLobby}
          onCreateLobby={() => setShowCreateModal(true)}
          onRefresh={handleRefreshLobbies}
          isLoading={isLoading}
        />
      </main>
      <Footer />

      <CreateLobbyModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreateLobby={handleCreateLobby}
        isLoading={isLoading}
      />
    </>
  );
}
