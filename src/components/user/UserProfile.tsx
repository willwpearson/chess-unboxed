/**
 * UserProfile Component
 * Displays comprehensive user profile information including stats, avatar, and bio
 */
'use client';

import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { User } from '@/hooks/useAuth';
import { 
  User as UserIcon, 
  Trophy, 
  Calendar, 
  Clock, 
  MapPin, 
  Shield, 
  TrendingUp,
  Activity,
  Target,
  Award
} from 'lucide-react';

interface UserProfileProps {
  user: User;
  isOwnProfile?: boolean;
  className?: string;
}

interface UserStatsCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  color: string;
  subtitle?: string;
}

function UserStatsCard({ title, value, icon, color, subtitle }: UserStatsCardProps) {
  return (
    <div className="gaming-card p-4 text-center">
      <div className="flex justify-center mb-3">
        <div style={{ color: color }}>
          {icon}
        </div>
      </div>
      <div className="text-2xl font-gaming font-bold mb-1" style={{ color: color }}>
        {value}
      </div>
      <div className="text-sm font-medium text-gaming-text-primary mb-1">
        {title}
      </div>
      {subtitle && (
        <div className="text-xs text-gaming-text-secondary">
          {subtitle}
        </div>
      )}
    </div>
  );
}

function UserAvatar({ user, size = 'large' }: { user: User; size?: 'small' | 'medium' | 'large' }) {
  const sizeClasses = {
    small: 'w-12 h-12 text-lg',
    medium: 'w-16 h-16 text-xl',
    large: 'w-24 h-24 text-3xl'
  };

  const borderClasses = {
    small: 'border-2',
    medium: 'border-3',
    large: 'border-4'
  };

  if (user.avatar_url) {
    return (
      <div className={`${sizeClasses[size]} ${borderClasses[size]} border-gaming-accent-primary rounded-full overflow-hidden bg-gaming-bg-tertiary flex items-center justify-center`}>
        <img
          src={user.avatar_url}
          alt={`${user.display_name}'s avatar`}
          className="w-full h-full object-cover"
          onError={(e) => {
            // Fallback to initials if image fails to load
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
            const parent = target.parentElement;
            if (parent) {
              parent.innerHTML = user.display_name.charAt(0).toUpperCase();
              parent.className += ' bg-gaming-accent-primary text-white font-gaming font-bold flex items-center justify-center';
            }
          }}
        />
      </div>
    );
  }

  // Fallback to initials
  return (
    <div 
      className={`${sizeClasses[size]} ${borderClasses[size]} border-gaming-accent-primary rounded-full bg-gaming-accent-primary text-white font-gaming font-bold flex items-center justify-center`}
    >
      {user.display_name.charAt(0).toUpperCase()}
    </div>
  );
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

function formatLastSeen(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);

  if (diffInMinutes < 5) {
    return 'Online now';
  } else if (diffInMinutes < 60) {
    return `${diffInMinutes} minutes ago`;
  } else if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
  } else if (diffInDays < 7) {
    return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
  } else {
    return formatDate(dateString);
  }
}

function calculateWinRate(wins: number, totalGames: number): number {
  if (totalGames === 0) return 0;
  return Math.round((wins / totalGames) * 100);
}

