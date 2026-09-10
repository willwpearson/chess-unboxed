import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Badge } from './Badge';

describe('Badge', () => {
  it('renders its children', () => {
    render(<Badge>New</Badge>);
    expect(screen.getByText('New')).toBeInTheDocument();
  });

  it('applies the default variant when none is given', () => {
    render(<Badge>Default</Badge>);
    expect(screen.getByText('Default').className).toContain('bg-surface-hover');
  });

  it('applies variant-specific classes', () => {
    render(<Badge variant="success">Won</Badge>);
    expect(screen.getByText('Won').className).toContain('text-status-success');
  });

  it('applies size-specific classes', () => {
    render(<Badge size="md">Big</Badge>);
    expect(screen.getByText('Big').className).toContain('text-sm');
  });

  it('merges a custom className', () => {
    render(<Badge className="extra-class">Tag</Badge>);
    expect(screen.getByText('Tag').className).toContain('extra-class');
  });
});
