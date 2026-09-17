import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BotDifficultySelector } from './BotDifficultySelector';

describe('BotDifficultySelector', () => {
  it('renders only difficulty options, no personality selection', () => {
    render(<BotDifficultySelector onStartGame={vi.fn()} />);

    expect(screen.getByText('Beginner')).toBeInTheDocument();
    expect(screen.getByText('Intermediate')).toBeInTheDocument();
    expect(screen.getByText('Advanced')).toBeInTheDocument();
    expect(screen.getByText('Grandmaster')).toBeInTheDocument();

    expect(screen.queryByText('Bot Personality')).not.toBeInTheDocument();
    expect(screen.queryByText('Aggressive')).not.toBeInTheDocument();
    expect(screen.queryByText('Defensive')).not.toBeInTheDocument();
    expect(screen.queryByText('Balanced')).not.toBeInTheDocument();
  });

  it('calls onStartGame with only a difficulty when a level is chosen', async () => {
    const onStartGame = vi.fn();
    render(<BotDifficultySelector onStartGame={onStartGame} />);

    await userEvent.click(screen.getByText('Intermediate'));
    await userEvent.click(screen.getByRole('button', { name: /Start Game vs Intermediate/i }));

    expect(onStartGame).toHaveBeenCalledWith({ difficulty: 'Intermediate' });
  });
});
