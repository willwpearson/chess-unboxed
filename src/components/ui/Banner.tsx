'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface BannerProps {
  variant: 'success' | 'danger';
  children: React.ReactNode;
  className?: string;
}

export function Banner({ variant, children, className }: BannerProps) {
  return (
    <div
      className={cn(
        'rounded-lg p-4 font-semibold text-center',
        variant === 'success' && 'bg-status-success text-white border border-status-success/40',
        variant === 'danger' && 'bg-status-danger text-white',
        className
      )}
    >
      {children}
    </div>
  );
}
