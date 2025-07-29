import type {
  ApiResponse,
  CreateLobbyRequest,
  JoinLobbyRequest,
  MakeMoveRequest,
} from '@/types/api';
import type {
  GameState,
  Lobby,
  User,
  PlayerStats,
  UserPreferences,
} from '@/types/game';
import { getErrorMessage } from '@/lib/utils';

class ApiClient {
  private baseUrl: string;
  private timeout: number;

  constructor(baseUrl: string, timeout = 10000) {
    this.baseUrl = baseUrl.replace(/\/$/, ''); // Remove trailing slash
    this.timeout = timeout;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      return {
        success: true,
        data,
        timestamp: Date.now(),
      };
    } catch (error) {
      clearTimeout(timeoutId);
      return {
        success: false,
        error: getErrorMessage(error),
        timestamp: Date.now(),
      };
    }
  }

  private get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  private post<T>(endpoint: string, body?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  private put<T>(endpoint: string, body?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  private delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  // User endpoints
  async createUser(name: string): Promise<ApiResponse<User>> {
    return this.post<User>('/api/users', { name });
  }

  async getUser(userId: string): Promise<ApiResponse<User>> {
    return this.get<User>(`/api/users/${userId}`);
  }

  async updateUserPreferences(
    userId: string,
    preferences: Partial<UserPreferences>
  ): Promise<ApiResponse<UserPreferences>> {
    return this.put<UserPreferences>(`/api/users/${userId}/preferences`, preferences);
  }

  async getUserStats(userId: string): Promise<ApiResponse<PlayerStats>> {
    return this.get<PlayerStats>(`/api/users/${userId}/stats`);
  }

  // Lobby endpoints
  async createLobby(request: CreateLobbyRequest): Promise<ApiResponse<Lobby>> {
    return this.post<Lobby>('/api/lobbies', request);
  }

  async joinLobby(request: JoinLobbyRequest): Promise<ApiResponse<Lobby>> {
    return this.post<Lobby>(`/api/lobbies/${request.lobbyId}/join`, {
      playerId: request.playerId,
    });
  }

  async leaveLobby(lobbyId: string, playerId: string): Promise<ApiResponse<void>> {
    return this.post<void>(`/api/lobbies/${lobbyId}/leave`, { playerId });
  }

  async getLobbies(): Promise<ApiResponse<Lobby[]>> {
    return this.get<Lobby[]>('/api/lobbies');
  }

  async getLobby(lobbyId: string): Promise<ApiResponse<Lobby>> {
    return this.get<Lobby>(`/api/lobbies/${lobbyId}`);
  }

  // Game endpoints
  async getGame(gameId: string): Promise<ApiResponse<GameState>> {
    return this.get<GameState>(`/api/games/${gameId}`);
  }

  async makeMove(request: MakeMoveRequest): Promise<ApiResponse<GameState>> {
    return this.post<GameState>(`/api/games/${request.gameId}/moves`, {
      move: request.move,
    });
  }

  async offerDraw(gameId: string, playerId: string): Promise<ApiResponse<void>> {
    return this.post<void>(`/api/games/${gameId}/draw-offer`, { playerId });
  }

  async respondToDraw(
    gameId: string,
    playerId: string,
    accept: boolean
  ): Promise<ApiResponse<void>> {
    return this.post<void>(`/api/games/${gameId}/draw-response`, {
      playerId,
      accept,
    });
  }

  async resign(gameId: string, playerId: string): Promise<ApiResponse<void>> {
    return this.post<void>(`/api/games/${gameId}/resign`, { playerId });
  }

  // Bot game endpoints
  async startBotGame(
    playerId: string,
    difficulty: string
  ): Promise<ApiResponse<GameState>> {
    return this.post<GameState>('/api/games/bot', { playerId, difficulty });
  }

  // Endless mode endpoints
  async startEndlessGame(playerId: string): Promise<ApiResponse<GameState>> {
    return this.post<GameState>('/api/games/endless', { playerId });
  }

  async getEndlessLeaderboard(): Promise<ApiResponse<PlayerStats[]>> {
    return this.get<PlayerStats[]>('/api/leaderboard/endless');
  }

  // Health check
  async healthCheck(): Promise<ApiResponse<{ status: string; timestamp: number }>> {
    return this.get('/api/health');
  }
}

// Create singleton instance
const apiClient = new ApiClient(
  typeof window !== 'undefined' 
    ? window.location.origin 
    : 'http://localhost:5000'
);

export default apiClient;
