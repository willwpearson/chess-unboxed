'use client';

import { useEffect, useState } from 'react';
import wsService from '@/lib/websocket';
import { useUserStore } from '@/store/userStore';
import { useGameStore } from '@/store/gameStore';
import type { ConnectionState } from '@/types/api';

export function useWebSocket() {
  const user = useUserStore((state) => state.user);
  const setConnected = useGameStore((state) => state.setConnected);
  const setConnecting = useGameStore((state) => state.setConnecting);
  const setConnectionError = useGameStore((state) => state.setConnectionError);
  
  const [connectionState, setConnectionState] = useState<ConnectionState>({
    isConnected: false,
    isConnecting: false,
    reconnectAttempts: 0,
  });

  useEffect(() => {
    if (!user) return;

    const handleConnectionStateChanged = (data: unknown) => {
      // Type guard to check if data is ConnectionState
      if (
        typeof data === 'object' &&
        data !== null &&
        'isConnected' in data &&
        'isConnecting' in data &&
        'reconnectAttempts' in data
      ) {
        const state = data as ConnectionState;
        setConnectionState(state);
        setConnected(state.isConnected);
        setConnecting(state.isConnecting);
        setConnectionError(state.error || null);
      }
    };

    wsService.on('connection-state-changed', handleConnectionStateChanged);

    // Connect to WebSocket
    wsService.connect(user.id).catch((error) => {
      console.error('Failed to connect to WebSocket:', error);
    });

    return () => {
      wsService.off('connection-state-changed', handleConnectionStateChanged);
      wsService.disconnect();
    };
  }, [user, setConnected, setConnecting, setConnectionError]);

  return {
    isConnected: connectionState.isConnected,
    isConnecting: connectionState.isConnecting,
    error: connectionState.error,
    reconnectAttempts: connectionState.reconnectAttempts,
  };
}

export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') return initialValue;
    
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const setValue = (value: T) => {
    try {
      setStoredValue(value);
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(value));
      }
    } catch (error) {
      console.warn(`Error setting localStorage key "${key}":`, error);
    }
  };

  return [storedValue, setValue];
}

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
