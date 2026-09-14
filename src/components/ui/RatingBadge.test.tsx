import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RatingBadge } from './RatingBadge';

describe('RatingBadge', () => {
  it('renders the rating', () => {
    render(<RatingBadge rating={1350} />);
    expect(screen.getByText('1350')).toBeInTheDocument();
  });

  it('shows a positive delta with a plus sign and success styling', () => {
    render(<RatingBadge rating={1350} delta={14} />);
    const deltaEl = screen.getByText('+14');
    expect(deltaEl.className).toContain('text-status-success');
  });

  it('shows a negative delta with danger styling', () => {
    render(<RatingBadge rating={1350} delta={-9} />);
    const deltaEl = screen.getByText('-9');
    expect(deltaEl.className).toContain('text-status-danger');
  });

  it('omits the delta badge when delta is zero or absent', () => {
    render(<RatingBadge rating={1350} delta={0} />);
    expect(screen.queryByText('+0')).not.toBeInTheDocument();
  });

  it('shows peak rating only when it exceeds the current rating', () => {
    render(<RatingBadge rating={1350} peakRating={1420} />);
    expect(screen.getByText('(peak 1420)')).toBeInTheDocument();
  });

  it('hides peak rating when it equals the current rating', () => {
    render(<RatingBadge rating={1350} peakRating={1350} />);
    expect(screen.queryByText(/peak/)).not.toBeInTheDocument();
  });
});
