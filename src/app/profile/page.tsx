'use client';

import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { UserProfile } from '@/components/user/UserProfile';
import { LoadingSpinner } from '@/components/ui/Loading';

export default function ProfilePage() {
  const { user, isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="gaming-card p-8 text-center">
          <h1 className="text-2xl font-gaming font-bold text-gaming-text-primary mb-4">
            Profile Not Found
          </h1>
          <p className="text-gaming-text-secondary">
            You need to be logged in to view your profile.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--gaming-bg-primary)' }}>
      <div className="container mx-auto px-4 py-8">
        <UserProfile user={user} isOwnProfile={true} />
      </div>
    </div>
  );
}