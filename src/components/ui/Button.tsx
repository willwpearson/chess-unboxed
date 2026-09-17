'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  children,
  ...props
}: ButtonProps) {
  const baseClasses =
    'inline-flex items-center justify-center rounded-md font-medium transition duration-150 focus:outline-none focus:ring-2 focus:ring-accent-primary focus:ring-offset-2 focus:ring-offset-surface-base disabled:opacity-50 disabled:pointer-events-none';

  const variantClasses = {
    primary: 'bg-accent-primary text-accent-primary-foreground shadow-xs hover:brightness-95 active:brightness-90',
    secondary: 'bg-surface-raised border border-border-subtle text-fg shadow-xs hover:bg-surface-hover active:bg-surface-sunken',
    outline: 'bg-transparent border border-border-subtle text-fg hover:bg-surface-hover active:bg-surface-sunken',
    ghost: 'bg-transparent text-fg hover:bg-surface-hover active:bg-surface-sunken',
    danger: 'bg-accent-danger text-accent-danger-foreground shadow-xs hover:brightness-95 active:brightness-90',
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  return (
    <button
      className={cn(baseClasses, variantClasses[variant], sizeClasses[size], className)}
      {...props}
    >
      {children}
    </button>
  );
}
