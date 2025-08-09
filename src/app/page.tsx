'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { useAuth } from '@/hooks/useAuth';
import { Zap, Users, Bot, Infinity, LogIn, UserPlus, Trophy, Gamepad2, UserCheck, Play, Star, Shield, Sparkles, CheckCircle } from 'lucide-react';

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
      <div className="flex items-center justify-center min-h-screen" style={{ background: 'var(--gaming-bg-primary)' }}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gaming-accent-primary"></div>
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
      <main className="flex-1 min-h-screen" style={{ background: 'var(--gaming-bg-primary)' }}>
        {/* Hero Section */}
        <section className="container mx-auto px-4 py-16">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl md:text-7xl font-gaming font-bold mb-6 gaming-title">
              Chess Unboxed
            </h1>
            <p className="text-xl md:text-2xl text-gaming-text-secondary mb-8 leading-relaxed">
              Experience chess like never before with revolutionary wraparound gameplay that breaks all boundaries
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center max-w-lg mx-auto mb-12">
              <Link href="/register" className="gaming-button inline-flex items-center w-full sm:w-auto">
                <UserPlus size={20} className="mr-2" />
                Start Playing Free
              </Link>
              <Link href="/login" className="gaming-button-secondary inline-flex items-center w-full sm:w-auto">
                <LogIn size={20} className="mr-2" />
                Sign In
              </Link>
            </div>
            <button
              onClick={handleGuestAccess}
              disabled={guestLoading}
              className="text-gaming-text-secondary hover:text-gaming-accent-primary transition-colors inline-flex items-center"
            >
              {guestLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                  Setting up guest account...
                </>
              ) : (
                <>
                  <UserCheck size={16} className="mr-2" />
                  Or continue as guest
                </>
              )}
            </button>
          </div>
        </section>

        {/* Game Modes Showcase */}
        <section className="container mx-auto px-4 py-8">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-gaming font-bold text-gaming-text-primary mb-6">
                Revolutionary Chess Experience
              </h2>
              <p className="text-xl text-gaming-text-secondary max-w-3xl mx-auto">
                Break free from traditional boundaries with wraparound chess where pieces transcend board edges
              </p>
            </div>
            
            <div className="flex justify-center mb-16">
              <div className="max-w-lg w-full">
              {gameModes.map((mode, index) => {
                const IconComponent = mode.icon;
                return (
                  <div
                    key={mode.id}
                    className={`gaming-card gaming-glow p-8 ${mode.gradient} relative overflow-hidden`}
                  >
                    {/* Background decoration */}
                    <div className="absolute top-4 right-4 opacity-10">
                      <IconComponent size={80} />
                    </div>
                    
                    <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r ${mode.color} text-white mb-6 relative z-10`}>
                      <IconComponent size={32} />
                    </div>
                    
                    <h3 className="text-2xl font-gaming font-bold text-gaming-text-primary mb-4">
                      {mode.title}
                    </h3>
                    
                    <p className="text-gaming-text-secondary mb-6 leading-relaxed">
                      {mode.fullDescription}
                    </p>

                    <div className="mb-6">
                      <div className="flex items-center mb-3">
                        <Shield size={16} className="text-gaming-accent-primary mr-2" />
                        <span className="text-sm font-medium text-gaming-text-primary">Difficulty: {mode.difficulty}</span>
                      </div>
                      <ul className="space-y-2">
                        {mode.features.map((feature, idx) => (
                          <li key={idx} className="flex items-center text-sm text-gaming-text-secondary">
                            <CheckCircle size={14} className="text-gaming-accent-primary mr-2 flex-shrink-0" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                );
              })}
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="container mx-auto px-4 py-16" style={{ background: 'var(--gaming-bg-secondary)' }}>
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-gaming font-bold text-gaming-text-primary mb-6">
                Everything You Need to Dominate
              </h2>
              <p className="text-xl text-gaming-text-secondary max-w-3xl mx-auto">
                Advanced features designed for chess enthusiasts, competitive players, and coding minds
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="gaming-card gaming-glow p-6 text-center">
                <Bot size={40} className="mx-auto mb-4 text-gaming-accent-primary" />
                <h3 className="font-bold text-gaming-text-primary mb-2">Smart AI Opponents</h3>
                <p className="text-sm text-gaming-text-secondary">Challenge adaptive AI with multiple difficulty levels</p>
              </div>
              <div className="gaming-card gaming-glow p-6 text-center">
                <Users size={40} className="mx-auto mb-4 text-gaming-accent-primary" />
                <h3 className="font-bold text-gaming-text-primary mb-2">Global Multiplayer</h3>
                <p className="text-sm text-gaming-text-secondary">Play against thousands of players worldwide</p>
              </div>
              <div className="gaming-card gaming-glow p-6 text-center">
                <Trophy size={40} className="mx-auto mb-4 text-gaming-accent-primary" />
                <h3 className="font-bold text-gaming-text-primary mb-2">Competitive Rankings</h3>
                <p className="text-sm text-gaming-text-secondary">Climb leaderboards in each game mode</p>
              </div>
              <div className="gaming-card gaming-glow p-6 text-center">
                <Infinity size={40} className="mx-auto mb-4 text-gaming-accent-primary" />
                <h3 className="font-bold text-gaming-text-primary mb-2">Endless Challenges</h3>
                <p className="text-sm text-gaming-text-secondary">Survive as long as possible in endless mode</p>
              </div>
              <div className="gaming-card gaming-glow p-6 text-center">
                <Gamepad2 size={40} className="mx-auto mb-4 text-gaming-accent-primary" />
                <h3 className="font-bold text-gaming-text-primary mb-2">Performance Analytics</h3>
                <p className="text-sm text-gaming-text-secondary">Track your progress with detailed statistics</p>
              </div>
              <div className="gaming-card gaming-glow p-6 text-center">
                <Star size={40} className="mx-auto mb-4 text-gaming-accent-primary" />
                <h3 className="font-bold text-gaming-text-primary mb-2">Rating System</h3>
                <p className="text-sm text-gaming-text-secondary">Accurate ELO-based skill matching</p>
              </div>
              <div className="gaming-card gaming-glow p-6 text-center">
                <Shield size={40} className="mx-auto mb-4 text-gaming-accent-primary" />
                <h3 className="font-bold text-gaming-text-primary mb-2">Fair Play</h3>
                <p className="text-sm text-gaming-text-secondary">Anti-cheat protection and moderation</p>
              </div>
              <div className="gaming-card gaming-glow p-6 text-center">
                <Sparkles size={40} className="mx-auto mb-4 text-gaming-accent-primary" />
                <h3 className="font-bold text-gaming-text-primary mb-2">Custom Themes</h3>
                <p className="text-sm text-gaming-text-secondary">Personalize your gaming experience</p>
              </div>
            </div>
          </div>
        </section>

        {/* Call to Action */}
        <section className="container mx-auto px-4 py-16">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl font-gaming font-bold text-gaming-text-primary mb-6">
              Ready to Revolutionize Your Chess Game?
            </h2>
            <p className="text-xl text-gaming-text-secondary mb-8">
              Join thousands of players already experiencing the future of chess
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center max-w-lg mx-auto">
              <Link href="/register" className="gaming-button inline-flex items-center w-full sm:w-auto">
                <Play size={20} className="mr-2" />
                Start Your Journey
              </Link>
              <button
                onClick={handleGuestAccess}
                disabled={guestLoading}
                className="gaming-button-secondary inline-flex items-center w-full sm:w-auto"
              >
                {guestLoading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current mr-2"></div>
                ) : (
                  <UserCheck size={20} className="mr-2" />
                )}
                {guestLoading ? 'Setting up...' : 'Try as Guest'}
              </button>
            </div>
            <p className="text-sm text-gaming-text-secondary mt-4">
              Already have an account? <Link href="/login" className="text-gaming-accent-primary hover:underline">Sign in here</Link>
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}