'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { UserProfile } from '@/components/user/UserProfile';
import { LoadingSpinner } from '@/components/ui/Loading';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { User } from '@/hooks/useAuth';
import { ChevronLeft } from 'lucide-react';

interface ProfilePageProps {
  params: Promise<{ username: string }>;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export default function UserProfilePage({ params }: ProfilePageProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const resolvedParams = await params;
        const response = await fetch(`/api/users/profile/${resolvedParams.username}`, {
          credentials: 'include'
        });
        
        const data: ApiResponse<{ user: User }> = await response.json();
        
        if (data.success && data.data?.user) {
          setUser(data.data.user);
        } else {
          setError(data.error || 'User not found');
        }
      } catch (err) {
        setError('Failed to load user profile');
        console.error('Profile fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [params]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-8 text-center">
          <h1 className="text-2xl font-bold text-fg mb-4">
            Profile Not Found
          </h1>
          <p className="text-status-danger">
            {error || 'The user you are looking for does not exist.'}
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-base">
      <div className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <Button variant="ghost" onClick={() => router.back()} className="mb-6 gap-2">
          <ChevronLeft size={16} />
          Back
        </Button>

        <UserProfile user={user} isOwnProfile={false} />
      </div>
    </div>
  );
}