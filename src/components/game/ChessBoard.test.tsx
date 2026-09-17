import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ChessBoard } from './ChessBoard';

describe('ChessBoard action buttons', () => {
  it('renders Draw and Resign but no Clear button', () => {
    render(
      <ChessBoard
        onMove={vi.fn()}
        onOfferDraw={vi.fn()}
        onResign={vi.fn()}
        currentPlayer="white"
        isPlayerTurn
        showActionButtons
      />
    );

    expect(screen.getByText('Draw')).toBeInTheDocument();
    expect(screen.getByText('Resign')).toBeInTheDocument();
    expect(screen.queryByText('Clear')).not.toBeInTheDocument();
  });

  it('renders nothing in the action row when showActionButtons is false', () => {
    render(
      <ChessBoard
        onMove={vi.fn()}
        onOfferDraw={vi.fn()}
        onResign={vi.fn()}
        currentPlayer="white"
        isPlayerTurn
        showActionButtons={false}
      />
    );

    expect(screen.queryByText('Draw')).not.toBeInTheDocument();
    expect(screen.queryByText('Resign')).not.toBeInTheDocument();
  });
});

describe('ChessBoard check indicator', () => {
  it('highlights the king in check but not other squares', () => {
    render(
      <ChessBoard
        fen="4k3/8/8/8/8/8/8/K3Q3 b - - 0 1"
        gameVariant="unboxed"
        onMove={vi.fn()}
        currentPlayer="black"
        isPlayerTurn
        showActionButtons={false}
        showTurnIndicator={false}
      />
    );

    expect(document.querySelector('[data-square="e8"]')).toHaveClass('check');
    expect(document.querySelector('[data-square="a1"]')).not.toHaveClass('check');
    expect(document.querySelector('[data-square="e1"]')).not.toHaveClass('check');
  });

  it('does not highlight any square when no king is in check', () => {
    render(
      <ChessBoard
        onMove={vi.fn()}
        currentPlayer="white"
        isPlayerTurn
        showActionButtons={false}
        showTurnIndicator={false}
      />
    );

    expect(document.querySelector('.chess-square.check')).not.toBeInTheDocument();
  });

  it('keeps the king highlighted on checkmate', () => {
    render(
      <ChessBoard
        fen="rnb1kbnr/pppp1ppp/8/4p3/6Pq/5P2/PPPPP2P/RNBQKBNR w KQkq - 1 3"
        gameVariant="unboxed"
        onMove={vi.fn()}
        currentPlayer="white"
        isPlayerTurn={false}
        showActionButtons={false}
        showTurnIndicator={false}
      />
    );

    expect(document.querySelector('[data-square="e1"]')).toHaveClass('check');
  });
});

describe('ChessBoard wraparound portal', () => {
  it('renders a reduced, symmetric set of particles for unboxed games', () => {
    render(
      <ChessBoard
        onMove={vi.fn()}
        currentPlayer="white"
        isPlayerTurn
        gameVariant="unboxed"
        showActionButtons={false}
        showTurnIndicator={false}
      />
    );

    const particles = document.querySelectorAll('[data-testid="portal-particle"]');
    // 2 portals x (6 primary + 3 secondary) particles
    expect(particles.length).toBe(18);
  });
});
