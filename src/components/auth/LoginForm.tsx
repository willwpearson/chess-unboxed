'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

interface LoginFormProps {
  onSuccess?: () => void;
  onSwitchToRegister?: () => void;
}

export function LoginForm({ onSuccess, onSwitchToRegister }: LoginFormProps) {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const result = await login(identifier, password);
      
      if (result.success) {
        onSuccess?.();
      } else {
        setError(result.error || 'Login failed');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto p-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-fg">
          Sign In
        </h2>
        <p className="text-sm text-fg-secondary mt-2">
          Welcome back! Please sign in to your account.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="identifier" className="block text-sm font-medium text-fg-secondary mb-1">
            Email or Username
          </label>
          <input
            id="identifier"
            type="text"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            required
            className="w-full px-3 py-2 border border-border-subtle rounded-md bg-surface-sunken text-fg placeholder:text-fg-muted focus:outline-none focus:ring-2 focus:ring-accent-primary"
            placeholder="Enter your email or username"
            disabled={isLoading}
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label htmlFor="password" className="block text-sm font-medium text-fg-secondary">
              Password
            </label>
            <Link href="/forgot-password" className="text-sm text-accent-primary hover:text-fg font-medium">
              Forgot password?
            </Link>
          </div>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full px-3 py-2 border border-border-subtle rounded-md bg-surface-sunken text-fg placeholder:text-fg-muted focus:outline-none focus:ring-2 focus:ring-accent-primary"
            placeholder="Enter your password"
            disabled={isLoading}
          />
        </div>

        {error && (
          <div className="text-status-danger text-sm bg-status-danger/10 p-3 rounded-md">
            {error}
          </div>
        )}

        <Button
          type="submit"
          variant="primary"
          className="w-full"
          disabled={isLoading}
        >
          {isLoading ? 'Signing In...' : 'Sign In'}
        </Button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-sm text-fg-secondary">
          Don't have an account?{' '}
          <button
            type="button"
            onClick={onSwitchToRegister}
            className="text-accent-primary hover:text-fg font-medium cursor-pointer"
          >
            Sign up
          </button>
        </p>
      </div>
    </Card>
  );
}