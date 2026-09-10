import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';

vi.mock('@/lib/api', () => ({
  api: {
    createPlayer: vi.fn(),
    updatePlayer: vi.fn(),
    getPlayer: vi.fn(),
  },
}));
vi.mock('@/lib/utils', () => ({ getUserId: vi.fn(() => 'device-abc123') }));

const { api } = await import('@/lib/api');
const { usePlayer } = await import('./usePlayer');

const player = { id: 'player-1', created_at: '2024-01-01', nickname: 'Guest_bc123', score: 0, is_active: true };

describe('usePlayer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  it('creates a guest player on mount when no player id is stored', async () => {
    vi.mocked(api.createPlayer).mockResolvedValue({ success: true, data: { player }, timestamp: 0 });

    const { result } = renderHook(() => usePlayer());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(api.createPlayer).toHaveBeenCalledWith('Guest_abc123');
    expect(result.current.player).toEqual(player);
    expect(localStorage.getItem('chess-player-id')).toBe('player-1');
  });

  it('loads the stored player instead of creating a new one', async () => {
    localStorage.setItem('chess-player-id', 'player-1');
    vi.mocked(api.getPlayer).mockResolvedValue({ player } as any);

    const { result } = renderHook(() => usePlayer());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(api.getPlayer).toHaveBeenCalledWith('player-1');
    expect(api.createPlayer).not.toHaveBeenCalled();
    expect(result.current.player).toEqual(player);
  });

  it('falls back to creating a guest player when the stored id is no longer valid', async () => {
    localStorage.setItem('chess-player-id', 'stale-id');
    vi.mocked(api.getPlayer).mockRejectedValue(new Error('not found'));
    vi.mocked(api.createPlayer).mockResolvedValue({ success: true, data: { player }, timestamp: 0 });

    const { result } = renderHook(() => usePlayer());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(localStorage.getItem('chess-player-id')).toBe('player-1');
    expect(result.current.player).toEqual(player);
  });

  it('surfaces an error when player creation fails', async () => {
    vi.mocked(api.createPlayer).mockResolvedValue({ success: false, error: 'boom', timestamp: 0 });

    const { result } = renderHook(() => usePlayer());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.player).toBeNull();
    expect(result.current.error).toBe('boom');
  });

  it('updates the current player', async () => {
    vi.mocked(api.createPlayer).mockResolvedValue({ success: true, data: { player }, timestamp: 0 });
    const updated = { ...player, nickname: 'NewName' };
    vi.mocked(api.updatePlayer).mockResolvedValue({ success: true, data: { player: updated }, timestamp: 0 });

    const { result } = renderHook(() => usePlayer());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.updatePlayer({ nickname: 'NewName' });
    });

    expect(api.updatePlayer).toHaveBeenCalledWith('player-1', { nickname: 'NewName' });
    expect(result.current.player?.nickname).toBe('NewName');
  });
});
