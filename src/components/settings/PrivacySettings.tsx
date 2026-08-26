'use client';

import React from 'react';
import { Shield, Lock, Eye, Users, History, Trophy } from 'lucide-react';
import { UserPreferences } from '@/types/game';
import { Card } from '@/components/ui/Card';

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

export function PrivacySettings({ preferences, onUpdatePreference }: PrivacySettingsProps) {
  return (
    <div className="space-y-6">
      {/* Profile Visibility */}
      <Card className="p-6">
        <div className="flex items-center space-x-3 mb-6">
          <Shield size={24} className="text-accent-primary" />
          <h2 className="text-2xl font-gaming font-bold text-fg">Profile Visibility</h2>
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
      </Card>

      {/* Privacy Options */}
      <Card className="p-6">
        <div className="flex items-center space-x-3 mb-6">
          <Lock size={24} className="text-accent-primary" />
          <h2 className="text-2xl font-gaming font-bold text-fg">Privacy Options</h2>
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
      </Card>
    </div>
  );
}
