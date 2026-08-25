'use client';

import React from 'react';
import { Palette, Gamepad2, Settings, Eye, Volume2, VolumeX, Languages, Crown, Circle } from 'lucide-react';
import { UserPreferences } from '@/types/game';
import { Card } from '@/components/ui/Card';

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
  <Card className="flex items-center justify-between p-4">
    <div className="flex items-center space-x-3">
      {icon && (
        <div className="text-accent-primary">
          {icon}
        </div>
      )}
      <div>
        <h4 className="font-gaming font-medium text-fg">{label}</h4>
        <p className="text-sm text-fg-muted">{description}</p>
      </div>
    </div>
    <button
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        checked
          ? 'bg-accent-primary'
          : 'bg-surface-sunken border border-border-subtle'
      }`}
      onClick={() => onChange(!checked)}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-surface-overlay transition-transform ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  </Card>
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
  <Card className="p-4">
    <label className="block text-sm font-gaming font-medium text-fg mb-2">
      {label}
    </label>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-4 py-3 rounded-md border border-border-subtle focus:outline-none focus:ring-2 focus:ring-accent-primary transition-all bg-surface-sunken text-fg"
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
    <p className="text-xs text-fg-muted mt-1">
      {description}
    </p>
  </Card>
);

// Language options
const languageOptions = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Español' },
  { value: 'fr', label: 'Français' },
  { value: 'de', label: 'Deutsch' },
  { value: 'ru', label: 'Русский' },
  { value: 'zh', label: '中文' },
  { value: 'ja', label: '日本語' },
  { value: 'ko', label: '한국어' },
];

export function GameSettings({ preferences, onUpdatePreference }: GameSettingsProps) {
  return (
    <div className="space-y-6">
      {/* Language Settings */}
      <Card className="p-6">
        <div className="flex items-center space-x-3 mb-6">
          <Languages size={24} className="text-accent-primary" />
          <h2 className="text-2xl font-gaming font-bold text-fg">Language</h2>
        </div>

        <SelectDropdown
          value={preferences.language}
          onChange={(value) => onUpdatePreference('language', value as any)}
          options={languageOptions}
          label="Language"
          description="Choose your preferred language"
        />
      </Card>

      {/* Board Theme */}
      <Card className="p-6">
        <div className="flex items-center space-x-3 mb-6">
          <Palette size={24} className="text-accent-primary" />
          <h2 className="text-2xl font-gaming font-bold text-fg">Board Theme</h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {(['classic', 'modern', 'wood', 'neon', 'cyberpunk'] as const).map((themeOption) => (
            <div
              key={themeOption}
              className={`rounded-lg border p-4 text-center cursor-pointer transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 ${
                preferences.boardTheme === themeOption
                  ? 'border-accent-primary bg-accent-primary/10'
                  : 'border-border-subtle bg-surface-raised'
              }`}
              onClick={() => onUpdatePreference('boardTheme', themeOption)}
            >
              {/* Board-skin preview swatches intentionally use fixed per-theme colors, not tokens */}
              <div className="grid grid-cols-2 gap-1 w-12 h-12 mx-auto mb-3">
                <div className={`${themeOption === 'classic' ? 'bg-amber-100' : themeOption === 'modern' ? 'bg-slate-100' : themeOption === 'wood' ? 'bg-yellow-200' : themeOption === 'neon' ? 'bg-cyan-900' : 'bg-gray-900'} rounded`}></div>
                <div className={`${themeOption === 'classic' ? 'bg-amber-800' : themeOption === 'modern' ? 'bg-slate-600' : themeOption === 'wood' ? 'bg-yellow-800' : themeOption === 'neon' ? 'bg-purple-900' : 'bg-purple-900'} rounded`}></div>
                <div className={`${themeOption === 'classic' ? 'bg-amber-100' : themeOption === 'modern' ? 'bg-slate-100' : themeOption === 'wood' ? 'bg-yellow-200' : themeOption === 'neon' ? 'bg-cyan-400' : 'bg-purple-500'} rounded`}></div>
                <div className={`${themeOption === 'classic' ? 'bg-amber-800' : themeOption === 'modern' ? 'bg-slate-600' : themeOption === 'wood' ? 'bg-yellow-800' : themeOption === 'neon' ? 'bg-pink-400' : 'bg-teal-400'} rounded`}></div>
              </div>
              <h4 className="font-gaming font-medium text-fg mb-1 capitalize">{themeOption}</h4>
            </div>
          ))}
        </div>
      </Card>

      {/* Piece Set */}
      <Card className="p-6">
        <div className="flex items-center space-x-3 mb-6">
          <Gamepad2 size={24} className="text-accent-primary" />
          <h2 className="text-2xl font-gaming font-bold text-fg">Piece Set</h2>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {(['classic', 'modern', 'symbols'] as const).map((set) => (
            <div
              key={set}
              className={`rounded-lg border p-4 text-center cursor-pointer transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 ${
                preferences.pieceSet === set
                  ? 'border-accent-primary bg-accent-primary/10'
                  : 'border-border-subtle bg-surface-raised'
              }`}
              onClick={() => onUpdatePreference('pieceSet', set)}
            >
              <div className="flex items-center justify-center h-9 mb-2 text-fg">
                {set === 'classic' ? (
                  <Crown className="w-8 h-8" />
                ) : set === 'modern' ? (
                  <Circle className="w-8 h-8" />
                ) : (
                  <span className="text-3xl leading-none">♚</span>
                )}
              </div>
              <span className="font-gaming font-medium text-fg text-sm capitalize">{set}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Game Options */}
      <Card className="p-6">
        <div className="flex items-center space-x-3 mb-6">
          <Settings size={24} className="text-accent-primary" />
          <h2 className="text-2xl font-gaming font-bold text-fg">Game Options</h2>
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
      </Card>
    </div>
  );
}
