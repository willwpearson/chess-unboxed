'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/Button';
import { Crown, Zap, Brain, Users, Bot, Infinity } from 'lucide-react';

type GameMode = 'classic' | 'unboxed' | 'programming';
type SubMode = 'bot' | 'multiplayer' | 'endless';

interface GameModeConfig {
  id: GameMode;
  title: string;
  description: string;
  icon: any;
  color: string;
  gradient: string;
}

interface SubModeConfig {
  id: SubMode;
  title: string;
  description: string;
  icon: any;
  route: (gameMode: GameMode) => string;
}

const gameModes: GameModeConfig[] = [
  {
    id: 'classic',
    title: 'Chess Classic',
    description: 'Traditional chess with standard 8x8 board rules',
    icon: Crown,
    color: 'from-amber-500 to-orange-600',
    gradient: 'bg-gradient-to-br from-amber-500/20 to-orange-600/20'
  },
  {
    id: 'unboxed',
    title: 'Chess Unboxed',
    description: 'Revolutionary toroidal chess - pieces wrap around board edges',
    icon: Zap,
    color: 'from-purple-500 to-pink-600',
    gradient: 'bg-gradient-to-br from-purple-500/20 to-pink-600/20'
  },
  {
    id: 'programming',
    title: 'Programming Chess',
    description: 'Code your strategy with JavaScript functions',
    icon: Brain,
    color: 'from-emerald-500 to-teal-600',
    gradient: 'bg-gradient-to-br from-emerald-500/20 to-teal-600/20'
  }
];

const subModes: SubModeConfig[] = [
  {
    id: 'bot',
    title: 'Play vs Bot',
    description: 'Challenge AI opponents with adjustable difficulty',
    icon: Bot,
    route: (gameMode) => gameMode === 'programming' ? '/play/programming' : '/play/bot'
  },
  {
    id: 'multiplayer',
    title: 'Host Multiplayer',
    description: 'Create lobbies and play against other players',
    icon: Users,
    route: () => '/lobby'
  },
  {
    id: 'endless',
    title: 'Endless Mode',
    description: 'Survive as long as you can - one loss ends it all',
    icon: Infinity,
    route: () => '/play/endless'
  }
];

export default function HomePage() {
  const [selectedGameMode, setSelectedGameMode] = useState<GameMode | null>(null);
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const router = useRouter();

  const handleSubModeClick = async (subMode: SubMode) => {
    if (!selectedGameMode) return;
    
    setIsLoading(subMode);
    
    try {
      // Store the selected game mode in localStorage for the game pages to use
      localStorage.setItem('selectedGameMode', selectedGameMode);
      
      // Navigate to the appropriate route
      const route = subModes.find(s => s.id === subMode)?.route(selectedGameMode);
      if (route) {
        router.push(route);
      }
    } catch (error) {
      console.error('Navigation error:', error);
    } finally {
      setIsLoading(null);
    }
  };

  return (
    <>
      <Header />
      <main className="flex-1 min-h-screen" style={{ background: 'var(--gaming-bg-primary)' }}>
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-6xl mx-auto">
            {/* Hero Section */}
            <div className="text-center mb-12 md:mb-16">
              <h1 className="text-4xl md:text-6xl font-gaming font-bold mb-4 md:mb-6 gaming-title">
                Chess Unboxed
              </h1>
              <p className="text-lg md:text-xl text-gaming-text-secondary max-w-3xl mx-auto leading-relaxed px-4">
                Experience chess like never before. Choose your game mode, pick your challenge, 
                and dominate the board with style.
              </p>
            </div>

            {/* Game Mode Selection */}
            {!selectedGameMode ? (
              <div className="space-y-8">
                <h2 className="text-3xl font-gaming font-bold text-center text-gaming-text-primary mb-8">
                  Choose Your Game Mode
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {gameModes.map((mode) => {
                    const IconComponent = mode.icon;
                    return (
                      <div
                        key={mode.id}
                        className={`gaming-card gaming-glow cursor-pointer p-8 text-center ${mode.gradient}`}
                        onClick={() => setSelectedGameMode(mode.id)}
                      >
                        <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-r ${mode.color} text-white mb-6`}>
                          <IconComponent size={40} />
                        </div>
                        
                        <h3 className="text-2xl font-gaming font-bold text-gaming-text-primary mb-4">
                          {mode.title}
                        </h3>
                        
                        <p className="text-gaming-text-secondary leading-relaxed">
                          {mode.description}
                        </p>
                        
                        <div className="mt-6">
                          <button className="gaming-button">
                            Select Mode
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              /* Sub-Mode Selection */
              <div className="space-y-8">
                <div className="text-center">
                  <button 
                    onClick={() => setSelectedGameMode(null)}
                    className="gaming-button-secondary mb-6"
                  >
                    ← Back to Game Modes
                  </button>
                  
                  <h2 className="text-3xl font-gaming font-bold text-gaming-text-primary mb-4">
                    {gameModes.find(m => m.id === selectedGameMode)?.title}
                  </h2>
                  
                  <p className="text-gaming-text-secondary">
                    Choose how you want to play
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {subModes.map((subMode) => {
                    const IconComponent = subMode.icon;
                    const selectedMode = gameModes.find(m => m.id === selectedGameMode);
                    
                    return (
                      <div
                        key={subMode.id}
                        className={`gaming-card gaming-glow cursor-pointer p-8 text-center ${selectedMode?.gradient}`}
                        onClick={() => handleSubModeClick(subMode.id)}
                      >
                        <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r ${selectedMode?.color} text-white mb-6`}>
                          <IconComponent size={32} />
                        </div>
                        
                        <h3 className="text-xl font-gaming font-bold text-gaming-text-primary mb-4">
                          {subMode.title}
                        </h3>
                        
                        <p className="text-gaming-text-secondary mb-6 leading-relaxed">
                          {subMode.description}
                        </p>
                        
                        <button 
                          className={`gaming-button ${isLoading === subMode.id ? 'opacity-50' : ''}`}
                          disabled={isLoading === subMode.id}
                        >
                          {isLoading === subMode.id ? (
                            <div className="flex items-center justify-center">
                              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                              Loading...
                            </div>
                          ) : (
                            'Start Playing'
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
