'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { useAuth } from '@/hooks/useAuth';
import { Trophy, Users, Gamepad2, TrendingUp, Target, Zap, Bot, Infinity } from 'lucide-react';

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
        <main className="flex-1 min-h-screen flex items-center justify-center" style={{ background: 'var(--gaming-bg-primary)' }}>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gaming-accent-primary"></div>
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
      <main className="flex-1 min-h-screen" style={{ background: 'var(--gaming-bg-primary)' }}>
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-6xl mx-auto">
            {/* Welcome Section */}
            <div className="text-center mb-8">
              <h1 className="text-3xl md:text-4xl font-gaming font-bold mb-2 gaming-title">
                Welcome, {user.display_name || user.username}!
              </h1>
              <p className="text-gaming-text-secondary">
                Ready to continue your chess journey?
              </p>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="gaming-card gaming-glow p-6 text-center">
                <Trophy size={32} className="mx-auto mb-3 text-gaming-accent-primary" />
                <h3 className="text-2xl font-bold text-gaming-text-primary mb-1">{user.current_rating}</h3>
                <p className="text-gaming-text-secondary">Current Rating</p>
                <p className="text-sm text-gaming-text-secondary mt-1">Peak: {user.peak_rating}</p>
              </div>

              <div className="gaming-card gaming-glow p-6 text-center">
                <Gamepad2 size={32} className="mx-auto mb-3 text-gaming-accent-primary" />
                <h3 className="text-2xl font-bold text-gaming-text-primary mb-1">{user.total_games}</h3>
                <p className="text-gaming-text-secondary">Games Played</p>
              </div>

              <div className="gaming-card gaming-glow p-6 text-center">
                <TrendingUp size={32} className="mx-auto mb-3 text-gaming-accent-primary" />
                <h3 className="text-2xl font-bold text-gaming-text-primary mb-1">{winRate}%</h3>
                <p className="text-gaming-text-secondary">Win Rate</p>
                <p className="text-sm text-gaming-text-secondary mt-1">{user.wins}W {user.losses}L {user.draws}D</p>
              </div>

              <div className="gaming-card gaming-glow p-6 text-center">
                <Target size={32} className="mx-auto mb-3 text-gaming-accent-primary" />
                <h3 className="text-2xl font-bold text-gaming-text-primary mb-1">{user.wins}</h3>
                <p className="text-gaming-text-secondary">Total Wins</p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="mb-8">
              <h2 className="text-2xl font-gaming font-bold text-gaming-text-primary mb-6">Quick Actions</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Link href="/lobby" className="gaming-card gaming-glow p-6 text-center hover:scale-105 transition-transform duration-300">
                  <Users size={40} className="mx-auto mb-3 text-gaming-accent-primary" />
                  <h3 className="font-bold text-gaming-text-primary mb-2">Join Lobby</h3>
                  <p className="text-sm text-gaming-text-secondary">Find opponents to play against</p>
                </Link>

                <Link href="/play/unboxed/bot" className="gaming-card gaming-glow p-6 text-center hover:scale-105 transition-transform duration-300">
                  <Zap size={40} className="mx-auto mb-3 text-gaming-accent-primary" />
                  <h3 className="font-bold text-gaming-text-primary mb-2">Play vs Bot</h3>
                  <p className="text-sm text-gaming-text-secondary">Practice against AI</p>
                </Link>

                <Link href="/leaderboard" className="gaming-card gaming-glow p-6 text-center hover:scale-105 transition-transform duration-300">
                  <Trophy size={40} className="mx-auto mb-3 text-gaming-accent-primary" />
                  <h3 className="font-bold text-gaming-text-primary mb-2">Leaderboard</h3>
                  <p className="text-sm text-gaming-text-secondary">See your ranking</p>
                </Link>

                <Link href="/stats" className="gaming-card gaming-glow p-6 text-center hover:scale-105 transition-transform duration-300">
                  <TrendingUp size={40} className="mx-auto mb-3 text-gaming-accent-primary" />
                  <h3 className="font-bold text-gaming-text-primary mb-2">Detailed Stats</h3>
                  <p className="text-sm text-gaming-text-secondary">View full analytics</p>
                </Link>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="mb-8">
              <h2 className="text-2xl font-gaming font-bold text-gaming-text-primary mb-6">Recent Activity</h2>
              <div className="gaming-card gaming-glow p-6">
                <div className="text-center text-gaming-text-secondary">
                  <Gamepad2 size={48} className="mx-auto mb-4 opacity-50" />
                  <p>No recent games to display</p>
                  <p className="text-sm mt-2">Start playing to see your game history here!</p>
                </div>
              </div>
            </div>

            {/* Game Mode - Chess Unboxed Only */}
            <div>
              <h2 className="text-2xl font-gaming font-bold text-gaming-text-primary mb-6">Chess Unboxed Experience</h2>
              <div className="flex justify-center mb-8">
                <div className="gaming-card gaming-glow p-6 bg-gradient-to-br from-purple-500/20 to-pink-600/20 relative overflow-hidden max-w-md w-full">
                  <div className="absolute top-4 right-4 opacity-10">
                    <Zap size={60} />
                  </div>
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-purple-500 to-pink-600 text-white mb-6 relative z-10">
                    <Zap size={32} />
                  </div>
                  <h3 className="text-xl font-gaming font-bold text-gaming-text-primary mb-2 text-center">Chess Unboxed</h3>
                  <p className="text-gaming-text-secondary mb-6 text-center">Revolutionary toroidal chess - pieces wrap around board edges for mind-bending strategy.</p>
                  
                  <div className="space-y-3">
                    <Link href="/play/unboxed/bot" className="gaming-button w-full text-center inline-flex items-center justify-center">
                      <Bot size={16} className="mr-2" />
                      Play vs Bot
                    </Link>
                    <Link href="/play/unboxed/multiplayer" className="gaming-button-secondary w-full text-center inline-flex items-center justify-center">
                      <Users size={16} className="mr-2" />
                      Multiplayer
                    </Link>
                    <Link href="/play/unboxed/endless" className="gaming-button-secondary w-full text-center inline-flex items-center justify-center">
                      <Infinity size={16} className="mr-2" />
                      Endless Mode
                    </Link>
                  </div>

                  <div className="mt-4 flex justify-center gap-2">
                    <Link href="/lobby" className="text-xs text-gaming-text-secondary hover:text-gaming-accent-primary">
                      Lobbies
                    </Link>
                    <span className="text-xs text-gaming-text-secondary">•</span>
                    <Link href="/leaderboard" className="text-xs text-gaming-text-secondary hover:text-gaming-accent-primary">
                      Rankings
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}