/**
 * Bot Difficulty Selector Component
 * Allows players to choose bot difficulty and settings
 */
'use client';

import React, { useState } from 'react';
import { BotDifficulty, BotConfig } from '@/types/game';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Bot, Brain, Zap, Target, Crown, Settings, Swords, Scale, Shield } from 'lucide-react';

interface BotDifficultySelectorProps {
  onStartGame: (config: BotConfig) => void;
  isLoading?: boolean;
}

const BOT_CONFIGS: Record<BotDifficulty, {
  name: string;
  description: string;
  icon: any;
  color: string;
  thinkingTime: number;
  personality: 'aggressive' | 'defensive' | 'balanced';
  features: string[];
}> = {
  easy: {
    name: 'Beginner',
    description: 'Perfect for learning the basics',
    icon: Bot,
    color: 'from-green-400 to-emerald-600',
    thinkingTime: 500,
    personality: 'balanced',
    features: ['Random moves', 'No deep strategy', 'Great for beginners']
  },
  medium: {
    name: 'Intermediate',
    description: 'Good challenge for casual players',
    icon: Brain,
    color: 'from-blue-400 to-indigo-600',
    thinkingTime: 1500,
    personality: 'balanced',
    features: ['Basic tactics', 'Simple strategy', 'Balanced gameplay']
  },
  hard: {
    name: 'Advanced',
    description: 'Strong opponent for experienced players',
    icon: Target,
    color: 'from-orange-400 to-red-600',
    thinkingTime: 3000,
    personality: 'aggressive',
    features: ['Advanced tactics', 'Strong endgame', 'Aggressive play']
  },
  expert: {
    name: 'Grandmaster',
    description: 'Ultimate challenge for chess masters',
    icon: Crown,
    color: 'from-purple-400 to-violet-600',
    thinkingTime: 5000,
    personality: 'aggressive',
    features: ['Deep calculations', 'Perfect endgame', 'Master level']
  }
};

const PERSONALITIES: {
  type: 'Aggressive' | 'Balanced' | 'Defensive';
  name: string;
  description: string;
  icon: typeof Swords;
  gradient: string;
}[] = [
  {
    type: 'Aggressive',
    name: 'Aggressive',
    description: 'Attacks quickly, takes risks',
    icon: Swords,
    gradient: 'from-red-500 to-orange-600'
  },
  {
    type: 'Balanced',
    name: 'Balanced',
    description: 'Mix of attack and defense',
    icon: Scale,
    gradient: 'from-blue-500 to-indigo-600'
  },
  {
    type: 'Defensive',
    name: 'Defensive',
    description: 'Solid play, fewer risks',
    icon: Shield,
    gradient: 'from-green-500 to-emerald-600'
  }
];

