import { io, Socket } from 'socket.io-client';
import type { SocketEvents } from '@/types/game';
import type { ConnectionState } from '@/types/api';

class WebSocketService {
  private socket: Socket | null = null;
  private connectionState: ConnectionState = {
    isConnected: false,
    isConnecting: false,
    reconnectAttempts: 0,
  };
  private listeners: Map<string, Set<Function>> = new Map();
  private maxReconnectAttempts = 5;
  private reconnectInterval = 3000;
  private url: string;

  constructor(url: string) {
    this.url = url;
  }

  connect(userId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.socket?.connected) {
        resolve();
        return;
      }

      this.connectionState.isConnecting = true;
      this.updateConnectionState();

      this.socket = io(this.url, {
        transports: ['websocket'],
        autoConnect: true,
        auth: {
          userId,
        },
      });

      this.socket.on('connect', () => {
        this.connectionState = {
          isConnected: true,
          isConnecting: false,
          lastConnected: Date.now(),
          reconnectAttempts: 0,
        };
        this.updateConnectionState();
        resolve();
      });

      this.socket.on('disconnect', (reason) => {
        this.connectionState.isConnected = false;
        this.connectionState.error = reason;
        this.updateConnectionState();

        if (reason === 'io server disconnect') {
          // Server disconnected, don't reconnect automatically
          return;
        }

        // Attempt to reconnect
        this.handleReconnect();
      });

      this.socket.on('connect_error', (error) => {
        this.connectionState.isConnecting = false;
        this.connectionState.error = error.message;
        this.updateConnectionState();
        reject(error);
      });

      // Set up event listeners
      this.setupEventListeners();
    });
  }

  private setupEventListeners(): void {
    if (!this.socket) return;

    // Listen for all socket events and forward them to registered listeners
    const events: (keyof SocketEvents)[] = [
      'lobby-created',
      'lobby-joined',
      'lobby-left',
      'game-started',
      'move-made',
      'game-ended',
      'draw-offered',
      'draw-accepted',
      'draw-declined',
      'player-resigned',
      'time-update',
      'error',
    ];

    events.forEach((event) => {
      this.socket!.on(event, (data) => {
        this.emit(event, data);
      });
    });
  }

  private handleReconnect(): void {
    if (this.connectionState.reconnectAttempts >= this.maxReconnectAttempts) {
      this.connectionState.error = 'Max reconnection attempts reached';
      this.updateConnectionState();
      return;
    }

    setTimeout(() => {
      this.connectionState.reconnectAttempts++;
      this.connectionState.isConnecting = true;
      this.updateConnectionState();
      this.socket?.connect();
    }, this.reconnectInterval);
  }

  private updateConnectionState(): void {
    this.emit('connection-state-changed', this.connectionState);
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.connectionState = {
      isConnected: false,
      isConnecting: false,
      reconnectAttempts: 0,
    };
    this.updateConnectionState();
  }

  // Event emitter methods
  on<K extends keyof SocketEvents>(
    event: K | 'connection-state-changed',
    callback: (data: SocketEvents[K] | ConnectionState) => void
  ): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
  }

  off<K extends keyof SocketEvents>(
    event: K | 'connection-state-changed',
    callback: (data: SocketEvents[K] | ConnectionState) => void
  ): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.delete(callback);
    }
  }

  private emit(event: string, data: unknown): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach((callback) => callback(data));
    }
  }

  // Socket event emitters
  joinLobby(lobbyId: string, player: SocketEvents['join-lobby']['player']): void {
    this.socket?.emit('join-lobby', { lobbyId, player });
  }

  createLobby(lobby: SocketEvents['create-lobby']['lobby']): void {
    this.socket?.emit('create-lobby', { lobby });
  }

  leaveLobby(lobbyId: string): void {
    this.socket?.emit('leave-lobby', { lobbyId });
  }

  makeMove(gameId: string, move: SocketEvents['make-move']['move']): void {
    this.socket?.emit('make-move', { gameId, move });
  }

  offerDraw(gameId: string): void {
    this.socket?.emit('offer-draw', { gameId });
  }

  resign(gameId: string): void {
    this.socket?.emit('resign', { gameId });
  }

  startEndless(player: SocketEvents['start-endless']['player']): void {
    this.socket?.emit('start-endless', { player });
  }

  getConnectionState(): ConnectionState {
    return { ...this.connectionState };
  }

  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }
}

// Create singleton instance
const wsService = new WebSocketService(
  typeof window !== 'undefined' && window.location.protocol === 'https:'
    ? `wss://${window.location.host}`
    : 'ws://localhost:5000'
);

export default wsService;
