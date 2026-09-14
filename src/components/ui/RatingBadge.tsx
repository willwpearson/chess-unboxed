'use client';

import React from 'react';
import { Badge } from './Badge';

interface RatingBadgeProps {
  rating: number;
  peakRating?: number;
  delta?: number | null;
  size?: 'sm' | 'md';
  className?: string;
}

// Small wrapper around Badge for displaying an Elo-style rating (puzzle or
// game) with an optional color-coded delta from a just-applied result. No
// reusable rating display existed before this — GameInfo.tsx previously
// inlined its rating in a bare <div>.
export function RatingBadge({ rating, peakRating, delta, size = 'sm', className }: RatingBadgeProps) {
  return (
    <span className={className}>
      <Badge variant="default" size={size}>
        {rating}
      </Badge>
      {typeof delta === 'number' && delta !== 0 && (
        <Badge variant={delta > 0 ? 'success' : 'danger'} size={size} className="ml-1">
          {delta > 0 ? '+' : ''}
          {delta}
        </Badge>
      )}
      {typeof peakRating === 'number' && peakRating > rating && (
        <span className="ml-1 text-xs text-fg-muted">(peak {peakRating})</span>
      )}
    </span>
  );
}
