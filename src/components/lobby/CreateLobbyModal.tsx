/**
 * Create Lobby Modal Component
 * Modal for creating new multiplayer lobbies
 */
'use client';

import React, { useState } from 'react';
import { TimeControl, GameMode } from '@/types/game';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { X, Users, Clock, Lock, Unlock, Gamepad2 } from 'lucide-react';

interface CreateLobbyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateLobby: (lobbyData: {
    name: string;
    isPrivate: boolean;
    gameMode: GameMode;
    timeControl?: TimeControl;
  }) => void;
  isLoading?: boolean;
}

export function CreateLobbyModal({ isOpen, onClose, onCreateLobby, isLoading }: CreateLobbyModalProps) {
  const [lobbyName, setLobbyName] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [gameMode, setGameMode] = useState<GameMode>('multiplayer');
  const [hasTimeLimit, setHasTimeLimit] = useState(true);
  const [initialMinutes, setInitialMinutes] = useState(10);
  const [increment, setIncrement] = useState(5);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!lobbyName.trim()) return;

    const timeControl = hasTimeLimit ? {
      initialTime: initialMinutes * 60,
      increment: increment
    } : undefined;

    onCreateLobby({
      name: lobbyName.trim(),
      isPrivate,
      gameMode,
      timeControl
    });
  };

  const handleReset = () => {
    setLobbyName('');
    setIsPrivate(false);
    setGameMode('multiplayer');
    setHasTimeLimit(true);
    setInitialMinutes(10);
    setIncrement(5);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Users size={20} />
                <h2 className="text-xl font-semibold">Create New Lobby</h2>
              </div>
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Lobby Name */}
              <div>
                <label htmlFor="lobbyName" className="block text-sm font-medium text-gray-700 mb-2">
                  Lobby Name *
                </label>
                <input
                  type="text"
                  id="lobbyName"
                  value={lobbyName}
                  onChange={(e) => setLobbyName(e.target.value)}
                  placeholder="Enter lobby name..."
                  maxLength={50}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
                <div className="text-xs text-gray-500 mt-1">
                  {lobbyName.length}/50 characters
                </div>
              </div>

              {/* Privacy Setting */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Privacy
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div
                    className={`p-3 border rounded-lg cursor-pointer transition-all ${
                      !isPrivate ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setIsPrivate(false)}
                  >
                    <div className="flex items-center space-x-2">
                      <Unlock size={16} />
                      <span className="font-medium">Public</span>
                    </div>
                    <p className="text-xs text-gray-600 mt-1">Anyone can join</p>
                  </div>
                  
                  <div
                    className={`p-3 border rounded-lg cursor-pointer transition-all ${
                      isPrivate ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setIsPrivate(true)}
                  >
                    <div className="flex items-center space-x-2">
                      <Lock size={16} />
                      <span className="font-medium">Private</span>
                    </div>
                    <p className="text-xs text-gray-600 mt-1">Invite only</p>
                  </div>
                </div>
              </div>

              {/* Game Mode */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Game Mode
                </label>
                <div className="space-y-2">
                  {[
                    { value: 'multiplayer' as GameMode, label: 'Standard Multiplayer', description: 'Regular chess game' },
                    { value: 'endless' as GameMode, label: 'Endless Challenge', description: 'Continuous games' }
                  ].map((mode) => (
                    <div
                      key={mode.value}
                      className={`p-3 border rounded-lg cursor-pointer transition-all ${
                        gameMode === mode.value ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setGameMode(mode.value)}
                    >
                      <div className="flex items-center space-x-2">
                        <Gamepad2 size={16} />
                        <span className="font-medium">{mode.label}</span>
                      </div>
                      <p className="text-xs text-gray-600 mt-1">{mode.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Time Control */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Time Control
                </label>
                
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="hasTimeLimit"
                      checked={hasTimeLimit}
                      onChange={(e) => setHasTimeLimit(e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <label htmlFor="hasTimeLimit" className="text-sm">
                      Enable time limit
                    </label>
                  </div>

                  {hasTimeLimit && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="initialMinutes" className="block text-xs text-gray-600 mb-1">
                          Minutes per player
                        </label>
                        <select
                          id="initialMinutes"
                          value={initialMinutes}
                          onChange={(e) => setInitialMinutes(Number(e.target.value))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value={1}>1 minute</option>
                          <option value={3}>3 minutes</option>
                          <option value={5}>5 minutes</option>
                          <option value={10}>10 minutes</option>
                          <option value={15}>15 minutes</option>
                          <option value={30}>30 minutes</option>
                          <option value={60}>1 hour</option>
                        </select>
                      </div>
                      
                      <div>
                        <label htmlFor="increment" className="block text-xs text-gray-600 mb-1">
                          Increment (seconds)
                        </label>
                        <select
                          id="increment"
                          value={increment}
                          onChange={(e) => setIncrement(Number(e.target.value))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value={0}>No increment</option>
                          <option value={1}>+1 second</option>
                          <option value={3}>+3 seconds</option>
                          <option value={5}>+5 seconds</option>
                          <option value={10}>+10 seconds</option>
                          <option value={15}>+15 seconds</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {hasTimeLimit && (
                    <div className="text-xs text-gray-600 flex items-center space-x-1">
                      <Clock size={12} />
                      <span>
                        Format: {initialMinutes}+{increment} 
                        {increment === 0 ? ' (no increment)' : ` (+${increment}s per move)`}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-between pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleReset}
                  disabled={isLoading}
                >
                  Reset
                </Button>
                
                <div className="flex items-center space-x-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onClose}
                    disabled={isLoading}
                  >
                    Cancel
                  </Button>
                  
                  <Button
                    type="submit"
                    disabled={!lobbyName.trim() || isLoading}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {isLoading ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Creating...
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <Users size={16} className="mr-2" />
                        Create Lobby
                      </div>
                    )}
                  </Button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
