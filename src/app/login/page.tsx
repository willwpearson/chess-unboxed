'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { LoginForm } from '@/components/auth/LoginForm';
import { useAuth } from '@/hooks/useAuth';
import { ChevronLeft } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  // Redirect if already logged in
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, isLoading, router]);

  const handleLoginSuccess = () => {
    router.push('/');
  };

  const handleSwitchToRegister = () => {
    router.push('/register');
  };

  if (isLoading) {
    return (
      <>
        <Header />
        <main className="flex-1 min-h-screen flex items-center justify-center bg-surface-base">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-border-subtle border-t-accent-primary"></div>
        </main>
        <Footer />
      </>
    );
  }

  if (isAuthenticated) {
    return null; // Will redirect
  }

  return (
    <>
      <Header />
      <main className="flex-1 min-h-screen bg-surface-base">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-md mx-auto">
            {/* Back button */}
            <div className="mb-6">
              <Link
                href="/"
                className="flex items-center text-accent-primary hover:text-fg transition-colors duration-300"
              >
                <ChevronLeft size={20} className="mr-1" />
                Back to Home
              </Link>
            </div>

            {/* Hero Section */}
            <div className="text-center mb-8">
              <h1 className="text-3xl font-gaming font-bold mb-2 bg-gradient-to-r from-accent-primary to-accent-secondary bg-clip-text text-transparent">
                Welcome Back
              </h1>
              <p className="text-fg-secondary">
                Sign in to your account
              </p>
            </div>

            {/* Login Form */}
            <div>
              <LoginForm
                onSuccess={handleLoginSuccess}
                onSwitchToRegister={handleSwitchToRegister}
              />
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}