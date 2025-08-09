'use client';

import React, { useState, useEffect } from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { LobbyList } from '@/components/lobby/LobbyList';
import { CreateLobbyModal } from '@/components/lobby/CreateLobbyModal';
import { Lobby, GameMode, TimeControl } from '@/types/game';
import { api } from '@/lib/api';
import { usePlayer } from '@/hooks';

export default function LobbyPage() {
  const [lobbies, setLobbies] = useState<Lobby[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const { player: currentPlayer, isLoading: playerLoading } = usePlayer();

  const fetchLobbies = async () => {
    setIsLoading(true);
    
    try {
      const response = await api.getLobbies();
      if (response.success && response.data) {
        // Transform API data to match UI types
        const transformedLobbies: Lobby[] = response.data.lobbies.map(lobby => ({
          id: lobby.id,
          name: `Lobby by ${lobby.host?.nickname || 'Unknown'}`,
          host: {
            id: lobby.host?.id || '',
            name: lobby.host?.nickname || 'Unknown',
            color: 'white',
            isBot: false,
            rating: lobby.host?.score || 0,
          },
          guest: lobby.guest ? {
            id: lobby.guest.id,
            name: lobby.guest.nickname || 'Unknown',
            color: 'black',
            isBot: false,
            rating: lobby.guest.score || 0,
          } : undefined,
          isPrivate: false,
          status: lobby.status === 'in_game' ? 'in-game' : lobby.status as 'waiting' | 'full' | 'in-game',
          gameMode: 'multiplayer' as GameMode,
          gameVariant: 'unboxed',
          timeControl: {
            initialTime: 600,
            increment: 5,
          },
          createdAt: new Date(lobby.created_at).getTime(),
        }));
        setLobbies(transformedLobbies);
      }
    } catch (error) {
      console.error('Error fetching lobbies:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefreshLobbies = async () => {
    await fetchLobbies();
  };

  // Fetch lobbies on component mount
  useEffect(() => {
    fetchLobbies();
  }, []);

  const handleJoinLobby = async (lobbyId: string) => {
    if (!currentPlayer || playerLoading) {
      alert('Please wait for player initialization...');
      return;
    }

    setIsLoading(true);
    
    try {
      // Join the lobby using the current player
      const response = await api.joinLobby(lobbyId, currentPlayer.id);
      if (response.success) {
        console.log('Successfully joined lobby:', response.data);
        // Refresh lobbies to show updated state
        await fetchLobbies();
        alert('Successfully joined lobby!');
      } else {
        throw new Error(response.error || 'Failed to join lobby');
      }
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
    if (!currentPlayer || playerLoading) {
      alert('Please wait for player initialization...');
      return;
    }

    setIsLoading(true);
    
    try {
      // Create the lobby using the current player
      const response = await api.createLobby(currentPlayer.id);
      if (response.success && response.data) {
        console.log('Successfully created lobby:', response.data);
        // Refresh lobbies to show the new lobby
        await fetchLobbies();
        setShowCreateModal(false);
        alert('Lobby created successfully!');
      } else {
        throw new Error(response.error || 'Failed to create lobby');
      }
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
