'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { useAuth } from '@/hooks/useAuth';
import { Card } from '@/components/ui/Card';
import { LoadingSpinner } from '@/components/ui/Loading';
import { Trophy, Gamepad2, TrendingUp, Target, Bot, Users, Swords } from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <>
        <Header />
        <main className="flex-1 min-h-screen flex items-center justify-center bg-surface-base">
          <LoadingSpinner size="lg" />
        </main>
        <Footer />
      </>
    );
  }

  if (!isAuthenticated || !user) {
    return null; // Will redirect
  }

  const winRate = user.total_games > 0 ? ((user.wins / user.total_games) * 100).toFixed(1) : '0.0';

  return (
    <>
      <Header />
      <main className="flex-1 min-h-screen bg-surface-base">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-6xl mx-auto">
            {/* Welcome Section */}
            <div className="text-center mb-8">
              <h1 className="text-3xl md:text-4xl font-bold mb-2 text-fg">
                Welcome, {user.display_name || user.username}!
              </h1>
              <p className="text-fg-secondary">
                Ready for another game?
              </p>
            </div>

            {/* Play Now */}
            <div className="mb-12 grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-5xl mx-auto">
              <Card interactive className="relative p-8 text-center overflow-hidden group bg-gradient-to-br from-accent-primary/10 to-accent-secondary/10">
                <Link href="/play/unboxed/bot" className="absolute inset-0" aria-label="Play vs Bot" />
                <div className="absolute top-4 right-4 opacity-40 group-hover:opacity-70 transition-opacity text-accent-primary">
                  <Bot size={60} />
                </div>
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-r from-accent-primary to-accent-secondary text-white mb-6 relative z-10">
                  <Bot size={40} />
                </div>
                <h3 className="text-xl font-bold text-fg mb-3">Play vs Bot</h3>
                <p className="text-fg-secondary mb-4">Practice against the AI with adjustable difficulty levels</p>
                <div className="text-sm text-fg-secondary space-y-1">
                  <div>• Multiple difficulty levels</div>
                  <div>• Perfect for practice</div>
                  <div>• Instant matches</div>
                </div>
              </Card>

              <Card interactive className="relative p-8 text-center overflow-hidden group bg-gradient-to-br from-blue-500/10 to-cyan-600/10">
                <Link href="/play/unboxed/private" className="absolute inset-0" aria-label="Play with a Friend" />
                <div className="absolute top-4 right-4 opacity-40 group-hover:opacity-70 transition-opacity text-blue-500">
                  <Users size={60} />
                </div>
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-r from-blue-500 to-cyan-600 text-white mb-6 relative z-10">
                  <Users size={40} />
                </div>
                <h3 className="text-xl font-bold text-fg mb-3">Play with a Friend</h3>
                <p className="text-fg-secondary mb-4">Create a private lobby and share the invite code</p>
                <div className="text-sm text-fg-secondary space-y-1">
                  <div>• Invite-code lobbies</div>
                  <div>• Choose your time control</div>
                  <div>• Just the two of you</div>
                </div>
              </Card>

              <Card interactive className="relative p-8 text-center overflow-hidden group bg-gradient-to-br from-amber-500/10 to-orange-600/10">
                <Link href="/play/unboxed/quick-match" className="absolute inset-0" aria-label="Quick Match" />
                <div className="absolute top-4 right-4 opacity-40 group-hover:opacity-70 transition-opacity text-amber-500">
                  <Swords size={60} />
                </div>
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-r from-amber-500 to-orange-600 text-white mb-6 relative z-10">
                  <Swords size={40} />
                </div>
                <h3 className="text-xl font-bold text-fg mb-3">Quick Match</h3>
                <p className="text-fg-secondary mb-4">Get paired with an opponent, ranked or casual</p>
                <div className="text-sm text-fg-secondary space-y-1">
                  <div>• Automatic pairing</div>
                  <div>• Ranked ELO or casual play</div>
                  <div>• Bullet to classical</div>
                </div>
              </Card>
            </div>

            {/* Quick Actions */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-fg mb-6">Quick Actions</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-md mx-auto">
                <Card interactive className="relative p-6 text-center">
                  <Link href="/profile" className="absolute inset-0" aria-label="Profile" />
                  <Target size={40} className="mx-auto mb-3 text-accent-primary" />
                  <h3 className="font-bold text-fg mb-2">Profile</h3>
                  <p className="text-sm text-fg-secondary">View and edit your profile</p>
                </Card>

                <Card interactive className="relative p-6 text-center">
                  <Link href="/settings" className="absolute inset-0" aria-label="Settings" />
                  <TrendingUp size={40} className="mx-auto mb-3 text-accent-primary" />
                  <h3 className="font-bold text-fg mb-2">Settings</h3>
                  <p className="text-sm text-fg-secondary">Customize your experience</p>
                </Card>
              </div>
            </div>

            {/* Profile Information */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-fg mb-6">Your Profile</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="p-6 text-center">
                  <Trophy size={32} className="mx-auto mb-3 text-accent-primary" />
                  <h3 className="text-2xl font-bold text-fg mb-1">{user.current_rating}</h3>
                  <p className="text-fg-secondary">Current Rating</p>
                  <p className="text-sm text-fg-secondary mt-1">Peak: {user.peak_rating}</p>
                </Card>

                <Card className="p-6 text-center">
                  <Gamepad2 size={32} className="mx-auto mb-3 text-accent-primary" />
                  <h3 className="text-2xl font-bold text-fg mb-1">{user.total_games}</h3>
                  <p className="text-fg-secondary">Games Played</p>
                </Card>

                <Card className="p-6 text-center">
                  <TrendingUp size={32} className="mx-auto mb-3 text-accent-primary" />
                  <h3 className="text-2xl font-bold text-fg mb-1">{winRate}%</h3>
                  <p className="text-fg-secondary">Win Rate</p>
                  <p className="text-sm text-fg-secondary mt-1">{user.wins}W {user.losses}L {user.draws}D</p>
                </Card>

                <Card className="p-6 text-center">
                  <Target size={32} className="mx-auto mb-3 text-accent-primary" />
                  <h3 className="text-2xl font-bold text-fg mb-1">{user.wins}</h3>
                  <p className="text-fg-secondary">Total Wins</p>
                </Card>
              </div>
            </div>

            {/* Recent Activity */}
            <div>
              <h2 className="text-2xl font-bold text-fg mb-6">Recent Activity</h2>
              <Card variant="flat" className="p-6">
                <div className="text-center text-fg-secondary">
                  <Gamepad2 size={48} className="mx-auto mb-4 opacity-50" />
                  <p>No recent games to display</p>
                  <p className="text-sm mt-2">Start playing to see your game history here!</p>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}