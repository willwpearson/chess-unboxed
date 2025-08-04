import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { User, UserPreferences, PlayerStats } from '@/types/game';
import { getUserId, getFromStorage, setToStorage } from '@/lib/utils';

interface UserState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setUser: (user: User) => void;
  updatePreferences: (preferences: Partial<UserPreferences>) => void;
  updateStats: (stats: Partial<PlayerStats>) => void;
  clearUser: () => void;
  loadUserFromStorage: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

const defaultPreferences: UserPreferences = {
  theme: 'light',
  boardTheme: 'classic',
  pieceSet: 'classic',
  showCoordinates: true,
  showPossibleMoves: true,
  soundEnabled: true,
  autoQueen: true,
};

const defaultStats: PlayerStats = {
  gamesPlayed: 0,
  wins: 0,
  losses: 0,
  draws: 0,
  rating: 1200,
  endlessHighScore: 0,
};

export const useUserStore = create<UserState>()(
  devtools(
    (set, get) => ({
      user: null,
      isLoading: false,
      error: null,

      setUser: (user: User) => {
        set({ user, error: null });
        setToStorage('chess-user', user);
      },

      updatePreferences: (preferences: Partial<UserPreferences>) => {
        const currentUser = get().user;
        if (currentUser) {
          const updatedUser = {
            ...currentUser,
            preferences: { ...currentUser.preferences, ...preferences },
          };
          set({ user: updatedUser });
          setToStorage('chess-user', updatedUser);
        }
      },

      updateStats: (stats: Partial<PlayerStats>) => {
        const currentUser = get().user;
        if (currentUser) {
          const updatedUser = {
            ...currentUser,
            stats: { ...currentUser.stats, ...stats },
          };
          set({ user: updatedUser });
          setToStorage('chess-user', updatedUser);
        }
      },

      clearUser: () => {
        set({ user: null, error: null });
        if (typeof window !== 'undefined') {
          localStorage.removeItem('chess-user');
          localStorage.removeItem('chess-user-id');
        }
      },

      loadUserFromStorage: () => {
        const storedUser = getFromStorage<User | null>('chess-user', null);
        if (storedUser) {
          set({ user: storedUser });
        } else {
          // Create a new user with default settings
          const userId = getUserId();
          const newUser: User = {
            id: userId,
            name: `Player ${userId.slice(-4)}`,
            isOnline: false,
            stats: defaultStats,
            preferences: defaultPreferences,
            createdAt: Date.now(),
          };
          get().setUser(newUser);
        }
      },

      setLoading: (loading: boolean) => set({ isLoading: loading }),

      setError: (error: string | null) => set({ error }),
    }),
    { name: 'user-store' }
  )
);
