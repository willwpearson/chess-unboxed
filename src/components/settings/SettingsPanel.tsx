/**
 * Settings Component
 * User preferences and game settings
 */
'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useUserStore } from '@/store/userStore';
import { useTheme } from '@/components/providers/ThemeProvider';
import { UserPreferences } from '@/types/game';
import { Settings, User, Palette, Volume2, VolumeX, Eye, Gamepad2, Save, Moon, Sun, Trophy } from 'lucide-react';

export function SettingsPanel() {
  const { user, updatePreferences } = useUserStore();
  const { theme, setTheme } = useTheme();
  const [tempPreferences, setTempPreferences] = useState<UserPreferences>(
    user?.preferences || {
      theme: 'light',
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
      
      // Update the theme immediately when saved
      if (tempPreferences.theme !== theme) {
        setTheme(tempPreferences.theme);
      }
      
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
      theme: 'light',
      boardTheme: 'classic',
      pieceSet: 'classic',
      showCoordinates: true,
      showPossibleMoves: true,
      soundEnabled: true,
      autoQueen: true,
    };
    setTempPreferences(defaultPreferences);
  };

  const renderBoardThemeOption = (boardTheme: 'classic' | 'modern' | 'wood' | 'neon' | 'cyberpunk', name: string, colors: string[], description: string) => (
    <div
      className={`gaming-card cursor-pointer p-4 text-center transition-all ${
        tempPreferences.boardTheme === boardTheme
          ? 'border-gaming-accent-primary bg-gaming-accent-primary/10'
          : 'hover:border-gaming-accent-primary/50'
      }`}
      onClick={() => setTempPreferences({ ...tempPreferences, boardTheme })}
    >
      <div className="grid grid-cols-2 gap-1 w-12 h-12 mx-auto mb-3">
        {colors.map((color, index) => (
          <div key={index} className={`${color} rounded`}></div>
        ))}
      </div>
      <h4 className="font-gaming font-medium text-gaming-text-primary mb-1">{name}</h4>
      <p className="text-xs text-gaming-text-secondary">{description}</p>
    </div>
  );

  const renderPieceSetOption = (set: 'classic' | 'modern' | 'symbols', name: string, symbol: string) => (
    <div
      className={`gaming-card cursor-pointer p-4 text-center transition-all ${
        tempPreferences.pieceSet === set
          ? 'border-gaming-accent-primary bg-gaming-accent-primary/10'
          : 'hover:border-gaming-accent-primary/50'
      }`}
      onClick={() => setTempPreferences({ ...tempPreferences, pieceSet: set })}
    >
      <div className="text-3xl mb-2">{symbol}</div>
      <span className="font-gaming font-medium text-gaming-text-primary text-sm">{name}</span>
    </div>
  );

  const renderToggleOption = (
    key: keyof UserPreferences,
    label: string,
    description: string,
    icon: React.ReactNode
  ) => (
    <div className="gaming-card flex items-center justify-between p-4">
      <div className="flex items-center space-x-3">
        <div style={{ color: 'var(--gaming-accent-primary)' }}>
          {icon}
        </div>
        <div>
          <h4 className="font-gaming font-medium text-gaming-text-primary">{label}</h4>
          <p className="text-sm text-gaming-text-secondary">{description}</p>
        </div>
      </div>
      <button
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          tempPreferences[key]
            ? 'bg-gaming-accent-primary'
            : 'bg-gaming-border'
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
    <div className="min-h-screen" style={{ background: 'var(--gaming-bg-primary)' }}>
      <div className="container mx-auto px-4 py-8">
        <div className="w-full max-w-4xl mx-auto space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-gaming font-bold gaming-title mb-2">Settings</h1>
              <p className="text-gaming-text-secondary">Customize your chess experience and unlock your potential</p>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={handleReset}
                disabled={isLoading}
                className="gaming-button-secondary"
              >
                Reset to Default
              </button>
              
              <button
                onClick={handleSave}
                disabled={isLoading}
                className={`gaming-button ${isLoading ? 'opacity-50' : ''}`}
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
              </button>
            </div>
          </div>

          {/* Theme Selection */}
          <div className="gaming-card p-6">
            <div className="flex items-center space-x-3 mb-6">
              {theme === 'light' ? <Sun size={24} style={{ color: 'var(--gaming-accent-primary)' }} /> : <Moon size={24} style={{ color: 'var(--gaming-accent-primary)' }} />}
              <h2 className="text-2xl font-gaming font-bold text-gaming-text-primary">App Theme</h2>
            </div>
            <p className="text-gaming-text-secondary mb-6">Choose between light and dark mode for the entire application</p>
            
            <div className="grid grid-cols-2 gap-4">
              <div
                className={`gaming-card cursor-pointer p-6 text-center transition-all ${
                  tempPreferences.theme === 'light'
                    ? 'border-gaming-accent-primary bg-gaming-accent-primary/10'
                    : 'hover:border-gaming-accent-primary/50'
                }`}
                onClick={() => setTempPreferences({ ...tempPreferences, theme: 'light' })}
              >
                <Sun size={32} className="mx-auto mb-3" style={{ color: 'var(--gaming-accent-secondary)' }} />
                <h3 className="font-gaming font-bold text-gaming-text-primary mb-2">Light Mode</h3>
                <p className="text-sm text-gaming-text-secondary">Clean and bright interface</p>
              </div>
              
              <div
                className={`gaming-card cursor-pointer p-6 text-center transition-all ${
                  tempPreferences.theme === 'dark'
                    ? 'border-gaming-accent-primary bg-gaming-accent-primary/10'
                    : 'hover:border-gaming-accent-primary/50'
                }`}
                onClick={() => setTempPreferences({ ...tempPreferences, theme: 'dark' })}
              >
                <Moon size={32} className="mx-auto mb-3" style={{ color: 'var(--gaming-accent-primary)' }} />
                <h3 className="font-gaming font-bold text-gaming-text-primary mb-2">Dark Mode</h3>
                <p className="text-sm text-gaming-text-secondary">Easy on the eyes, gaming aesthetic</p>
              </div>
            </div>
          </div>

          {/* Player Info */}
          <div className="gaming-card p-6">
            <div className="flex items-center space-x-3 mb-6">
              <User size={24} style={{ color: 'var(--gaming-accent-primary)' }} />
              <h2 className="text-2xl font-gaming font-bold text-gaming-text-primary">Player Information</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-gaming font-medium text-gaming-text-primary mb-2">
                  Display Name
                </label>
                <input
                  type="text"
                  value={user?.name || ''}
                  className="w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-gaming-accent-primary transition-all"
                  style={{ 
                    background: 'var(--gaming-bg-tertiary)', 
                    border: '2px solid var(--gaming-border)',
                    color: 'var(--gaming-text-primary)'
                  }}
                  placeholder="Enter your display name"
                  readOnly
                />
                <p className="text-xs text-gaming-text-secondary mt-1">
                  Name changes coming soon
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-gaming font-medium text-gaming-text-primary mb-2">
                  Current Rating
                </label>
                <div className="text-3xl font-gaming font-bold mb-2" style={{ color: 'var(--gaming-accent-primary)' }}>
                  {user?.stats.rating || 1200}
                </div>
                <p className="text-sm text-gaming-text-secondary">
                  Based on {user?.stats.gamesPlayed || 0} games played
                </p>
              </div>
            </div>
          </div>

          {/* Board Theme */}
          <div className="gaming-card p-6">
            <div className="flex items-center space-x-3 mb-6">
              <Palette size={24} style={{ color: 'var(--gaming-accent-primary)' }} />
              <h2 className="text-2xl font-gaming font-bold text-gaming-text-primary">Board Theme</h2>
            </div>
            <p className="text-gaming-text-secondary mb-6">Choose your preferred board appearance and style</p>
            
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {renderBoardThemeOption('classic', 'Classic', ['bg-amber-100', 'bg-amber-800', 'bg-amber-100', 'bg-amber-800'], 'Traditional chess board')}
              {renderBoardThemeOption('modern', 'Modern', ['bg-slate-100', 'bg-slate-600', 'bg-slate-100', 'bg-slate-600'], 'Clean minimalist style')}
              {renderBoardThemeOption('wood', 'Wood', ['bg-yellow-200', 'bg-yellow-800', 'bg-yellow-200', 'bg-yellow-800'], 'Warm wooden texture')}
              {renderBoardThemeOption('neon', 'Neon', ['bg-cyan-900', 'bg-purple-900', 'bg-cyan-400', 'bg-pink-400'], 'Electric gaming vibe')}
              {renderBoardThemeOption('cyberpunk', 'Cyberpunk', ['bg-gray-900', 'bg-purple-900', 'bg-purple-500', 'bg-teal-400'], 'Futuristic tech aesthetic')}
            </div>
          </div>

          {/* Piece Set */}
          <div className="gaming-card p-6">
            <div className="flex items-center space-x-3 mb-6">
              <Gamepad2 size={24} style={{ color: 'var(--gaming-accent-primary)' }} />
              <h2 className="text-2xl font-gaming font-bold text-gaming-text-primary">Piece Set</h2>
            </div>
            <p className="text-gaming-text-secondary mb-6">Select your preferred chess piece style</p>
            
            <div className="grid grid-cols-3 gap-4">
              {renderPieceSetOption('classic', 'Classic', '♚')}
              {renderPieceSetOption('modern', 'Modern', '🤴')}
              {renderPieceSetOption('symbols', 'Symbols', '●')}
            </div>
          </div>

          {/* Game Options */}
          <div className="gaming-card p-6">
            <div className="flex items-center space-x-3 mb-6">
              <Settings size={24} style={{ color: 'var(--gaming-accent-primary)' }} />
              <h2 className="text-2xl font-gaming font-bold text-gaming-text-primary">Game Options</h2>
            </div>
            <p className="text-gaming-text-secondary mb-6">Configure gameplay preferences and assistance features</p>
            
            <div className="space-y-4">
              {renderToggleOption(
                'showCoordinates',
                'Show Coordinates',
                'Display board coordinates (a-h, 1-8) around the board',
                <Eye size={20} />
              )}
              
              {renderToggleOption(
                'showPossibleMoves',
                'Show Possible Moves',
                'Highlight possible moves when a piece is selected',
                <Gamepad2 size={20} />
              )}
              
              {renderToggleOption(
                'autoQueen',
                'Auto-promote to Queen',
                'Automatically promote pawns to queens',
                <Settings size={20} />
              )}
              
              {renderToggleOption(
                'soundEnabled',
                'Sound Effects',
                'Enable sound effects for moves and game events',
                tempPreferences.soundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />
              )}
            </div>
          </div>

          {/* Game Statistics */}
          {user && (
            <div className="gaming-card p-6">
              <div className="flex items-center space-x-3 mb-6">
                <Trophy size={24} style={{ color: 'var(--gaming-accent-primary)' }} />
                <h2 className="text-2xl font-gaming font-bold text-gaming-text-primary">Game Statistics</h2>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="text-center gaming-card p-4">
                  <div className="text-3xl font-gaming font-bold mb-2" style={{ color: 'var(--gaming-accent-primary)' }}>
                    {user.stats.gamesPlayed}
                  </div>
                  <div className="text-sm font-medium text-gaming-text-secondary">Games Played</div>
                </div>
                <div className="text-center gaming-card p-4">
                  <div className="text-3xl font-gaming font-bold mb-2" style={{ color: 'var(--gaming-accent-secondary)' }}>
                    {user.stats.wins}
                  </div>
                  <div className="text-sm font-medium text-gaming-text-secondary">Wins</div>
                </div>
                <div className="text-center gaming-card p-4">
                  <div className="text-3xl font-gaming font-bold mb-2" style={{ color: 'var(--gaming-accent-danger)' }}>
                    {user.stats.losses}
                  </div>
                  <div className="text-sm font-medium text-gaming-text-secondary">Losses</div>
                </div>
                <div className="text-center gaming-card p-4">
                  <div className="text-3xl font-gaming font-bold mb-2 text-yellow-500">
                    {user.stats.draws}
                  </div>
                  <div className="text-sm font-medium text-gaming-text-secondary">Draws</div>
                </div>
              </div>
              
              <div className="mt-8 text-center gaming-card p-6">
                <h3 className="font-gaming font-bold text-gaming-text-primary mb-2">Endless Mode Champion</h3>
                <div className="text-4xl font-gaming font-bold mb-2" style={{ color: 'var(--gaming-accent-primary)' }}>
                  {user.stats.endlessHighScore}
                </div>
                <p className="text-gaming-text-secondary">Consecutive wins achieved</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
