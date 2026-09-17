import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Header } from './Header';

const useAuthMock = vi.fn();
vi.mock('@/hooks/useAuth', () => ({ useAuth: () => useAuthMock() }));
vi.mock('@/components/providers/ThemeProvider', () => ({
  useTheme: () => ({ resolvedTheme: 'dark', toggleTheme: vi.fn() }),
}));

function authedUser(overrides: Record<string, any> = {}) {
  return {
    id: 'user-1',
    username: 'tester',
    display_name: 'Tester',
    current_rating: 1200,
    ...overrides,
  };
}

describe('Header', () => {
  it('links to /puzzles when authenticated', () => {
    useAuthMock.mockReturnValue({ user: authedUser(), isAuthenticated: true, logout: vi.fn() });
    render(<Header />);

    const link = screen.getByRole('link', { name: /puzzles/i });
    expect(link).toHaveAttribute('href', '/puzzles');
  });

  it('omits the nav links when logged out', () => {
    useAuthMock.mockReturnValue({ user: null, isAuthenticated: false, logout: vi.fn() });
    render(<Header />);

    expect(screen.queryByRole('link', { name: /puzzles/i })).not.toBeInTheDocument();
  });
});
