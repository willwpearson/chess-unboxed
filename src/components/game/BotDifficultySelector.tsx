/**
 * Bot Difficulty Selector Component
 * Allows players to choose bot difficulty and settings
 */
'use client';

import React, { useState } from 'react';
import { BotDifficulty, BotConfig } from '@/types/game';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Bot, Brain, Zap, Target, Crown } from 'lucide-react';

interface BotDifficultySelectorProps {
  onStartGame: (config: BotConfig) => void;
  isLoading?: boolean;
}

const BOT_CONFIGS: Record<BotDifficulty, {
  name: string;
  description: string;
  icon: any;
  color: string;
  textColor: string;
  rating: number;
  features: string[];
}> = {
  Beginner: {
    name: 'Beginner',
    description: 'Perfect for learning the basics',
    icon: Bot,
    color: 'bg-status-success',
    textColor: 'text-white',
    rating: 800,
    features: ['Random moves', 'No deep strategy', 'Great for beginners']
  },
  Intermediate: {
    name: 'Intermediate',
    description: 'Good challenge for casual players',
    icon: Brain,
    color: 'bg-accent-secondary',
    textColor: 'text-accent-secondary-foreground',
    rating: 1200,
    features: ['Basic tactics', 'Simple strategy', 'Balanced gameplay']
  },
  Advanced: {
    name: 'Advanced',
    description: 'Strong opponent for experienced players',
    icon: Target,
    color: 'bg-status-warning',
    textColor: 'text-accent-secondary-foreground',
    rating: 1600,
    features: ['Advanced tactics', 'Strong endgame', 'Aggressive play']
  },
  Grandmaster: {
    name: 'Grandmaster',
    description: 'Ultimate challenge for chess masters',
    icon: Crown,
    color: 'bg-accent-danger',
    textColor: 'text-white',
    rating: 2000,
    features: ['Deep calculations', 'Perfect endgame', 'Master level']
  }
};

export function BotDifficultySelector({ onStartGame, isLoading }: BotDifficultySelectorProps) {
  const [selectedDifficulty, setSelectedDifficulty] = useState<BotDifficulty | null>(null);

  const handleStartGame = () => {
    if (!selectedDifficulty) return;

    const botConfig: BotConfig = {
      difficulty: selectedDifficulty
    };

    onStartGame(botConfig);
  };

  return (
    <Card className="p-8">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-4 text-accent-primary">Choose Your Opponent</h2>
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
                {/* Tint overlay for selected state */}
                {isSelected && (
                  <div className={`absolute inset-0 ${config.color} opacity-10 pointer-events-none`} />
                )}
                <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full ${config.color} ${config.textColor} mx-auto mb-4 relative z-10`}>
                  <IconComponent size={32} />
                </div>
                <h3 className="text-xl font-bold text-fg mb-2 relative z-10">{config.name}</h3>
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
                    Rating: ~{config.rating}
                  </span>
                </div>
              </Card>
            </div>
          );
        })}
      </div>

      {/* Start Game Button */}
      <div className="text-center my-8">
        <Button
          onClick={handleStartGame}
          disabled={!selectedDifficulty || isLoading}
          variant={selectedDifficulty && !isLoading ? 'primary' : 'secondary'}
          size="lg"
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-fg-secondary">
                <div>
                  <span className="font-medium text-fg">Difficulty:</span> {BOT_CONFIGS[selectedDifficulty].name}
                </div>
                <div>
                  <span className="font-medium text-fg">Rating:</span> ~{BOT_CONFIGS[selectedDifficulty].rating}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </Card>
  );
}
