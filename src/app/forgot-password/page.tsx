'use client';

import React from 'react';
import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { ForgotPasswordForm } from '@/components/auth/ForgotPasswordForm';
import { ChevronLeft } from 'lucide-react';

export default function ForgotPasswordPage() {
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
              <p className="text-fg-secondary">
                We&apos;ll email you a link to get back into your account
              </p>
            </div>

            <div>
              <ForgotPasswordForm />
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
