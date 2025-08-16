'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { RegisterForm } from '@/components/auth/RegisterForm';
import { useAuth } from '@/hooks/useAuth';
import { ChevronLeft } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  // Redirect if already logged in
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, isLoading, router]);

  const handleRegisterSuccess = () => {
    router.push('/');
  };

  const handleSwitchToLogin = () => {
    router.push('/login');
  };

  if (isLoading) {
    return (
      <>
        <Header />
        <main className="flex-1 min-h-screen flex items-center justify-center bg-background">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-border"></div>
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
      <main className="flex-1 min-h-screen bg-background">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-md mx-auto">
            {/* Back button */}
            <div className="mb-6">
              <Link 
                href="/"
                className="flex items-center text-accent hover:text-primary transition-colors duration-300"
              >
                <ChevronLeft size={20} className="mr-1" />
                Back to Home
              </Link>
            </div>

            {/* Hero Section */}
            <div className="text-center mb-8">
              <h1 className="text-3xl font-gaming font-bold mb-2 gaming-title">
                Join Chess Unboxed
              </h1>
              <p className="text-primary-400">
                Create your account and start playing
              </p>
            </div>

            {/* Register Form */}
            <div>
              <RegisterForm
                onSuccess={handleRegisterSuccess}
                onSwitchToLogin={handleSwitchToLogin}
              />
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}