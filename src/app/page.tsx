'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { useAuth } from '@/hooks/useAuth';
import { ChessBoard } from '@/components/game/ChessBoard';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { LoadingSpinner } from '@/components/ui/Loading';
import { Zap, Users, Bot, Infinity, UserPlus, Trophy, Gamepad2, UserCheck, Play, Star, Shield, Sparkles } from 'lucide-react';

type GameMode = 'unboxed';

interface GameModeConfig {
  id: GameMode;
  title: string;
  shortDescription: string;
  fullDescription: string;
  icon: any;
  color: string;
  gradient: string;
  features: string[];
  difficulty: string;
}

const gameModes: GameModeConfig[] = [
  {
    id: 'unboxed',
    title: 'Chess Unboxed',
    shortDescription: 'Revolutionary toroidal chess - pieces wrap around board edges',
    fullDescription: 'Break free from traditional boundaries! In Chess Unboxed, the board wraps around itself - pieces can move off one edge and appear on the opposite side, creating mind-bending strategic possibilities.',
    icon: Zap,
    color: 'from-purple-500 to-pink-600',
    gradient: 'bg-gradient-to-br from-purple-500/20 to-pink-600/20',
    features: ['Toroidal board topology', 'Edge-wrapping movement', 'Unique tactical patterns', 'Revolutionary gameplay'],
    difficulty: 'Intermediate to Expert'
  }
];

