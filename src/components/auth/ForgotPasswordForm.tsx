'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

export function ForgotPasswordForm() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const { forgotPassword } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const result = await forgotPassword(email);
      if (result.success) {
        setSubmitted(true);
      } else {
        setError(result.error || 'Something went wrong. Please try again.');
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
          <h2 className="text-2xl font-bold text-fg mb-2">Check your email</h2>
          <p className="text-sm text-fg-secondary">
            If that email exists, we&apos;ve sent a link to reset your password. It expires in 30 minutes.
          </p>
          <Link
            href="/login"
            className="inline-block mt-6 text-accent-primary hover:text-fg font-medium"
          >
            Back to Sign In
          </Link>
        </div>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto p-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-fg">Forgot Password</h2>
        <p className="text-sm text-fg-secondary mt-2">
          Enter your email and we&apos;ll send you a link to reset your password.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-fg-secondary mb-1">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-3 py-2 border border-border-subtle rounded-md bg-surface-sunken text-fg placeholder:text-fg-muted focus:outline-none focus:ring-2 focus:ring-accent-primary"
            placeholder="Enter your email"
            disabled={isLoading}
          />
        </div>

        {error && (
          <div className="text-status-danger text-sm bg-status-danger/10 p-3 rounded-md">
            {error}
          </div>
        )}

        <Button type="submit" variant="primary" className="w-full" disabled={isLoading}>
          {isLoading ? 'Sending...' : 'Send Reset Link'}
        </Button>
      </form>

      <div className="mt-6 text-center">
        <Link href="/login" className="text-sm text-accent-primary hover:text-fg font-medium">
          Back to Sign In
        </Link>
      </div>
    </Card>
  );
}
