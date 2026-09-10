import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IconButton } from './IconButton';

describe('IconButton', () => {
  it('requires and renders its aria-label for accessibility', () => {
    render(<IconButton aria-label="Close dialog">X</IconButton>);
    expect(screen.getByRole('button', { name: 'Close dialog' })).toBeInTheDocument();
  });

  it('fires onClick when clicked', async () => {
    const onClick = vi.fn();
    render(
      <IconButton aria-label="Close" onClick={onClick}>
        X
      </IconButton>
    );
    await userEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('applies variant-specific classes', () => {
    render(
      <IconButton aria-label="Delete" variant="danger">
        D
      </IconButton>
    );
    expect(screen.getByRole('button', { name: 'Delete' }).className).toContain('text-accent-danger');
  });

  it('applies size-specific classes', () => {
    render(
      <IconButton aria-label="Big" size="lg">
        B
      </IconButton>
    );
    expect(screen.getByRole('button', { name: 'Big' }).className).toContain('h-12');
  });
});
