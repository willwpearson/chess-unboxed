'use client';

import React from 'react';
import { Mail, Smartphone, Users, Trophy, Gamepad2, Calendar, Bell, CheckCircle } from 'lucide-react';
import { UserPreferences } from '@/types/game';
import { Card } from '@/components/ui/Card';

interface NotificationSettingsProps {
  preferences: UserPreferences;
  onToggleNestedPreference: <T extends keyof UserPreferences>(
    category: T,
    key: keyof UserPreferences[T],
    value: boolean
  ) => void;
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

export function NotificationSettings({ preferences, onToggleNestedPreference }: NotificationSettingsProps) {
  return (
    <div className="space-y-6">
      {/* Email Notifications */}
      <Card className="p-6">
        <div className="flex items-center space-x-3 mb-6">
          <Mail size={24} className="text-accent-primary" />
          <h2 className="text-2xl font-gaming font-bold text-fg">Email Notifications</h2>
        </div>

        <div className="space-y-4">
          <ToggleSwitch
            checked={preferences.emailNotifications.gameInvites}
            onChange={(value) => onToggleNestedPreference('emailNotifications', 'gameInvites', value)}
            label="Game Invitations"
            description="Get notified when someone invites you to play"
            icon={<Mail size={20} />}
          />

          <ToggleSwitch
            checked={preferences.emailNotifications.friendRequests}
            onChange={(value) => onToggleNestedPreference('emailNotifications', 'friendRequests', value)}
            label="Friend Requests"
            description="Get notified about new friend requests"
            icon={<Users size={20} />}
          />

          <ToggleSwitch
            checked={preferences.emailNotifications.tournaments}
            onChange={(value) => onToggleNestedPreference('emailNotifications', 'tournaments', value)}
            label="Tournament Updates"
            description="Get notified about tournament events and results"
            icon={<Trophy size={20} />}
          />

          <ToggleSwitch
            checked={preferences.emailNotifications.dailyPuzzles}
            onChange={(value) => onToggleNestedPreference('emailNotifications', 'dailyPuzzles', value)}
            label="Daily Puzzles"
            description="Get daily chess puzzle reminders"
            icon={<Gamepad2 size={20} />}
          />

          <ToggleSwitch
            checked={preferences.emailNotifications.weeklyDigest}
            onChange={(value) => onToggleNestedPreference('emailNotifications', 'weeklyDigest', value)}
            label="Weekly Digest"
            description="Get a weekly summary of your chess activity"
            icon={<Calendar size={20} />}
          />
        </div>
      </Card>

      {/* Push Notifications */}
      <Card className="p-6">
        <div className="flex items-center space-x-3 mb-6">
          <Smartphone size={24} className="text-accent-primary" />
          <h2 className="text-2xl font-gaming font-bold text-fg">Push Notifications</h2>
        </div>

        <div className="space-y-4">
          <ToggleSwitch
            checked={preferences.pushNotifications.moves}
            onChange={(value) => onToggleNestedPreference('pushNotifications', 'moves', value)}
            label="Opponent Moves"
            description="Get notified when your opponent makes a move"
            icon={<Bell size={20} />}
          />

          <ToggleSwitch
            checked={preferences.pushNotifications.gameStart}
            onChange={(value) => onToggleNestedPreference('pushNotifications', 'gameStart', value)}
            label="Game Started"
            description="Get notified when a game begins"
            icon={<Gamepad2 size={20} />}
          />

          <ToggleSwitch
            checked={preferences.pushNotifications.gameEnd}
            onChange={(value) => onToggleNestedPreference('pushNotifications', 'gameEnd', value)}
            label="Game Ended"
            description="Get notified when a game ends"
            icon={<CheckCircle size={20} />}
          />

          <ToggleSwitch
            checked={preferences.pushNotifications.friendActivity}
            onChange={(value) => onToggleNestedPreference('pushNotifications', 'friendActivity', value)}
            label="Friend Activity"
            description="Get notified about your friends' activity"
            icon={<Users size={20} />}
          />
        </div>
      </Card>
    </div>
  );
}
