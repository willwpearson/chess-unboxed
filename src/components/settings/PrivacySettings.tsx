'use client';

import React from 'react';
import { Shield, Lock, Eye, Users, History, Trophy } from 'lucide-react';
import { UserPreferences } from '@/types/game';

interface PrivacySettingsProps {
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
  <div className="gaming-card p-6">
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

export function PrivacySettings({ preferences, onUpdatePreference }: PrivacySettingsProps) {
  return (
    <div className="space-y-6">
      {/* Profile Visibility */}
      <div className="gaming-card p-6">
        <div className="flex items-center space-x-3 mb-6">
          <Shield size={24} className="text-[var(--gaming-accent-primary)]" />
          <h2 className="text-2xl font-gaming font-bold text-gaming-text-primary">Profile Visibility</h2>
        </div>
        
        <SelectDropdown
          value={preferences.profileVisibility}
          onChange={(value) => onUpdatePreference('profileVisibility', value as any)}
          options={[
            { value: 'public', label: 'Public - Anyone can view your profile' },
            { value: 'friends', label: 'Friends Only - Only friends can view your profile' },
            { value: 'private', label: 'Private - Only you can view your profile' },
          ]}
          label="Who can view your profile?"
          description="Control who can see your profile information"
        />
      </div>

      {/* Privacy Options */}
      <div className="gaming-card p-6">
        <div className="flex items-center space-x-3 mb-6">
          <Lock size={24} className="text-[var(--gaming-accent-primary)]" />
          <h2 className="text-2xl font-gaming font-bold text-gaming-text-primary">Privacy Options</h2>
        </div>
        
        <div className="space-y-4">
          <ToggleSwitch
            checked={preferences.showOnlineStatus}
            onChange={(value) => onUpdatePreference('showOnlineStatus', value)}
            label="Show Online Status"
            description="Let others see when you're online"
            icon={<Eye size={20} />}
          />
          
          <ToggleSwitch
            checked={preferences.allowFriendRequests}
            onChange={(value) => onUpdatePreference('allowFriendRequests', value)}
            label="Allow Friend Requests"
            description="Let others send you friend requests"
            icon={<Users size={20} />}
          />
          
          <ToggleSwitch
            checked={preferences.showGameHistory}
            onChange={(value) => onUpdatePreference('showGameHistory', value)}
            label="Show Game History"
            description="Let others view your game history"
            icon={<History size={20} />}
          />
          
          <ToggleSwitch
            checked={preferences.showRatingHistory}
            onChange={(value) => onUpdatePreference('showRatingHistory', value)}
            label="Show Rating History"
            description="Let others view your rating progression"
            icon={<Trophy size={20} />}
          />
        </div>
      </div>
    </div>
  );
}