/**
 * Settings Component
 * User preferences and game settings
 */
'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useUserStore } from '@/store/userStore';
import { UserPreferences } from '@/types/game';
import { Settings, User, Palette, Volume2, VolumeX, Eye, Gamepad2, Save } from 'lucide-react';

export function SettingsPanel() {
  const { user, updatePreferences } = useUserStore();
  const [tempPreferences, setTempPreferences] = useState<UserPreferences>(
    user?.preferences || {
      boardTheme: 'classic',
      pieceSet: 'classic',
      showCoordinates: true,
      showPossibleMoves: true,
      soundEnabled: true,
      autoQueen: true,
    }
  );
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    setIsLoading(true);
    
    try {
      updatePreferences(tempPreferences);
      
      // TODO: Save to backend
      // await fetch('/api/users/preferences', {
      //   method: 'PUT',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(tempPreferences)
      // });
      
      console.log('Preferences saved:', tempPreferences);
    } catch (error) {
      console.error('Error saving preferences:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    const defaultPreferences: UserPreferences = {
      boardTheme: 'classic',
      pieceSet: 'classic',
      showCoordinates: true,
      showPossibleMoves: true,
      soundEnabled: true,
      autoQueen: true,
    };
    setTempPreferences(defaultPreferences);
  };

  const renderThemeOption = (theme: 'classic' | 'modern' | 'wood', name: string, colors: string[]) => (
    <div
      className={`p-3 border rounded-lg cursor-pointer transition-all ${
        tempPreferences.boardTheme === theme
          ? 'border-blue-500 bg-blue-50'
          : 'border-gray-200 hover:border-gray-300'
      }`}
      onClick={() => setTempPreferences({ ...tempPreferences, boardTheme: theme })}
    >
      <div className="text-center">
        <div className="grid grid-cols-2 gap-1 w-12 h-12 mx-auto mb-2">
          {colors.map((color, index) => (
            <div key={index} className={`${color} rounded`}></div>
          ))}
        </div>
        <span className="font-medium">{name}</span>
      </div>
    </div>
  );

  const renderPieceSetOption = (set: 'classic' | 'modern' | 'symbols', name: string, symbol: string) => (
    <div
      className={`p-3 border rounded-lg cursor-pointer transition-all ${
        tempPreferences.pieceSet === set
          ? 'border-blue-500 bg-blue-50'
          : 'border-gray-200 hover:border-gray-300'
      }`}
      onClick={() => setTempPreferences({ ...tempPreferences, pieceSet: set })}
    >
      <div className="text-center">
        <div className="text-2xl mb-1">{symbol}</div>
        <span className="font-medium text-sm">{name}</span>
      </div>
    </div>
  );

  const renderToggleOption = (
    key: keyof UserPreferences,
    label: string,
    description: string,
    icon: React.ReactNode
  ) => (
    <div className="flex items-center justify-between p-4 border rounded-lg">
      <div className="flex items-center space-x-3">
        {icon}
        <div>
          <h4 className="font-medium">{label}</h4>
          <p className="text-sm text-gray-600">{description}</p>
        </div>
      </div>
      <button
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          tempPreferences[key]
            ? 'bg-blue-600'
            : 'bg-gray-200'
        }`}
        onClick={() => setTempPreferences({ 
          ...tempPreferences, 
          [key]: !tempPreferences[key] 
        })}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            tempPreferences[key] ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600 mt-1">Customize your chess experience</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            onClick={handleReset}
            disabled={isLoading}
          >
            Reset to Default
          </Button>
          
          <Button
            onClick={handleSave}
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isLoading ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Saving...
              </div>
            ) : (
              <div className="flex items-center">
                <Save size={16} className="mr-2" />
                Save Changes
              </div>
            )}
          </Button>
        </div>
      </div>

      {/* Player Info */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <User size={20} />
            <h2 className="text-xl font-semibold">Player Information</h2>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Display Name
              </label>
              <input
                type="text"
                value={user?.name || ''}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your display name"
                readOnly
              />
              <p className="text-xs text-gray-500 mt-1">
                Name changes coming soon
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Current Rating
              </label>
              <div className="text-2xl font-bold text-blue-600">
                {user?.stats.rating || 1200}
              </div>
              <p className="text-xs text-gray-500">
                Based on {user?.stats.gamesPlayed || 0} games played
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Board Theme */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Palette size={20} />
            <h2 className="text-xl font-semibold">Board Theme</h2>
          </div>
          <p className="text-sm text-gray-600">Choose your preferred board appearance</p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            {renderThemeOption('classic', 'Classic', ['bg-amber-100', 'bg-amber-800', 'bg-amber-100', 'bg-amber-800'])}
            {renderThemeOption('modern', 'Modern', ['bg-slate-100', 'bg-slate-600', 'bg-slate-100', 'bg-slate-600'])}
            {renderThemeOption('wood', 'Wood', ['bg-yellow-200', 'bg-yellow-800', 'bg-yellow-200', 'bg-yellow-800'])}
          </div>
        </CardContent>
      </Card>

      {/* Piece Set */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Gamepad2 size={20} />
            <h2 className="text-xl font-semibold">Piece Set</h2>
          </div>
          <p className="text-sm text-gray-600">Select your preferred chess piece style</p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            {renderPieceSetOption('classic', 'Classic', '♚')}
            {renderPieceSetOption('modern', 'Modern', '🤴')}
            {renderPieceSetOption('symbols', 'Symbols', '●')}
          </div>
        </CardContent>
      </Card>

      {/* Game Options */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Settings size={20} />
            <h2 className="text-xl font-semibold">Game Options</h2>
          </div>
          <p className="text-sm text-gray-600">Configure gameplay preferences</p>
        </CardHeader>
        <CardContent className="space-y-4">
          {renderToggleOption(
            'showCoordinates',
            'Show Coordinates',
            'Display board coordinates (a-h, 1-8) around the board',
            <Eye size={20} className="text-gray-600" />
          )}
          
          {renderToggleOption(
            'showPossibleMoves',
            'Show Possible Moves',
            'Highlight possible moves when a piece is selected',
            <Gamepad2 size={20} className="text-gray-600" />
          )}
          
          {renderToggleOption(
            'autoQueen',
            'Auto-promote to Queen',
            'Automatically promote pawns to queens',
            <Settings size={20} className="text-gray-600" />
          )}
          
          {renderToggleOption(
            'soundEnabled',
            'Sound Effects',
            'Enable sound effects for moves and game events',
            tempPreferences.soundEnabled ? 
              <Volume2 size={20} className="text-gray-600" /> : 
              <VolumeX size={20} className="text-gray-600" />
          )}
        </CardContent>
      </Card>

      {/* Game Statistics */}
      {user && (
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold">Game Statistics</h2>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{user.stats.gamesPlayed}</div>
                <div className="text-sm text-gray-600">Games Played</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{user.stats.wins}</div>
                <div className="text-sm text-gray-600">Wins</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{user.stats.losses}</div>
                <div className="text-sm text-gray-600">Losses</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">{user.stats.draws}</div>
                <div className="text-sm text-gray-600">Draws</div>
              </div>
            </div>
            
            <div className="mt-6 text-center">
              <div className="text-lg font-semibold text-purple-600">
                Endless Mode High Score: {user.stats.endlessHighScore}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