export function BotDifficultySelector({ onStartGame, isLoading }: BotDifficultySelectorProps) {
  const [selectedDifficulty, setSelectedDifficulty] = useState<BotDifficulty | null>(null);
  const [selectedPersonality, setSelectedPersonality] = useState<'Aggressive' | 'Defensive' | 'Balanced'>('Balanced');

  const handleStartGame = () => {
    if (!selectedDifficulty) return;

    const config = BOT_CONFIGS[selectedDifficulty];
    const botConfig: BotConfig = {
      difficulty: selectedDifficulty,
      thinkingTime: config.thinkingTime,
      personality: selectedPersonality
    };

    onStartGame(botConfig);
  };

  return (
    <Card className="p-8">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-gaming font-bold mb-4 bg-gradient-to-r from-accent-primary to-accent-secondary bg-clip-text text-transparent">Choose Your Opponent</h2>
        <p className="text-lg text-fg-secondary">Select the difficulty level that matches your skill</p>
      </div>

      {/* Difficulty Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {(Object.keys(BOT_CONFIGS) as BotDifficulty[]).map((difficulty) => {
          const config = BOT_CONFIGS[difficulty];
          const IconComponent = config.icon;
          const isSelected = selectedDifficulty === difficulty;

          return (
            <div key={difficulty} onClick={() => setSelectedDifficulty(difficulty)}>
              <Card
                interactive
                className={`cursor-pointer p-6 text-center relative overflow-hidden ${
                  isSelected ? 'ring-2 ring-accent-primary' : ''
                }`}
              >
                {/* Gradient overlay for selected state */}
                {isSelected && (
                  <div className={`absolute inset-0 bg-gradient-to-br ${config.color} opacity-20 pointer-events-none`} />
                )}
                <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r ${config.color} text-white mx-auto mb-4 relative z-10`}>
                  <IconComponent size={32} />
                </div>
                <h3 className="text-xl font-gaming font-bold text-fg mb-2 relative z-10">{config.name}</h3>
                <p className="text-sm text-fg-secondary mb-4 relative z-10">{config.description}</p>

                <div className="space-y-2 mb-4 relative z-10">
                  {config.features.map((feature, index) => (
                    <div key={index} className="flex items-center text-sm text-fg-secondary justify-center">
                      <Zap size={14} className="mr-2 text-accent-secondary" />
                      {feature}
                    </div>
                  ))}
                </div>

                <div className="pt-3 border-t border-border-subtle relative z-10">
                  <span className="text-xs text-fg-muted">
                    Thinking time: {config.thinkingTime / 1000}s
                  </span>
                </div>
              </Card>
            </div>
          );
        })}
      </div>

      {/* Personality Selection */}
      {selectedDifficulty && (
        <Card className="mt-8 p-6" variant="flat">
          <div className="flex items-center space-x-3 mb-6">
            <Settings size={24} className="text-accent-primary" />
            <h3 className="text-2xl font-gaming font-bold text-fg">Bot Personality</h3>
          </div>
          <p className="text-fg-secondary mb-6">
            Customize how the bot plays against you
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {PERSONALITIES.map((personality) => {
              const isPersonalitySelected = selectedPersonality === personality.type;
              const PersonalityIcon = personality.icon;
              return (
                <div key={personality.type} onClick={() => setSelectedPersonality(personality.type)}>
                  <Card
                    interactive
                    className={`cursor-pointer p-4 text-center relative overflow-hidden ${
                      isPersonalitySelected ? 'ring-2 ring-accent-primary' : ''
                    }`}
                  >
                    {/* Gradient overlay for selected state */}
                    {isPersonalitySelected && (
                      <div className={`absolute inset-0 bg-gradient-to-br ${personality.gradient} opacity-20 pointer-events-none`} />
                    )}
                    <div className="flex items-center justify-center mb-3 relative z-10 text-fg">
                      <PersonalityIcon size={32} />
                    </div>
                    <h4 className="font-gaming font-medium text-fg mb-2 relative z-10">{personality.name}</h4>
                    <p className="text-sm text-fg-secondary relative z-10">{personality.description}</p>
                  </Card>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Start Game Button */}
      <div className="text-center my-8">
        <Button
          onClick={handleStartGame}
          disabled={!selectedDifficulty || isLoading}
          variant={selectedDifficulty && !isLoading ? 'primary' : 'secondary'}
          size="lg"
          className="font-gaming"
        >
          {isLoading ? (
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-accent-primary-foreground mr-2"></div>
              Starting Game...
            </div>
          ) : (
            <div className="flex items-center">
              <Bot size={20} className="mr-2" />
              {selectedDifficulty
                ? `Start Game vs ${BOT_CONFIGS[selectedDifficulty].name}`
                : 'Select Difficulty'}
            </div>
          )}
        </Button>
      </div>

      {/* Selected Configuration Summary */}
      {selectedDifficulty && (
        <Card className="bg-accent-primary/10 border-accent-primary/20">
          <CardContent className="p-4">
            <div className="text-center">
              <h4 className="font-semibold text-fg mb-2">Game Configuration</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-fg-secondary">
                <div>
                  <span className="font-medium text-fg">Difficulty:</span> {BOT_CONFIGS[selectedDifficulty].name}
                </div>
                <div>
                  <span className="font-medium text-fg">Personality:</span> {selectedPersonality}
                </div>
                <div>
                  <span className="font-medium text-fg">Thinking Time:</span> {BOT_CONFIGS[selectedDifficulty].thinkingTime / 1000}s
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </Card>
  );
}
