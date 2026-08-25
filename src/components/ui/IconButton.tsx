'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface IconButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'aria-label'> {
  variant?: 'ghost' | 'solid' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  'aria-label': string;
}

export function IconButton({
  variant = 'ghost',
  size = 'md',
  className,
  children,
  ...props
}: IconButtonProps) {
  const baseClasses =
    'inline-flex items-center justify-center rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-accent-primary focus:ring-offset-2 focus:ring-offset-surface-base disabled:opacity-50 disabled:pointer-events-none disabled:translate-y-0 disabled:scale-100 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]';

  const variantClasses = {
    ghost: 'bg-transparent text-fg-secondary hover:bg-surface-hover hover:text-fg',
    solid: 'bg-surface-raised border border-border-subtle text-fg shadow-xs hover:shadow-sm',
    danger: 'bg-transparent text-accent-danger hover:bg-accent-danger/10',
  };

  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-12 w-12',
  };

  return (
    <button className={cn(baseClasses, variantClasses[variant], sizeClasses[size], className)} {...props}>
      {children}
    </button>
  );
}