export default function HomePage() {
  const [guestLoading, setGuestLoading] = useState(false);
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading, createGuestUser } = useAuth();

  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, authLoading, router]);

  const handleGuestAccess = async () => {
    setGuestLoading(true);
    try {
      const result = await createGuestUser();
      if (result.success) {
        router.push('/dashboard');
      } else {
        console.error('Guest access error:', result.error);
      }
    } catch (error) {
      console.error('Guest access error:', error);
    } finally {
      setGuestLoading(false);
    }
  };

  // Don't render anything while checking auth status
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-surface-base">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Redirect already authenticated users
  if (isAuthenticated) {
    return null; // Will redirect via useEffect
  }

  return (
    <>
      <Header />
      <main className="flex-1 min-h-screen bg-surface-base">
        {/* Hero Section */}
        <section className="container mx-auto px-4 py-16">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              {/* Chess Board */}
              <div className="flex justify-center lg:justify-start">
                <div className="w-full max-w-md">
                  <ChessBoard
                    gameVariant="unboxed"
                    onMove={() => {}} // No-op for demo
                    currentPlayer="white"
                    isPlayerTurn={false} // Disable interaction for demo
                    showCoordinates={false}
                    boardTheme="classic"
                    showActionButtons={false}
                    showTurnIndicator={false}
                  />
                </div>
              </div>

              {/* Content */}
              <div className="text-center lg:text-left">
                <h1 className="text-5xl md:text-6xl font-gaming font-bold mb-6 text-fg">
                  Chess Unboxed
                </h1>
                <p className="text-xl md:text-2xl text-fg-secondary mb-8 leading-relaxed">
                  Experience chess like never before with toroidal board topology, edge-wrapping movement, and revolutionary gameplay that breaks all boundaries
                </p>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row justify-center gap-4 mb-8">
                  <Link href="/register">
                    <Button variant="secondary" size="lg" className="w-full sm:w-auto">
                      <UserPlus size={20} className="mr-2" />
                      Start Playing Free
                    </Button>
                  </Link>
                  <Button
                    variant="primary"
                    size="lg"
                    onClick={handleGuestAccess}
                    disabled={guestLoading}
                    className="w-full sm:w-auto"
                  >
                    {guestLoading ? (
                      <>
                        <LoadingSpinner size="sm" className="mr-2" />
                        Setting up...
                      </>
                    ) : (
                      <>
                        <UserCheck size={20} className="mr-2" />
                        Try as Guest
                      </>
                    )}
                  </Button>
                </div>

                {/* Smaller description */}
                <p className="text-fg-secondary max-w-lg">
                  Join thousands of players experiencing the future of chess with wraparound gameplay, advanced AI opponents, and competitive ranking systems.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="container mx-auto px-4 py-16 bg-surface-raised">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-gaming font-bold text-fg mb-6">
                Revolutionary Chess Platform
              </h2>
              <p className="text-xl text-fg-secondary max-w-3xl mx-auto leading-relaxed">
                Experience the future of chess with toroidal board topology, edge-wrapping movement, and revolutionary gameplay that breaks all boundaries. Challenge AI opponents, compete globally, and master unique tactical patterns.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Gameplay Features */}
              <Card className="p-6 text-center">
                <Zap size={40} className="mx-auto mb-4 text-accent-primary" />
                <h4 className="font-bold text-fg mb-2">Toroidal Board Topology</h4>
                <p className="text-sm text-fg-secondary">Pieces wrap around board edges, creating mind-bending strategic possibilities</p>
              </Card>
              <Card className="p-6 text-center">
                <Infinity size={40} className="mx-auto mb-4 text-accent-primary" />
                <h4 className="font-bold text-fg mb-2">Edge-Wrapping Movement</h4>
                <p className="text-sm text-fg-secondary">Revolutionary gameplay mechanics transcend traditional boundaries</p>
              </Card>
              <Card className="p-6 text-center">
                <Sparkles size={40} className="mx-auto mb-4 text-accent-primary" />
                <h4 className="font-bold text-fg mb-2">Unique Tactical Patterns</h4>
                <p className="text-sm text-fg-secondary">Discover new strategies impossible in traditional chess</p>
              </Card>

              {/* AI & Multiplayer */}
              <Card className="p-6 text-center">
                <Bot size={40} className="mx-auto mb-4 text-accent-primary" />
                <h4 className="font-bold text-fg mb-2">Smart AI Opponents</h4>
                <p className="text-sm text-fg-secondary">Challenge adaptive AI with multiple difficulty levels</p>
              </Card>
              <Card className="p-6 text-center">
                <Users size={40} className="mx-auto mb-4 text-accent-primary" />
                <h4 className="font-bold text-fg mb-2">Global Multiplayer</h4>
                <p className="text-sm text-fg-secondary">Play against thousands of players worldwide</p>
              </Card>
              <Card className="p-6 text-center">
                <Trophy size={40} className="mx-auto mb-4 text-accent-primary" />
                <h4 className="font-bold text-fg mb-2">Competitive Rankings</h4>
                <p className="text-sm text-fg-secondary">Climb leaderboards with accurate ELO-based skill matching</p>
              </Card>

              {/* Platform Features */}
              <Card className="p-6 text-center">
                <Gamepad2 size={40} className="mx-auto mb-4 text-accent-primary" />
                <h4 className="font-bold text-fg mb-2">Performance Analytics</h4>
                <p className="text-sm text-fg-secondary">Track your progress with detailed statistics</p>
              </Card>
              <Card className="p-6 text-center">
                <Shield size={40} className="mx-auto mb-4 text-accent-primary" />
                <h4 className="font-bold text-fg mb-2">Fair Play Protection</h4>
                <p className="text-sm text-fg-secondary">Anti-cheat protection and active moderation</p>
              </Card>
              <Card className="p-6 text-center">
                <Star size={40} className="mx-auto mb-4 text-accent-primary" />
                <h4 className="font-bold text-fg mb-2">Custom Themes</h4>
                <p className="text-sm text-fg-secondary">Personalize your gaming experience with multiple board themes</p>
              </Card>
            </div>
          </div>
        </section>

        {/* Call to Action */}
        <section className="container mx-auto px-4 py-16">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl font-gaming font-bold text-fg mb-6">
              Ready to Revolutionize Your Chess Game?
            </h2>
            <p className="text-xl text-fg-secondary mb-8">
              Join thousands of players already experiencing the future of chess
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center max-w-lg mx-auto">
              <Link href="/register" className="w-full sm:w-auto">
                <Button variant="secondary" size="lg" className="w-full sm:w-auto">
                  <Play size={20} className="mr-2" />
                  Start Your Journey
                </Button>
              </Link>
              <Button
                variant="primary"
                size="lg"
                onClick={handleGuestAccess}
                disabled={guestLoading}
                className="w-full sm:w-auto"
              >
                {guestLoading ? <LoadingSpinner size="sm" className="mr-2" /> : <UserCheck size={20} className="mr-2" />}
                {guestLoading ? 'Setting up...' : 'Try as Guest'}
              </Button>
            </div>
            <p className="text-sm text-fg-muted mt-4">
              Already have an account? <Link href="/login" className="text-accent-primary hover:underline">Sign in here</Link>
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}