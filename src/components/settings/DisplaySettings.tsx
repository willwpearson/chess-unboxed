'use client';

import React from 'react';
import { Sun, Moon, Languages } from 'lucide-react';
import { UserPreferences } from '@/types/game';
import { useTheme } from '@/components/providers/ThemeProvider';

interface DisplaySettingsProps {
  preferences: UserPreferences;
  onUpdatePreference: <K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) => void;
}

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

// Comprehensive timezone options
const timezoneOptions = [
  { value: Intl.DateTimeFormat().resolvedOptions().timeZone, label: `Auto-detect (${Intl.DateTimeFormat().resolvedOptions().timeZone})` },
  { value: 'UTC', label: 'UTC (Coordinated Universal Time)' },
  // Americas
  { value: 'America/New_York', label: 'Eastern Time (New York)' },
  { value: 'America/Chicago', label: 'Central Time (Chicago)' },
  { value: 'America/Denver', label: 'Mountain Time (Denver)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (Los Angeles)' },
  { value: 'America/Anchorage', label: 'Alaska Time (Anchorage)' },
  { value: 'Pacific/Honolulu', label: 'Hawaii Time (Honolulu)' },
  { value: 'America/Toronto', label: 'Toronto (EST/EDT)' },
  { value: 'America/Vancouver', label: 'Vancouver (PST/PDT)' },
  { value: 'America/Mexico_City', label: 'Mexico City' },
  { value: 'America/Sao_Paulo', label: 'São Paulo' },
  { value: 'America/Buenos_Aires', label: 'Buenos Aires' },
  // Europe
  { value: 'Europe/London', label: 'London (GMT/BST)' },
  { value: 'Europe/Paris', label: 'Paris (CET/CEST)' },
  { value: 'Europe/Berlin', label: 'Berlin (CET/CEST)' },
  { value: 'Europe/Rome', label: 'Rome (CET/CEST)' },
  { value: 'Europe/Madrid', label: 'Madrid (CET/CEST)' },
  { value: 'Europe/Amsterdam', label: 'Amsterdam (CET/CEST)' },
  { value: 'Europe/Stockholm', label: 'Stockholm (CET/CEST)' },
  { value: 'Europe/Moscow', label: 'Moscow (MSK)' },
  { value: 'Europe/Istanbul', label: 'Istanbul (TRT)' },
  // Asia
  { value: 'Asia/Tokyo', label: 'Tokyo (JST)' },
  { value: 'Asia/Seoul', label: 'Seoul (KST)' },
  { value: 'Asia/Shanghai', label: 'Shanghai (CST)' },
  { value: 'Asia/Hong_Kong', label: 'Hong Kong (HKT)' },
  { value: 'Asia/Singapore', label: 'Singapore (SGT)' },
  { value: 'Asia/Bangkok', label: 'Bangkok (ICT)' },
  { value: 'Asia/Dubai', label: 'Dubai (GST)' },
  { value: 'Asia/Kolkata', label: 'Mumbai/Delhi (IST)' },
  // Oceania
  { value: 'Australia/Sydney', label: 'Sydney (AEST/AEDT)' },
  { value: 'Australia/Melbourne', label: 'Melbourne (AEST/AEDT)' },
  { value: 'Australia/Perth', label: 'Perth (AWST)' },
  { value: 'Pacific/Auckland', label: 'Auckland (NZST/NZDT)' },
  // Africa
  { value: 'Africa/Cairo', label: 'Cairo (EET)' },
  { value: 'Africa/Johannesburg', label: 'Johannesburg (SAST)' },
  { value: 'Africa/Lagos', label: 'Lagos (WAT)' },
];

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
      className="w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-gaming-accent-primary transition-all"
      style={{ 
        background: 'var(--gaming-bg-tertiary)', 
        border: '2px solid var(--gaming-border)',
        color: 'var(--gaming-text-primary)'
      }}
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

export function DisplaySettings({ preferences, onUpdatePreference }: DisplaySettingsProps) {
  const { theme } = useTheme();

  return (
    <div className="space-y-6">
      {/* Theme Selection */}
      <div className="gaming-card p-6">
        <div className="flex items-center space-x-3 mb-6">
          {theme === 'light' ? 
            <Sun size={24} style={{ color: 'var(--gaming-accent-primary)' }} /> : 
            <Moon size={24} style={{ color: 'var(--gaming-accent-primary)' }} />
          }
          <h2 className="text-2xl font-gaming font-bold text-gaming-text-primary">App Theme</h2>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div
            className={`gaming-card cursor-pointer p-6 text-center transition-all ${
              preferences.theme === 'light'
                ? 'border-gaming-accent-primary bg-gaming-accent-primary/10'
                : 'hover:border-gaming-accent-primary/50'
            }`}
            onClick={() => onUpdatePreference('theme', 'light')}
          >
            <Sun size={32} className="mx-auto mb-3" style={{ color: 'var(--gaming-accent-secondary)' }} />
            <h3 className="font-gaming font-bold text-gaming-text-primary mb-2">Light Mode</h3>
            <p className="text-sm text-gaming-text-secondary">Clean and bright interface</p>
          </div>
          
          <div
            className={`gaming-card cursor-pointer p-6 text-center transition-all ${
              preferences.theme === 'dark'
                ? 'border-gaming-accent-primary bg-gaming-accent-primary/10'
                : 'hover:border-gaming-accent-primary/50'
            }`}
            onClick={() => onUpdatePreference('theme', 'dark')}
          >
            <Moon size={32} className="mx-auto mb-3" style={{ color: 'var(--gaming-accent-primary)' }} />
            <h3 className="font-gaming font-bold text-gaming-text-primary mb-2">Dark Mode</h3>
            <p className="text-sm text-gaming-text-secondary">Easy on the eyes, gaming aesthetic</p>
          </div>
        </div>
      </div>

      {/* Language and Region */}
      <div className="gaming-card p-6">
        <div className="flex items-center space-x-3 mb-6">
          <Languages size={24} style={{ color: 'var(--gaming-accent-primary)' }} />
          <h2 className="text-2xl font-gaming font-bold text-gaming-text-primary">Language & Region</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <SelectDropdown
            value={preferences.language}
            onChange={(value) => onUpdatePreference('language', value as any)}
            options={languageOptions}
            label="Language"
            description="Choose your preferred language"
          />
          
          <SelectDropdown
            value={preferences.dateFormat}
            onChange={(value) => onUpdatePreference('dateFormat', value as any)}
            options={[
              { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY (US)' },
              { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY (EU)' },
              { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD (ISO)' },
            ]}
            label="Date Format"
            description="Choose your preferred date format"
          />
        </div>

        <div className="mt-6">
          <SelectDropdown
            value={preferences.timezone}
            onChange={(value) => onUpdatePreference('timezone', value)}
            options={timezoneOptions}
            label="Timezone"
            description="Choose your timezone for scheduling"
          />
        </div>
      </div>
    </div>
  );
}