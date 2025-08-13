'use client';

import React from 'react';
import { Palette, Gamepad2, Settings, Eye, Volume2, VolumeX } from 'lucide-react';
import { UserPreferences } from '@/types/game';

interface GameSettingsProps {
  preferences: UserPreferences;
  onUpdatePreference: <K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) => void;
}

// Toggle switch component
const ToggleSwitch = ({ 
  checked, 
  onChange, 
  label, 
  description, 
  icon 
}: { 
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
  description: string;
  icon?: React.ReactNode;
}) => (
  <div className="gaming-card flex items-center justify-between p-4">
    <div className="flex items-center space-x-3">
      {icon && (
        <div className="text-[var(--gaming-accent-primary)]">
          {icon}
        </div>
      )}
      <div>
        <h4 className="font-gaming font-medium text-gaming-text-primary">{label}</h4>
        <p className="text-sm text-gaming-text-secondary">{description}</p>
      </div>
    </div>
    <button
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        checked
          ? 'bg-gaming-accent-primary'
          : 'bg-gaming-border'
      }`}
      onClick={() => onChange(!checked)}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  </div>
);

// Select dropdown component
const SelectDropdown = ({ 
  value, 
  onChange, 
  options, 
  label, 
  description 
}: { 
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  label: string;
  description: string;
}) => (
  <div className="gaming-card p-4">
    <label className="block text-sm font-gaming font-medium text-gaming-text-primary mb-2">
      {label}
    </label>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-gaming-accent-primary transition-all bg-[var(--gaming-bg-tertiary)] border-2 border-[var(--gaming-border)] text-[var(--gaming-text-primary)]"
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
    <p className="text-xs text-gaming-text-secondary mt-1">
      {description}
    </p>
  </div>
);

export function GameSettings({ preferences, onUpdatePreference }: GameSettingsProps) {
  return (
    <div className="space-y-6">
      {/* Board Theme */}
      <div className="gaming-card p-6">
        <div className="flex items-center space-x-3 mb-6">
          <Palette size={24} className="text-[var(--gaming-accent-primary)]" />
          <h2 className="text-2xl font-gaming font-bold text-gaming-text-primary">Board Theme</h2>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {(['classic', 'modern', 'wood', 'neon', 'cyberpunk'] as const).map((themeOption) => (
            <div
              key={themeOption}
              className={`gaming-card cursor-pointer p-4 text-center transition-all ${
                preferences.boardTheme === themeOption
                  ? 'border-gaming-accent-primary bg-gaming-accent-primary/10'
                  : 'hover:border-gaming-accent-primary/50'
              }`}
              onClick={() => onUpdatePreference('boardTheme', themeOption)}
            >
              <div className="grid grid-cols-2 gap-1 w-12 h-12 mx-auto mb-3">
                <div className={`${themeOption === 'classic' ? 'bg-amber-100' : themeOption === 'modern' ? 'bg-slate-100' : themeOption === 'wood' ? 'bg-yellow-200' : themeOption === 'neon' ? 'bg-cyan-900' : 'bg-gray-900'} rounded`}></div>
                <div className={`${themeOption === 'classic' ? 'bg-amber-800' : themeOption === 'modern' ? 'bg-slate-600' : themeOption === 'wood' ? 'bg-yellow-800' : themeOption === 'neon' ? 'bg-purple-900' : 'bg-purple-900'} rounded`}></div>
                <div className={`${themeOption === 'classic' ? 'bg-amber-100' : themeOption === 'modern' ? 'bg-slate-100' : themeOption === 'wood' ? 'bg-yellow-200' : themeOption === 'neon' ? 'bg-cyan-400' : 'bg-purple-500'} rounded`}></div>
                <div className={`${themeOption === 'classic' ? 'bg-amber-800' : themeOption === 'modern' ? 'bg-slate-600' : themeOption === 'wood' ? 'bg-yellow-800' : themeOption === 'neon' ? 'bg-pink-400' : 'bg-teal-400'} rounded`}></div>
              </div>
              <h4 className="font-gaming font-medium text-gaming-text-primary mb-1 capitalize">{themeOption}</h4>
            </div>
          ))}
        </div>
      </div>

      {/* Piece Set */}
      <div className="gaming-card p-6">
        <div className="flex items-center space-x-3 mb-6">
          <Gamepad2 size={24} className="text-[var(--gaming-accent-primary)]" />
          <h2 className="text-2xl font-gaming font-bold text-gaming-text-primary">Piece Set</h2>
        </div>
        
        <div className="grid grid-cols-3 gap-4">
          {(['classic', 'modern', 'symbols'] as const).map((set) => (
            <div
              key={set}
              className={`gaming-card cursor-pointer p-4 text-center transition-all ${
                preferences.pieceSet === set
                  ? 'border-gaming-accent-primary bg-gaming-accent-primary/10'
                  : 'hover:border-gaming-accent-primary/50'
              }`}
              onClick={() => onUpdatePreference('pieceSet', set)}
            >
              <div className="text-3xl mb-2">
                {set === 'classic' ? '♚' : set === 'modern' ? '🤴' : '●'}
              </div>
              <span className="font-gaming font-medium text-gaming-text-primary text-sm capitalize">{set}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Game Options */}
      <div className="gaming-card p-6">
        <div className="flex items-center space-x-3 mb-6">
          <Settings size={24} className="text-[var(--gaming-accent-primary)]" />
          <h2 className="text-2xl font-gaming font-bold text-gaming-text-primary">Game Options</h2>
        </div>
        
        <div className="space-y-4">
          <ToggleSwitch
            checked={preferences.showCoordinates}
            onChange={(value) => onUpdatePreference('showCoordinates', value)}
            label="Show Coordinates"
            description="Display board coordinates (a-h, 1-8) around the board"
            icon={<Eye size={20} />}
          />
          
          <ToggleSwitch
            checked={preferences.showPossibleMoves}
            onChange={(value) => onUpdatePreference('showPossibleMoves', value)}
            label="Show Possible Moves"
            description="Highlight possible moves when a piece is selected"
            icon={<Gamepad2 size={20} />}
          />
          
          <ToggleSwitch
            checked={preferences.autoQueen}
            onChange={(value) => onUpdatePreference('autoQueen', value)}
            label="Auto-promote to Queen"
            description="Automatically promote pawns to queens"
            icon={<Settings size={20} />}
          />
          
          <ToggleSwitch
            checked={preferences.soundEnabled}
            onChange={(value) => onUpdatePreference('soundEnabled', value)}
            label="Sound Effects"
            description="Enable sound effects for moves and game events"
            icon={preferences.soundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
          />
        </div>

        <div className="mt-6">
          <SelectDropdown
            value={preferences.moveAnimationSpeed}
            onChange={(value) => onUpdatePreference('moveAnimationSpeed', value as any)}
            options={[
              { value: 'instant', label: 'Instant' },
              { value: 'fast', label: 'Fast' },
              { value: 'normal', label: 'Normal' },
              { value: 'slow', label: 'Slow' },
            ]}
            label="Move Animation Speed"
            description="Speed of piece movement animations"
          />
        </div>
      </div>
    </div>
  );
}