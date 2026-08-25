'use client';

import { useState, useEffect, createContext, useContext } from 'react';

export interface User {
  id: string;
  email: string | null;
  username: string;
  display_name: string;
  bio?: string;
  avatar_url?: string;
  country?: string;
  website?: string;
  current_rating: number;
  peak_rating: number;
  total_games: number;
  wins: number;
  losses: number;
  draws: number;
  is_verified: boolean;
  created_at: string;
  last_seen: string;
}

export interface AuthUserData extends User {
  isGuest?: boolean;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isGuest: boolean;
}

interface AuthActions {
  login: (identifier: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (email: string, username: string, password: string, displayName?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  createGuestUser: () => Promise<{ success: boolean; error?: string }>;
}

interface UseAuthReturn extends AuthState, AuthActions {}

class AuthService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = typeof window !== 'undefined' 
      ? window.location.origin 
      : process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseUrl}/api${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      credentials: 'include', // Include cookies
      ...options,
    };

    const response = await fetch(url, config);
    const data = await response.json();

    if (!response.ok) {
      // For auth endpoints, return error gracefully instead of throwing
      if (endpoint === '/auth/me' && (response.status === 401 || response.status === 403)) {
        return { success: false, error: data.error || 'Not authenticated' };
      }
      throw new Error(data.error || `HTTP error! status: ${response.status}`);
    }

    return data;
  }

  async login(identifier: string, password: string) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ identifier, password }),
    });
  }

  async register(email: string, username: string, password: string, displayName?: string) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, username, password, displayName }),
    });
  }

  async logout() {
    return this.request('/auth/logout', {
      method: 'POST',
    });
  }

  async getCurrentUser() {
    return this.request('/auth/me');
  }

  async createGuestUser() {
    return this.request('/auth/guest', {
      method: 'POST',
    });
  }
}

const authService = new AuthService();

export function useAuth(): UseAuthReturn {
  const [state, setState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
    isGuest: false,
  });

  const login = async (identifier: string, password: string) => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));
      
      const response = await authService.login(identifier, password);
      
      if (response.success && response.data?.user) {
        setState({
          user: response.data.user,
          isLoading: false,
          isAuthenticated: true,
          isGuest: response.data.isGuest || false,
        });
        return { success: true };
      }
      
      return { success: false, error: response.error || 'Login failed' };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      setState(prev => ({ ...prev, isLoading: false, isGuest: false }));
      return { success: false, error: errorMessage };
    }
  };

  const register = async (email: string, username: string, password: string, displayName?: string) => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));
      
      const response = await authService.register(email, username, password, displayName);
      
      if (response.success && response.data?.user) {
        // Auto-login after successful registration
        const loginResult = await login(email, password);
        return loginResult;
      }
      
      return { success: false, error: response.error || 'Registration failed' };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Registration failed';
      setState(prev => ({ ...prev, isLoading: false, isGuest: false }));
      return { success: false, error: errorMessage };
    }
  };

  const logout = async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));
      
      await authService.logout();
      
      setState({
        user: null,
        isLoading: false,
        isAuthenticated: false,
        isGuest: false,
      });
    } catch (error) {
      console.error('Logout error:', error);
      // Still clear the state even if the API call fails
      setState({
        user: null,
        isLoading: false,
        isAuthenticated: false,
        isGuest: false,
      });
    }
  };

  const refreshUser = async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));
      
      const response = await authService.getCurrentUser();
      
      if (response.success && response.data?.user) {
        setState({
          user: response.data.user,
          isLoading: false,
          isAuthenticated: true,
          isGuest: response.data.isGuest || false,
        });
      } else {
        setState({
          user: null,
          isLoading: false,
          isAuthenticated: false,
          isGuest: false,
        });
      }
    } catch (error) {
      // Only log actual errors, not expected authentication failures
      if (error instanceof Error && !error.message.includes('Not authenticated') && !error.message.includes('No authentication token')) {
        console.error('Refresh user error:', error);
      }
      setState({
        user: null,
        isLoading: false,
        isAuthenticated: false,
        isGuest: false,
      });
    }
  };

  const createGuestUser = async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));
      
      const response = await authService.createGuestUser();
      
      if (response.success && response.data?.user) {
        setState({
          user: response.data.user,
          isLoading: false,
          isAuthenticated: true,
          isGuest: true,
        });
        return { success: true };
      }
      
      return { success: false, error: response.error || 'Failed to create guest account' };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create guest account';
      setState(prev => ({ ...prev, isLoading: false, isGuest: false }));
      return { success: false, error: errorMessage };
    }
  };

  // Initialize auth state on mount
  useEffect(() => {
    refreshUser();
  }, []);

  return {
    ...state,
    login,
    register,
    logout,
    refreshUser,
    createGuestUser,
  };
}