'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { UserProfile, ProfileEditor } from '@/components/user';
import { LoadingSpinner } from '@/components/ui/Loading';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
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
        <Card className="p-8 text-center">
          <h1 className="text-2xl font-bold text-fg mb-4">
            Profile Not Found
          </h1>
          <p className="text-fg-secondary">
            You need to be logged in to view your profile.
          </p>
        </Card>
      </div>
    );
  }

  const handleEditComplete = () => {
    setIsEditing(false);
  };

  return (
    <div className="min-h-screen bg-surface-base">
      <div className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <Button variant="ghost" onClick={() => router.back()} className="mb-6 gap-2">
          <ChevronLeft size={16} />
          Back
        </Button>

        {/* Header with Edit Toggle */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-fg flex items-center gap-3">
            <User size={32} className="text-accent-primary" />
            {isEditing ? 'Edit Profile' : 'My Profile'}
          </h1>

          <Button
            variant={isEditing ? 'primary' : 'secondary'}
            onClick={() => setIsEditing(!isEditing)}
            className="gap-2"
          >
            <Edit size={16} />
            <span>{isEditing ? 'Cancel' : 'Edit Profile'}</span>
          </Button>
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