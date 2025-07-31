/**
 * API client for chess application
 * Provides type-safe methods to interact with backend API
 */

import { getErrorMessage } from './utils';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: number;
}

export interface Player {
  id: string;
  created_at: string;
  nickname: string | null;
  score: number;
  is_active: boolean;
}

export interface Game {
  id: string;
  created_at: string;
  ended_at: string | null;
  mode: 'bot' | 'pvp' | 'endless';
  player1_id: string | null;
  player2_id: string | null;
  winner_id: string | null;
  status: 'in_progress' | 'completed' | 'abandoned';
  moves: any; // jsonb
  player1?: Player;
  player2?: Player;
  winner?: Player;
}

export interface Lobby {
  id: string;
  created_at: string;
  host_id: string | null;
  guest_id: string | null;
  status: 'waiting' | 'full' | 'in_game';
  host?: Player;
  guest?: Player;
}

export interface EndlessSession {
  id: string;
  player_id: string;
  score: number;
  active: boolean;
  started_at: string;
  ended_at: string | null;
  player?: Player;
}

class ApiClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = typeof window !== 'undefined' 
      ? window.location.origin 
      : process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}/api${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error(`API request failed: ${endpoint}`, error);
      throw new Error(getErrorMessage(error));
    }
  }

  // Health endpoint
  async health(): Promise<ApiResponse<{ status: string; timestamp: number; version: string }>> {
    return this.request('/health');
  }

  // Player endpoints
  async createPlayer(nickname: string): Promise<ApiResponse<{ player: Player }>> {
    return this.request('/players', {
      method: 'POST',
      body: JSON.stringify({ nickname }),
    });
  }

  async getPlayer(id: string): Promise<{ player: Player }> {
    return this.request(`/players?id=${id}`);
  }

  async getPlayers(): Promise<{ players: Player[] }> {
    return this.request('/players');
  }

  async updatePlayer(id: string, data: Partial<Player>): Promise<ApiResponse<{ player: Player }>> {
    return this.request(`/players?id=${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Lobby endpoints
  async getLobbies(): Promise<ApiResponse<{ lobbies: Lobby[] }>> {
    return this.request('/lobbies');
  }

  async createLobby(hostId: string): Promise<ApiResponse<{ lobby: Lobby }>> {
    return this.request('/lobbies', {
      method: 'POST',
      body: JSON.stringify({ host_id: hostId }),
    });
  }

  async joinLobby(lobbyId: string, guestId: string): Promise<ApiResponse<{ lobby: Lobby }>> {
    return this.request(`/lobbies?id=${lobbyId}`, {
      method: 'PUT',
      body: JSON.stringify({ guest_id: guestId }),
    });
  }

  async updateLobbyStatus(lobbyId: string, status: 'waiting' | 'full' | 'in_game'): Promise<ApiResponse<{ lobby: Lobby }>> {
    return this.request(`/lobbies?id=${lobbyId}`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  }

  // Game endpoints
  async getGame(id: string): Promise<{ game: Game }> {
    return this.request(`/games?id=${id}`);
  }

  async getGames(): Promise<{ games: Game[] }> {
    return this.request('/games');
  }

  async getPlayerGames(playerId: string): Promise<{ games: Game[] }> {
    return this.request(`/games?player=${playerId}`);
  }

  async createGame(mode: 'bot' | 'pvp' | 'endless', player1Id: string, player2Id?: string): Promise<ApiResponse<{ game: Game }>> {
    return this.request('/games', {
      method: 'POST',
      body: JSON.stringify({
        mode,
        player1_id: player1Id,
        player2_id: player2Id,
      }),
    });
  }

  async updateGame(id: string, data: Partial<Game>): Promise<ApiResponse<{ game: Game }>> {
    return this.request(`/games?id=${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Endless mode endpoints
  async getEndlessSessions(options?: { playerId?: string; active?: boolean }): Promise<ApiResponse<{ sessions: EndlessSession[] }>> {
    const params = new URLSearchParams();
    if (options?.playerId) params.append('player', options.playerId);
    if (options?.active !== undefined) params.append('active', options.active.toString());
    
    const query = params.toString();
    return this.request(`/endless${query ? `?${query}` : ''}`);
  }

  async createEndlessSession(playerId: string): Promise<ApiResponse<{ session: EndlessSession }>> {
    return this.request('/endless', {
      method: 'POST',
      body: JSON.stringify({ player_id: playerId }),
    });
  }

  async updateEndlessSession(id: string, data: Partial<EndlessSession>): Promise<ApiResponse<{ session: EndlessSession }>> {
    return this.request(`/endless?id=${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Leaderboard data (derived from players and endless sessions)
  async getLeaderboard(): Promise<{
    rating: Array<Player & { rank: number; gamesPlayed: number; wins: number; losses: number; draws: number; winRate: number }>;
    endless: Array<EndlessSession & { rank: number }>;
  }> {
    try {
      // For now, we'll derive leaderboard data from players and games
      // In the future, you might want a dedicated leaderboard endpoint
      const [playersResponse, gamesResponse, endlessResponse] = await Promise.all([
        this.getPlayers(),
        this.getGames(),
        this.getEndlessSessions(),
      ]);

      const players = playersResponse.players || [];
      const games = gamesResponse.games || [];
      const endlessSessions = endlessResponse.data?.sessions || [];

      // Calculate player stats
      const playerStats = players.map((player, index) => {
        const playerGames = games.filter(g => 
          g.player1_id === player.id || g.player2_id === player.id
        ).filter(g => g.status === 'completed');

        const wins = playerGames.filter(g => g.winner_id === player.id).length;
        const losses = playerGames.filter(g => 
          g.winner_id && g.winner_id !== player.id
        ).length;
        const draws = playerGames.filter(g => !g.winner_id && g.status === 'completed').length;

        return {
          ...player,
          rank: index + 1,
          gamesPlayed: playerGames.length,
          wins,
          losses,
          draws,
          winRate: playerGames.length > 0 ? (wins / playerGames.length) * 100 : 0,
        };
      }).sort((a, b) => b.score - a.score);

      // Update ranks after sorting
      playerStats.forEach((player, index) => {
        player.rank = index + 1;
      });

      // Rank endless sessions
      const endlessLeaderboard = endlessSessions
        .sort((a, b) => b.score - a.score)
        .map((session, index) => ({
          ...session,
          rank: index + 1,
        }));

      return {
        rating: playerStats,
        endless: endlessLeaderboard,
      };
    } catch (error) {
      console.error('Error fetching leaderboard data:', error);
      // Return empty data on error
      return {
        rating: [],
        endless: [],
      };
    }
  }
}

// Create singleton instance
export const api = new ApiClient();
export default api;
