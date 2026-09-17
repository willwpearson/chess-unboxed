import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GameOverModal } from './GameOverModal';

vi.mock('canvas-confetti', () => ({
  default: vi.fn(),
}));

import confetti from 'canvas-confetti';

describe('GameOverModal', () => {
  beforeEach(() => {
    vi.mocked(confetti).mockClear();
  });

  it('shows "You won" and fires confetti when the viewer won', () => {
    render(
      <GameOverModal
        isOpen
        onClose={vi.fn()}
        result="white-wins"
        endReason="checkmate"
        perspective="white"
      />
    );

    expect(screen.getByText('You won!')).toBeInTheDocument();
    expect(screen.getByText('checkmate')).toBeInTheDocument();
    expect(confetti).toHaveBeenCalledTimes(1);
  });

  it('shows "You lost" and does not fire confetti when the opponent won', () => {
    render(
      <GameOverModal
        isOpen
        onClose={vi.fn()}
        result="black-wins"
        endReason="checkmate"
        perspective="white"
      />
    );

    expect(screen.getByText('You lost')).toBeInTheDocument();
    expect(confetti).not.toHaveBeenCalled();
  });

  it('shows "Draw" and does not fire confetti on a draw', () => {
    render(
      <GameOverModal isOpen onClose={vi.fn()} result="draw" perspective="white" />
    );

    expect(screen.getByText('Draw')).toBeInTheDocument();
    expect(confetti).not.toHaveBeenCalled();
  });

  it('calls onNewGame when "New Game" is clicked', async () => {
    const onNewGame = vi.fn();
    render(
      <GameOverModal
        isOpen
        onClose={vi.fn()}
        result="white-wins"
        perspective="white"
        onNewGame={onNewGame}
      />
    );

    await userEvent.click(screen.getByRole('button', { name: 'New Game' }));
    expect(onNewGame).toHaveBeenCalledTimes(1);
  });

  it('renders nothing when closed', () => {
    render(
      <GameOverModal isOpen={false} onClose={vi.fn()} result="white-wins" perspective="white" />
    );

    expect(screen.queryByText('You won!')).not.toBeInTheDocument();
    expect(confetti).not.toHaveBeenCalled();
  });
});
