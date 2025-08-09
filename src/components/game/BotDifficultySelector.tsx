/**
 * Bot Difficulty Selector Component
 * Allows players to choose bot difficulty and settings
 */
'use client';

import React, { useState } from 'react';
import { BotDifficulty, BotConfig } from '@/types/game';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Bot, Brain, Zap, Target, Crown, Settings } from 'lucide-react';

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
    <div className="gaming-card p-8">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-gaming font-bold gaming-title mb-4">Choose Your Opponent</h2>
        <p className="text-lg text-gaming-text-secondary">Select the difficulty level that matches your skill</p>
      </div>

      {/* Difficulty Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {(Object.keys(BOT_CONFIGS) as BotDifficulty[]).map((difficulty) => {
          const config = BOT_CONFIGS[difficulty];
          const IconComponent = config.icon;
          const isSelected = selectedDifficulty === difficulty;

          return (
            <div
              key={difficulty}
              className={`gaming-card gaming-glow cursor-pointer p-6 text-center transition-all duration-300 relative overflow-hidden ${
                isSelected ? 'border-gaming-accent-primary transform scale-105' : 'hover:border-gaming-accent-primary/50'
              }`}
              onClick={() => setSelectedDifficulty(difficulty)}
            >
              {/* Gradient overlay for selected state */}
              {isSelected && (
                <div className={`absolute inset-0 bg-gradient-to-br ${config.color} opacity-20 pointer-events-none`} />
              )}
              <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r ${config.color} text-white mx-auto mb-4 relative z-10`}>
                <IconComponent size={32} />
              </div>
              <h3 className="text-xl font-gaming font-bold text-gaming-text-primary mb-2 relative z-10">{config.name}</h3>
              <p className="text-sm text-gaming-text-secondary mb-4 relative z-10">{config.description}</p>
              
              <div className="space-y-2 mb-4 relative z-10">
                {config.features.map((feature, index) => (
                  <div key={index} className="flex items-center text-sm text-gaming-text-secondary justify-center">
                    <Zap size={14} className="mr-2" style={{ color: 'var(--gaming-accent-secondary)' }} />
                    {feature}
                  </div>
                ))}
              </div>
              
              <div className="pt-3 border-t relative z-10" style={{ borderColor: 'var(--gaming-border)' }}>
                <span className="text-xs text-gaming-text-secondary">
                  Thinking time: {config.thinkingTime / 1000}s
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Personality Selection */}
      {selectedDifficulty && (
        <div className="mt-8 gaming-card p-6">
          <div className="flex items-center space-x-3 mb-6">
            <Settings size={24} style={{ color: 'var(--gaming-accent-primary)' }} />
            <h3 className="text-2xl font-gaming font-bold text-gaming-text-primary">Bot Personality</h3>
          </div>
          <p className="text-gaming-text-secondary mb-6">
            Customize how the bot plays against you
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                type: 'Aggressive' as const,
                name: 'Aggressive',
                description: 'Attacks quickly, takes risks',
                icon: '⚔️',
                gradient: 'from-red-500 to-orange-600'
              },
              {
                type: 'Balanced' as const,
                name: 'Balanced',
                description: 'Mix of attack and defense',
                icon: '⚖️',
                gradient: 'from-blue-500 to-indigo-600'
              },
              {
                type: 'Defensive' as const,
                name: 'Defensive',
                description: 'Solid play, fewer risks',
                icon: '🛡️',
                gradient: 'from-green-500 to-emerald-600'
              }
            ].map((personality) => {
              const isPersonalitySelected = selectedPersonality === personality.type;
              return (
                <div
                  key={personality.type}
                  className={`gaming-card cursor-pointer p-4 text-center transition-all duration-300 relative overflow-hidden ${
                    isPersonalitySelected
                      ? 'border-gaming-accent-primary transform scale-105'
                      : 'hover:border-gaming-accent-primary/50'
                  }`}
                  onClick={() => setSelectedPersonality(personality.type)}
                >
                  {/* Gradient overlay for selected state */}
                  {isPersonalitySelected && (
                    <div className={`absolute inset-0 bg-gradient-to-br ${personality.gradient} opacity-20 pointer-events-none`} />
                  )}
                  <div className="text-3xl mb-3 relative z-10">{personality.icon}</div>
                  <h4 className="font-gaming font-medium text-gaming-text-primary mb-2 relative z-10">{personality.name}</h4>
                  <p className="text-sm text-gaming-text-secondary relative z-10">{personality.description}</p>
                </div>
              );
            })}
            </div>
        </div>
      )}

      {/* Start Game Button */}
      <div className="text-center my-8">
        <button
          onClick={handleStartGame}
          disabled={!selectedDifficulty || isLoading}
          className={`px-8 py-4 text-lg font-gaming font-bold transition-all duration-300 ${
            selectedDifficulty && !isLoading
              ? 'gaming-button'
              : 'gaming-button-secondary opacity-50 cursor-not-allowed'
          }`}
        >
          {isLoading ? (
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
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
        </button>
      </div>

      {/* Selected Configuration Summary */}
      {selectedDifficulty && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="text-center">
              <h4 className="font-semibold text-blue-900 mb-2">Game Configuration</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-blue-800">
                <div>
                  <span className="font-medium">Difficulty:</span> {BOT_CONFIGS[selectedDifficulty].name}
                </div>
                <div>
                  <span className="font-medium">Personality:</span> {selectedPersonality}
                </div>
                <div>
                  <span className="font-medium">Thinking Time:</span> {BOT_CONFIGS[selectedDifficulty].thinkingTime / 1000}s
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
