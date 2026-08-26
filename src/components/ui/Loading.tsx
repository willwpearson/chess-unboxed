'use client';

import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function LoadingSpinner({ size = 'md', className = '' }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
  };

  return (
    <div className={`inline-flex items-center justify-center ${className}`}>
      <div className={`animate-spin rounded-full border-2 border-border-subtle border-t-accent-primary ${sizeClasses[size]}`} />
    </div>
  );
}

interface LoadingStateProps {
  children: React.ReactNode;
  className?: string;
}

export function LoadingState({ children, className = '' }: LoadingStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center py-12 ${className}`}>
      <LoadingSpinner size="lg" className="mb-4" />
      <p className="text-fg-secondary text-center">{children}</p>
    </div>
  );
}
