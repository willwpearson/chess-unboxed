import { beforeEach, describe, expect, it } from 'vitest';
import { useUserStore } from './userStore';

const initialState = useUserStore.getState();

describe('useUserStore', () => {
  beforeEach(() => {
    useUserStore.setState(initialState, true);
    localStorage.clear();
  });

  it('sets a user and persists it to storage', () => {
    const user = { id: 'u1', name: 'Alice', isOnline: true, stats: { gamesPlayed: 0, wins: 0, losses: 0, draws: 0, rating: 1200 }, preferences: {} as any, createdAt: Date.now() };
    useUserStore.getState().setUser(user);

    expect(useUserStore.getState().user).toEqual(user);
    expect(JSON.parse(localStorage.getItem('chess-user')!)).toEqual(user);
  });

  it('merges preference updates into the existing user', () => {
    const user = { id: 'u1', name: 'Alice', isOnline: true, stats: { gamesPlayed: 0, wins: 0, losses: 0, draws: 0, rating: 1200 }, preferences: { theme: 'dark', soundEnabled: true } as any, createdAt: Date.now() };
    useUserStore.getState().setUser(user);

    useUserStore.getState().updatePreferences({ soundEnabled: false });

    expect(useUserStore.getState().user?.preferences).toMatchObject({ theme: 'dark', soundEnabled: false });
  });

  it('is a no-op when updating preferences without a signed-in user', () => {
    useUserStore.getState().updatePreferences({ soundEnabled: false });
    expect(useUserStore.getState().user).toBeNull();
  });

  it('merges stat updates into the existing user', () => {
    const user = { id: 'u1', name: 'Alice', isOnline: true, stats: { gamesPlayed: 5, wins: 2, losses: 3, draws: 0, rating: 1300 }, preferences: {} as any, createdAt: Date.now() };
    useUserStore.getState().setUser(user);

    useUserStore.getState().updateStats({ wins: 3, gamesPlayed: 6 });

    expect(useUserStore.getState().user?.stats).toMatchObject({ wins: 3, gamesPlayed: 6, losses: 3 });
  });

  it('clears the user and removes storage entries', () => {
    const user = { id: 'u1', name: 'Alice', isOnline: true, stats: { gamesPlayed: 0, wins: 0, losses: 0, draws: 0, rating: 1200 }, preferences: {} as any, createdAt: Date.now() };
    useUserStore.getState().setUser(user);
    localStorage.setItem('chess-user-id', 'u1');

    useUserStore.getState().clearUser();

    expect(useUserStore.getState().user).toBeNull();
    expect(localStorage.getItem('chess-user')).toBeNull();
    expect(localStorage.getItem('chess-user-id')).toBeNull();
  });

  it('loads a user from storage when present', () => {
    const stored = { id: 'stored-1', name: 'Bob', isOnline: false, stats: { gamesPlayed: 1, wins: 1, losses: 0, draws: 0, rating: 1250 }, preferences: {} as any, createdAt: 123 };
    localStorage.setItem('chess-user', JSON.stringify(stored));

    useUserStore.getState().loadUserFromStorage();

    expect(useUserStore.getState().user).toEqual(stored);
  });

  it('creates a new default user when storage is empty', () => {
    useUserStore.getState().loadUserFromStorage();

    const user = useUserStore.getState().user;
    expect(user).not.toBeNull();
    expect(user!.stats).toEqual({ gamesPlayed: 0, wins: 0, losses: 0, draws: 0, rating: 1200 });
    expect(localStorage.getItem('chess-user')).not.toBeNull();
  });

  it('tracks loading and error flags', () => {
    useUserStore.getState().setLoading(true);
    expect(useUserStore.getState().isLoading).toBe(true);

    useUserStore.getState().setError('boom');
    expect(useUserStore.getState().error).toBe('boom');
  });
});
