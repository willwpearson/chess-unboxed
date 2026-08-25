'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { UserProfile, ProfileEditor } from '@/components/user';
import { LoadingSpinner } from '@/components/ui/Loading';
import { Edit, User, ChevronLeft } from 'lucide-react';

export default function ProfilePage() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const router = useRouter();

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

  const handleEditComplete = () => {
    setIsEditing(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="gaming-button flex items-center gap-2 mb-6 hover:bg-gaming-accent-primary/10 transition-colors"
        >
          <ChevronLeft size={16} />
          Back
        </button>

        {/* Header with Edit Toggle */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-gaming font-bold text-primary-300 flex items-center gap-3">
            <User size={32} className="text-secondary" />
            {isEditing ? 'Edit Profile' : 'My Profile'}
          </h1>
          
          <button
            onClick={() => setIsEditing(!isEditing)}
            className={`${
              isEditing ? 'gaming-button' : 'gaming-button-secondary'
            } flex items-center space-x-2`}
          >
            <Edit size={16} />
            <span>{isEditing ? 'Cancel' : 'Edit Profile'}</span>
          </button>
        </div>

        {/* Content */}
        {isEditing ? (
          <ProfileEditor 
            user={user}
            onSave={handleEditComplete}
            onCancel={handleEditComplete}
          />
        ) : (
          <UserProfile user={user} isOwnProfile={true} />
        )}
      </div>
    </div>
  );
}