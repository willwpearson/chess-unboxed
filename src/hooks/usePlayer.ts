/**
 * Player management hook
 * Handles player creation and management for the chess app
 */

'use client';

import { useState, useEffect } from 'react';
import { api, Player } from '@/lib/api';
import { getUserId } from '@/lib/utils';

interface UsePlayerReturn {
  player: Player | null;
  isLoading: boolean;
  error: string | null;
  createPlayer: (nickname: string) => Promise<Player | null>;
  updatePlayer: (data: Partial<Player>) => Promise<void>;
  refreshPlayer: () => Promise<void>;
}

export function usePlayer(): UsePlayerReturn {
  const [player, setPlayer] = useState<Player | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const createPlayer = async (nickname: string): Promise<Player | null> => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await api.createPlayer(nickname);
      if (response.success && response.data) {
        const newPlayer = response.data.player;
        setPlayer(newPlayer);
        
        // Store the player ID for future use
        localStorage.setItem('chess-player-id', newPlayer.id);
        
        return newPlayer;
      } else {
        throw new Error(response.error || 'Failed to create player');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('Error creating player:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const updatePlayer = async (data: Partial<Player>): Promise<void> => {
    if (!player) return;

    try {
      setIsLoading(true);
      setError(null);
      
      const response = await api.updatePlayer(player.id, data);
      if (response.success && response.data) {
        setPlayer(response.data.player);
      } else {
        throw new Error(response.error || 'Failed to update player');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('Error updating player:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshPlayer = async (): Promise<void> => {
    if (!player) return;

    try {
      setIsLoading(true);
      setError(null);
      
      const response = await api.getPlayer(player.id);
      setPlayer(response.player);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('Error refreshing player:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Initialize player on mount
  useEffect(() => {
    const initializePlayer = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Check if we have a stored player ID
        const storedPlayerId = localStorage.getItem('chess-player-id');
        
        if (storedPlayerId) {
          try {
            const response = await api.getPlayer(storedPlayerId);
            setPlayer(response.player);
            return;
          } catch (err) {
            // Player not found in database, continue to create new one
            console.log('Stored player not found, will create new one');
            localStorage.removeItem('chess-player-id');
          }
        }

        // No stored player or stored player not found, create a guest player
        const userId = getUserId();
        const guestNickname = `Guest_${userId.slice(-6)}`;
        
        await createPlayer(guestNickname);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMessage);
        console.error('Error initializing player:', err);
      } finally {
        setIsLoading(false);
      }
    };

    initializePlayer();
  }, []);

  return {
    player,
    isLoading,
    error,
    createPlayer,
    updatePlayer,
    refreshPlayer,
  };
}
