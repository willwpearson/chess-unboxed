export interface ApiError {
  message: string;
  code?: string;
  details?: Record<string, unknown>;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface WebSocketMessage<T = unknown> {
  type: string;
  data: T;
  timestamp: number;
  id?: string;
}

export interface ConnectionState {
  isConnected: boolean;
  isConnecting: boolean;
  lastConnected?: number;
  reconnectAttempts: number;
  error?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: number;
}

export interface CreateLobbyRequest {
  name: string;
  isPrivate: boolean;
  timeControl?: {
    initialTime: number;
    increment: number;
  };
}

export interface JoinLobbyRequest {
  lobbyId: string;
  playerId: string;
}

export interface MakeMoveRequest {
  gameId: string;
  move: {
    from: string;
    to: string;
    promotion?: string;
  };
}
