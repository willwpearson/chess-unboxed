import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { useAuth } from './useAuth';

function jsonResponse(body: unknown, ok = true, status = ok ? 200 : 400) {
  return {
    ok,
    status,
    json: async () => body,
  } as Response;
}

const mockUser = {
  id: 'u1',
  email: 'alice@example.com',
  username: 'alice',
  display_name: 'Alice',
  current_rating: 1200,
  peak_rating: 1200,
  total_games: 0,
  wins: 0,
  losses: 0,
  draws: 0,
  is_verified: false,
  created_at: '2024-01-01T00:00:00.000Z',
  last_seen: '2024-01-01T00:00:00.000Z',
};

describe('useAuth', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  it('starts unauthenticated when /auth/me returns no session', async () => {
    vi.mocked(fetch).mockResolvedValue(jsonResponse({ success: false, error: 'Not authenticated' }, false, 401));

    const { result } = renderHook(() => useAuth());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
  });

  it('logs in successfully and stores the user', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(jsonResponse({ success: false, error: 'Not authenticated' }, false, 401)) // mount refreshUser
      .mockResolvedValueOnce(jsonResponse({ success: true, data: { user: mockUser } })); // login

    const { result } = renderHook(() => useAuth());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    let loginResult: { success: boolean; error?: string } | undefined;
    await act(async () => {
      loginResult = await result.current.login('alice', 'password123');
    });

    expect(loginResult).toEqual({ success: true });
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user?.username).toBe('alice');
  });

  it('surfaces a login failure without throwing', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(jsonResponse({ success: false, error: 'Not authenticated' }, false, 401))
      .mockResolvedValueOnce(jsonResponse({ success: false, error: 'Invalid credentials' }));

    const { result } = renderHook(() => useAuth());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    let loginResult: { success: boolean; error?: string } | undefined;
    await act(async () => {
      loginResult = await result.current.login('alice', 'wrong');
    });

    expect(loginResult).toEqual({ success: false, error: 'Invalid credentials' });
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('clears state on logout even if the request throws', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(jsonResponse({ success: true, data: { user: mockUser } })) // mount refreshUser
      .mockRejectedValueOnce(new Error('network down')); // logout

    const { result } = renderHook(() => useAuth());
    await waitFor(() => expect(result.current.isAuthenticated).toBe(true));

    await act(async () => {
      await result.current.logout();
    });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
  });

  it('forgotPassword surfaces the generic success message', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(jsonResponse({ success: false, error: 'Not authenticated' }, false, 401)) // mount refreshUser
      .mockResolvedValueOnce(
        jsonResponse({ success: true, data: { message: 'If that email exists, a reset link was sent.' } })
      );

    const { result } = renderHook(() => useAuth());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    let forgotResult: { success: boolean; error?: string; message?: string } | undefined;
    await act(async () => {
      forgotResult = await result.current.forgotPassword('alice@example.com');
    });

    expect(forgotResult).toEqual({ success: true, message: 'If that email exists, a reset link was sent.' });
  });

  it('resetPassword surfaces a server error without throwing', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(jsonResponse({ success: false, error: 'Not authenticated' }, false, 401))
      .mockResolvedValueOnce(jsonResponse({ success: false, error: 'Invalid or expired reset link.' }, false, 400));

    const { result } = renderHook(() => useAuth());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    let resetResult: { success: boolean; error?: string; message?: string } | undefined;
    await act(async () => {
      resetResult = await result.current.resetPassword('bad-token', 'newpassword');
    });

    expect(resetResult).toEqual({ success: false, error: 'Invalid or expired reset link.' });
  });
});
