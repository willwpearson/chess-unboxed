'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Bot, Users, Zap, Crown, Play } from 'lucide-react';

interface GameMode {
  id: string;
  title: string;
  description: string;
  icon: any;
  color: string;
  route: string;
  features: string[];
}

const gameModes: GameMode[] = [
  {
    id: 'bot',
    title: 'Play vs Bot',
    description: 'Practice against AI opponents with different difficulty levels',
    icon: Bot,
    color: 'bg-blue-500',
    route: '/play/bot',
    features: ['Multiple difficulty levels', 'Perfect for practice', 'Instant matches']
  },
  {
    id: 'multiplayer',
    title: 'Multiplayer',
    description: 'Play against other players in real-time matches',
    icon: Users,
    color: 'bg-green-500',
    route: '/lobby',
    features: ['Real-time gameplay', 'Create or join lobbies', 'Ranked matches']
  },
  {
    id: 'endless',
    title: 'Endless Mode',
    description: 'Challenge yourself - one loss and you\'re out!',
    icon: Zap,
    color: 'bg-purple-500',
    route: '/play/endless',
    features: ['Progressive difficulty', 'Leaderboard competition', 'Ultimate challenge']
  }
];

export default function GameModeSelector() {
  const [selectedMode, setSelectedMode] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleModeSelect = (mode: GameMode) => {
    setSelectedMode(mode.id);
  };

  const handlePlayClick = async () => {
    if (!selectedMode) return;

    setIsLoading(true);
    
    try {
      const mode = gameModes.find(m => m.id === selectedMode);
      if (mode) {
        // For multiplayer mode, we might need to check for existing player session
        if (mode.id === 'multiplayer') {
          // Create or get player session
          const nickname = localStorage.getItem('playerNickname');
          if (!nickname) {
            // Prompt for nickname
            const userNickname = prompt('Enter your nickname:');
            if (!userNickname) {
              setIsLoading(false);
              return;
            }
            
            // Create player
            const response = await fetch('/api/players', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ nickname: userNickname }),
            });

            if (response.ok) {
              const { player } = await response.json();
              localStorage.setItem('playerId', player.id);
              localStorage.setItem('playerNickname', player.nickname);
            }
          }
        }

        router.push(mode.route);
      }
    } catch (error) {
      console.error('Error starting game:', error);
      alert('Failed to start game. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-6">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          Choose Your Game Mode
        </h1>
        <p className="text-lg text-gray-600">
          Select how you want to play chess today
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {gameModes.map((mode) => {
          const IconComponent = mode.icon;
          const isSelected = selectedMode === mode.id;
          
          return (
            <div
              key={mode.id}
              className={`cursor-pointer transition-all duration-200 transform hover:scale-105 bg-white rounded-lg border shadow-sm ${
                isSelected 
                  ? 'ring-2 ring-blue-500 ring-offset-2 shadow-lg' 
                  : 'hover:shadow-md'
              }`}
              onClick={() => handleModeSelect(mode)}
            >
              <div className="p-6">
                <div className="text-center mb-4">
                  <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full ${mode.color} text-white mb-3`}>
                    <IconComponent size={32} />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {mode.title}
                  </h3>
                  <p className="text-gray-600 text-sm mb-4">
                    {mode.description}
                  </p>
                </div>

                <div className="space-y-2">
                  {mode.features.map((feature, index) => (
                    <div key={index} className="flex items-center text-sm text-gray-500">
                      <Crown size={14} className="mr-2 text-yellow-500" />
                      {feature}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="text-center">
        <Button
          onClick={handlePlayClick}
          disabled={!selectedMode || isLoading}
          className={`px-8 py-3 text-lg font-semibold ${
            selectedMode 
              ? 'bg-blue-600 hover:bg-blue-700 text-white' 
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          {isLoading ? (
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              Starting Game...
            </div>
          ) : (
            <div className="flex items-center">
              <Play size={20} className="mr-2" />
              {selectedMode ? `Play ${gameModes.find(m => m.id === selectedMode)?.title}` : 'Select a Mode'}
            </div>
          )}
        </Button>
      </div>

      {selectedMode && (
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="text-center">
            <h4 className="font-semibold text-blue-900 mb-2">
              {gameModes.find(m => m.id === selectedMode)?.title} Selected
            </h4>
            <p className="text-blue-700 text-sm">
              {gameModes.find(m => m.id === selectedMode)?.description}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
