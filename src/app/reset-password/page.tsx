'use client';

import React, { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { ResetPasswordForm } from '@/components/auth/ResetPasswordForm';
import { Card } from '@/components/ui/Card';
import { ChevronLeft } from 'lucide-react';

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  if (!token) {
    return (
      <Card className="w-full max-w-md mx-auto p-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-fg mb-2">Invalid link</h2>
          <p className="text-sm text-fg-secondary">
            This password reset link is missing or malformed.
          </p>
          <Link
            href="/forgot-password"
            className="inline-block mt-6 text-accent-primary hover:text-fg font-medium"
          >
            Request a new link
          </Link>
        </div>
      </Card>
    );
  }

  return <ResetPasswordForm token={token} />;
}

export default function ResetPasswordPage() {
  return (
    <>
      <Header />
      <main className="flex-1 min-h-screen bg-surface-base">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-md mx-auto">
            <div className="mb-6">
              <Link
                href="/login"
                className="flex items-center text-accent-primary hover:text-fg transition-colors duration-300"
              >
                <ChevronLeft size={20} className="mr-1" />
                Back to Sign In
              </Link>
            </div>

            <div className="text-center mb-8">
              <h1 className="text-3xl font-gaming font-bold mb-2 bg-gradient-to-r from-accent-primary to-accent-secondary bg-clip-text text-transparent">
                Reset Password
              </h1>
            </div>

            <div>
              <Suspense fallback={<div className="text-center text-fg-secondary">Loading...</div>}>
                <ResetPasswordContent />
              </Suspense>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