export function UserProfile({ user, isOwnProfile = false, className = '' }: UserProfileProps) {
  const winRate = calculateWinRate(user.wins, user.total_games);
  const isOnline = new Date().getTime() - new Date(user.last_seen).getTime() < 5 * 60 * 1000; // 5 minutes

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header Section */}
      <div className="gaming-card p-6">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
          {/* Avatar and Basic Info */}
          <div className="flex items-center gap-4">
            <div className="relative">
              <UserAvatar user={user} size="large" />
              {/* Online Status Indicator */}
              {isOnline && (
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-gaming-accent-secondary rounded-full border-2 border-gaming-bg-secondary flex items-center justify-center">
                  <div className="w-3 h-3 bg-gaming-accent-secondary rounded-full animate-pulse"></div>
                </div>
              )}
            </div>
            
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-gaming font-bold text-gaming-text-primary">
                  {user.display_name}
                </h1>
                {user.is_verified && (
                  <div className="flex items-center" title="Verified User">
                    <Shield size={24} style={{ color: 'var(--gaming-accent-secondary)' }} />
                  </div>
                )}
              </div>
              
              <div className="flex flex-wrap items-center gap-4 text-gaming-text-secondary">
                <span className="flex items-center gap-1">
                  <UserIcon size={16} />
                  @{user.username}
                </span>
                
                {user.country && (
                  <span className="flex items-center gap-1">
                    <MapPin size={16} />
                    {user.country}
                  </span>
                )}
                
                <span className="flex items-center gap-1">
                  <Calendar size={16} />
                  Joined {formatDate(user.created_at)}
                </span>
                
                <span className="flex items-center gap-1">
                  <Clock size={16} />
                  {formatLastSeen(user.last_seen)}
                </span>
              </div>
            </div>
          </div>
          
          {/* Rating Badge */}
          <div className="gaming-card p-4 text-center min-w-[120px]">
            <div className="text-3xl font-gaming font-bold mb-1" style={{ color: 'var(--gaming-accent-primary)' }}>
              {user.current_rating}
            </div>
            <div className="text-sm text-gaming-text-secondary mb-1">Current Rating</div>
            {user.peak_rating > user.current_rating && (
              <div className="text-xs text-gaming-text-secondary">
                Peak: {user.peak_rating}
              </div>
            )}
          </div>
        </div>
        
        {/* Bio Section */}
        {user.bio && (
          <div className="mt-6 pt-6 border-t border-gaming-border">
            <p className="text-gaming-text-primary leading-relaxed">
              {user.bio}
            </p>
          </div>
        )}
      </div>

      {/* Statistics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <UserStatsCard
          title="Total Games"
          value={user.total_games}
          icon={<Activity size={24} />}
          color="var(--gaming-accent-primary)"
          subtitle={user.total_games === 1 ? "game played" : "games played"}
        />
        
        <UserStatsCard
          title="Wins"
          value={user.wins}
          icon={<Trophy size={24} />}
          color="var(--gaming-accent-secondary)"
          subtitle={`${winRate}% win rate`}
        />
        
        <UserStatsCard
          title="Losses"
          value={user.losses}
          icon={<TrendingUp size={24} />}
          color="var(--gaming-accent-danger)"
          subtitle={user.total_games > 0 ? `${Math.round((user.losses / user.total_games) * 100)}% of games` : ""}
        />
        
        <UserStatsCard
          title="Draws"
          value={user.draws}
          icon={<Target size={24} />}
          color="#fbbf24"
          subtitle={user.total_games > 0 ? `${Math.round((user.draws / user.total_games) * 100)}% of games` : ""}
        />
      </div>

      {/* Detailed Stats */}
      <div className="gaming-card p-6">
        <div className="flex items-center space-x-3 mb-6">
          <Award size={24} style={{ color: 'var(--gaming-accent-primary)' }} />
          <h2 className="text-2xl font-gaming font-bold text-gaming-text-primary">Performance Overview</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Rating Progress */}
          <div className="gaming-card p-4">
            <h3 className="font-gaming font-semibold text-gaming-text-primary mb-3">Rating Progress</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gaming-text-secondary">Current</span>
                <span className="font-gaming font-bold" style={{ color: 'var(--gaming-accent-primary)' }}>
                  {user.current_rating}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gaming-text-secondary">Peak</span>
                <span className="font-gaming font-bold" style={{ color: 'var(--gaming-accent-secondary)' }}>
                  {user.peak_rating}
                </span>
              </div>
              {user.peak_rating > user.current_rating && (
                <div className="text-xs text-gaming-text-secondary text-center pt-2">
                  {user.peak_rating - user.current_rating} points from peak
                </div>
              )}
            </div>
          </div>
          
          {/* Win Distribution */}
          <div className="gaming-card p-4">
            <h3 className="font-gaming font-semibold text-gaming-text-primary mb-3">Game Results</h3>
            <div className="space-y-2">
              {user.total_games > 0 ? (
                <>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'var(--gaming-accent-secondary)' }}></div>
                      <span className="text-sm text-gaming-text-secondary">Wins</span>
                    </div>
                    <span className="text-sm font-gaming">{user.wins} ({winRate}%)</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'var(--gaming-accent-danger)' }}></div>
                      <span className="text-sm text-gaming-text-secondary">Losses</span>
                    </div>
                    <span className="text-sm font-gaming">{user.losses} ({Math.round((user.losses / user.total_games) * 100)}%)</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                      <span className="text-sm text-gaming-text-secondary">Draws</span>
                    </div>
                    <span className="text-sm font-gaming">{user.draws} ({Math.round((user.draws / user.total_games) * 100)}%)</span>
                  </div>
                </>
              ) : (
                <div className="text-center text-gaming-text-secondary py-4">
                  No games played yet
                </div>
              )}
            </div>
          </div>
          
          {/* Activity Status */}
          <div className="gaming-card p-4">
            <h3 className="font-gaming font-semibold text-gaming-text-primary mb-3">Activity</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${isOnline ? 'bg-gaming-accent-secondary animate-pulse' : 'bg-gaming-text-secondary'}`}></div>
                <span className="text-sm text-gaming-text-secondary">
                  {isOnline ? 'Online now' : 'Offline'}
                </span>
              </div>
              <div className="text-xs text-gaming-text-secondary">
                Last seen: {formatLastSeen(user.last_seen)}
              </div>
              <div className="text-xs text-gaming-text-secondary">
                Member since: {formatDate(user.created_at)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}