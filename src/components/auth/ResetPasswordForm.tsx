'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

interface ResetPasswordFormProps {
  token: string;
}

export function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const { resetPassword } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);

    try {
      const result = await resetPassword(token, newPassword);
      if (result.success) {
        setSubmitted(true);
      } else {
        setError(result.error || 'This link is invalid or has expired.');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  if (submitted) {
    return (
      <Card className="w-full max-w-md mx-auto p-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-fg mb-2">Password reset</h2>
          <p className="text-sm text-fg-secondary">
            Your password has been reset. Please sign in with your new password.
          </p>
          <Link
            href="/login"
            className="inline-block mt-6 text-accent-primary hover:text-fg font-medium"
          >
            Sign In
          </Link>
        </div>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto p-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-fg">Reset Password</h2>
        <p className="text-sm text-fg-secondary mt-2">Enter a new password for your account.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="newPassword" className="block text-sm font-medium text-fg-secondary mb-1">
            New Password
          </label>
          <input
            id="newPassword"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            minLength={6}
            className="w-full px-3 py-2 border border-border-subtle rounded-md bg-surface-sunken text-fg placeholder:text-fg-muted focus:outline-none focus:ring-2 focus:ring-accent-primary"
            placeholder="Enter your new password"
            disabled={isLoading}
          />
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-fg-secondary mb-1">
            Confirm Password
          </label>
          <input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={6}
            className="w-full px-3 py-2 border border-border-subtle rounded-md bg-surface-sunken text-fg placeholder:text-fg-muted focus:outline-none focus:ring-2 focus:ring-accent-primary"
            placeholder="Confirm your new password"
            disabled={isLoading}
          />
        </div>

        {error && (
          <div className="text-status-danger text-sm bg-status-danger/10 p-3 rounded-md">
            {error}
            {error.toLowerCase().includes('invalid') || error.toLowerCase().includes('expired') ? (
              <>
                {' '}
                <Link href="/forgot-password" className="underline">
                  Request a new link
                </Link>
              </>
            ) : null}
          </div>
        )}

        <Button type="submit" variant="primary" className="w-full" disabled={isLoading}>
          {isLoading ? 'Resetting...' : 'Reset Password'}
        </Button>
      </form>
    </Card>
  );
}
