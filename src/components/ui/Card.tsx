'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'elevated' | 'flat';
  interactive?: boolean;
}

export function Card({ children, className, variant = 'elevated', interactive = false }: CardProps) {
  return (
    <div
      className={cn(
        'bg-surface-raised rounded-lg border border-border-subtle',
        variant === 'elevated' && 'shadow-sm',
        interactive && 'hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer',
        className
      )}
    >
      {children}
    </div>
  );
}

interface CardSectionProps {
  children: React.ReactNode;
  className?: string;
}

export function CardHeader({ children, className }: CardSectionProps) {
  return <div className={cn('px-6 py-4 border-b border-border-subtle', className)}>{children}</div>;
}

export function CardContent({ children, className }: CardSectionProps) {
  return <div className={cn('px-6 py-4', className)}>{children}</div>;
}

export function CardFooter({ children, className }: CardSectionProps) {
  return <div className={cn('px-6 py-4 border-t border-border-subtle', className)}>{children}</div>;
}
