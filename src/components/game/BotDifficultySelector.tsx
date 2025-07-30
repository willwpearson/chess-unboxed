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
    color: 'bg-green-500',
    thinkingTime: 500,
    personality: 'balanced',
    features: ['Random moves', 'No deep strategy', 'Great for beginners']
  },
  medium: {
    name: 'Intermediate',
    description: 'Good challenge for casual players',
    icon: Brain,
    color: 'bg-blue-500',
    thinkingTime: 1500,
    personality: 'balanced',
    features: ['Basic tactics', 'Simple strategy', 'Balanced gameplay']
  },
  hard: {
    name: 'Advanced',
    description: 'Strong opponent for experienced players',
    icon: Target,
    color: 'bg-orange-500',
    thinkingTime: 3000,
    personality: 'aggressive',
    features: ['Advanced tactics', 'Strong endgame', 'Aggressive play']
  },
  expert: {
    name: 'Grandmaster',
    description: 'Ultimate challenge for chess masters',
    icon: Crown,
    color: 'bg-purple-500',
    thinkingTime: 5000,
    personality: 'aggressive',
    features: ['Deep calculations', 'Perfect endgame', 'Master level']
  }
};

export function BotDifficultySelector({ onStartGame, isLoading }: BotDifficultySelectorProps) {
  const [selectedDifficulty, setSelectedDifficulty] = useState<BotDifficulty | null>(null);
  const [selectedPersonality, setSelectedPersonality] = useState<'aggressive' | 'defensive' | 'balanced'>('balanced');

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
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Choose Your Opponent</h2>
        <p className="text-lg text-gray-600">Select the difficulty level that matches your skill</p>
      </div>

      {/* Difficulty Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {(Object.keys(BOT_CONFIGS) as BotDifficulty[]).map((difficulty) => {
          const config = BOT_CONFIGS[difficulty];
          const IconComponent = config.icon;
          const isSelected = selectedDifficulty === difficulty;

          return (
            <div
              key={difficulty}
              className={`cursor-pointer transition-all duration-200 hover:scale-105 ${
                isSelected ? 'ring-2 ring-blue-500 ring-offset-2 shadow-lg' : 'hover:shadow-md'
              }`}
              onClick={() => setSelectedDifficulty(difficulty)}
            >
              <Card>
                <CardHeader className="text-center pb-2">
                  <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full ${config.color} text-white mx-auto mb-3`}>
                    <IconComponent size={32} />
                  </div>
                  <h3 className="text-xl font-semibold">{config.name}</h3>
                  <p className="text-sm text-gray-600">{config.description}</p>
                </CardHeader>
                <CardContent className="space-y-2 pt-0">
                  {config.features.map((feature, index) => (
                    <div key={index} className="flex items-center text-sm text-gray-600">
                      <Zap size={14} className="mr-2 text-yellow-500" />
                      {feature}
                    </div>
                  ))}
                  <div className="mt-3 pt-3 border-t text-center">
                    <span className="text-xs text-gray-500">
                      Thinking time: {config.thinkingTime / 1000}s
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          );
        })}
      </div>

      {/* Personality Selection */}
      {selectedDifficulty && (
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Settings size={20} />
              <h3 className="text-lg font-semibold">Bot Personality</h3>
            </div>
            <p className="text-sm text-gray-600">
              Customize how the bot plays against you
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                {
                  type: 'aggressive' as const,
                  name: 'Aggressive',
                  description: 'Attacks quickly, takes risks',
                  icon: '⚔️'
                },
                {
                  type: 'balanced' as const,
                  name: 'Balanced',
                  description: 'Mix of attack and defense',
                  icon: '⚖️'
                },
                {
                  type: 'defensive' as const,
                  name: 'Defensive',
                  description: 'Solid play, fewer risks',
                  icon: '🛡️'
                }
              ].map((personality) => (
                <div
                  key={personality.type}
                  className={`p-4 border rounded-lg cursor-pointer transition-all ${
                    selectedPersonality === personality.type
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedPersonality(personality.type)}
                >
                  <div className="text-center">
                    <div className="text-2xl mb-2">{personality.icon}</div>
                    <h4 className="font-medium mb-1">{personality.name}</h4>
                    <p className="text-sm text-gray-600">{personality.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Start Game Button */}
      <div className="text-center">
        <Button
          onClick={handleStartGame}
          disabled={!selectedDifficulty || isLoading}
          className={`px-8 py-3 text-lg font-semibold ${
            selectedDifficulty
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
