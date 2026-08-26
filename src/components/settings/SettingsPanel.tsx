/**
 * Enhanced Settings Component
 * Comprehensive user preferences and settings management
 */
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { IconButton } from '@/components/ui/IconButton';
import { useAuth } from '@/hooks/useAuth';
import { UserPreferences } from '@/types/game';
import { AccountSettings } from './AccountSettings';
import { GameSettings } from './GameSettings';
import { NotificationSettings } from './NotificationSettings';
import { PrivacySettings } from './PrivacySettings';
import { 
  User, Save, Bell, Shield, Gamepad2,
  AlertTriangle, CheckCircle, X
} from 'lucide-react';

// Default preferences
const defaultPreferences: UserPreferences = {
  theme: 'dark',
  language: 'en',
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  dateFormat: 'MM/DD/YYYY',
  boardTheme: 'classic',
  pieceSet: 'classic',
  showCoordinates: true,
  showPossibleMoves: true,
  moveAnimationSpeed: 'normal',
  soundEnabled: true,
  autoQueen: true,
  emailNotifications: {
    gameInvites: true,
    friendRequests: true,
    tournaments: true,
    dailyPuzzles: false,
    weeklyDigest: true,
  },
  pushNotifications: {
    moves: true,
    gameStart: true,
    gameEnd: true,
    friendActivity: false,
  },
  profileVisibility: 'public',
  showOnlineStatus: true,
  allowFriendRequests: true,
  showGameHistory: true,
  showRatingHistory: true,
};

// Tab types
type SettingsTab = 'account' | 'game' | 'notifications' | 'privacy';

interface TabConfig {
  id: SettingsTab;
  label: string;
  icon: React.ReactNode;
  description: string;
}

const tabs: TabConfig[] = [
  {
    id: 'account',
    label: 'Account',
    icon: <User size={20} />,
    description: 'Account settings and security'
  },
  {
    id: 'game',
    label: 'Game',
    icon: <Gamepad2 size={20} />,
    description: 'Chess board, gameplay, and language preferences'
  },
  {
    id: 'notifications',
    label: 'Notifications',
    icon: <Bell size={20} />,
    description: 'Email and push notification settings'
  },
  {
    id: 'privacy',
    label: 'Privacy',
    icon: <Shield size={20} />,
    description: 'Profile visibility and privacy controls'
  },
];


export function SettingsPanel() {
  const { user, refreshUser } = useAuth();
  
  // State management
  const [activeTab, setActiveTab] = useState<SettingsTab>('account');
  const [preferences, setPreferences] = useState<UserPreferences>(defaultPreferences);
  const [originalPreferences, setOriginalPreferences] = useState<UserPreferences>(defaultPreferences);
  const [isLoading, setSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [notification, setNotification] = useState<{type: 'success' | 'error', message: string} | null>(null);

  // Initialize preferences from user data
  useEffect(() => {
    const loadPreferences = async () => {
      if (user) {
        try {
          setSaving(true);
          const response = await fetch('/api/users/preferences', {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
          });

          if (response.ok) {
            const data = await response.json();
            if (data.success && data.data?.preferences) {
              setPreferences(data.data.preferences);
              setOriginalPreferences(data.data.preferences);
            } else {
              setPreferences(defaultPreferences);
              setOriginalPreferences(defaultPreferences);
            }
          } else {
            // Use defaults if API fails
            setPreferences(defaultPreferences);
            setOriginalPreferences(defaultPreferences);
          }
        } catch (error) {
          console.error('Error loading preferences:', error);
          setPreferences(defaultPreferences);
          setOriginalPreferences(defaultPreferences);
          setNotification({ type: 'error', message: 'Failed to load preferences. Using defaults.' });
        } finally {
          setSaving(false);
        }
      }
    };

    loadPreferences();
  }, [user]);

  // Check for unsaved changes
  useEffect(() => {
    const hasChanges = JSON.stringify(preferences) !== JSON.stringify(originalPreferences);
    setHasUnsavedChanges(hasChanges);
  }, [preferences, originalPreferences]);


  // Save preferences
  const handleSave = useCallback(async () => {
    setSaving(true);
    
    try {
      const response = await fetch('/api/users/preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(preferences),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save preferences');
      }

      setOriginalPreferences({ ...preferences });
      setNotification({ type: 'success', message: 'Settings saved successfully!' });
    } catch (error) {
      console.error('Error saving preferences:', error);
      setNotification({ type: 'error', message: 'Failed to save settings. Please try again.' });
    } finally {
      setSaving(false);
    }
  }, [preferences]);

  // Reset to defaults
  const handleReset = useCallback(() => {
    setPreferences({ ...defaultPreferences });
  }, []);

  // Update preferences helper
  const updatePreference = useCallback(<K extends keyof UserPreferences>(
    key: K,
    value: UserPreferences[K]
  ) => {
    setPreferences(prev => ({ ...prev, [key]: value }));
  }, []);


  // Toggle helper for nested objects
  const toggleNestedPreference = useCallback(<T extends keyof UserPreferences>(
    category: T,
    key: keyof UserPreferences[T],
    value: boolean
  ) => {
    setPreferences(prev => ({
      ...prev,
      [category]: {
        ...prev[category] as object,
        [key]: value,
      },
    }));
  }, []);

  // Notification handler
  const handleNotification = (notif: { type: 'success' | 'error', message: string }) => {
    setNotification(notif);
  };


  const renderAccountTab = () => (
    <AccountSettings
      isLoading={isLoading}
      onNotification={handleNotification}
    />
  );

  const renderGameTab = () => (
    <GameSettings
      preferences={preferences}
      onUpdatePreference={updatePreference}
    />
  );

  const renderNotificationsTab = () => (
    <NotificationSettings
      preferences={preferences}
      onToggleNestedPreference={toggleNestedPreference}
    />
  );

  const renderPrivacyTab = () => (
    <PrivacySettings
      preferences={preferences}
      onUpdatePreference={updatePreference}
    />
  );


  // Main render
  return (
    <div className="min-h-screen bg-surface-base">
      <div className="container mx-auto px-4 py-8">
        <div className="w-full max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-gaming font-bold mb-2 bg-gradient-to-r from-accent-primary to-accent-secondary bg-clip-text text-transparent">Settings</h1>
              <p className="text-fg-secondary">
                Customize your chess experience and personalize your preferences
              </p>
            </div>

            <div className="flex items-center space-x-3">
              <Button variant="secondary" onClick={handleReset} disabled={isLoading}>
                Reset to Default
              </Button>

              {hasUnsavedChanges && (
                <Button onClick={handleSave} disabled={isLoading}>
                  {isLoading ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                      Saving...
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <Save size={16} className="mr-2" />
                      Save Changes
                    </div>
                  )}
                </Button>
              )}
            </div>
          </div>

          {/* Notification */}
          {notification && (
            <Card
              variant="flat"
              className={`p-4 mb-6 ${
                notification.type === 'success' ? 'border-accent-secondary' : 'border-accent-danger'
              }`}
            >
              <div className="flex items-center">
                {notification.type === 'success' ? (
                  <CheckCircle size={20} className="text-accent-secondary mr-3" />
                ) : (
                  <AlertTriangle size={20} className="text-accent-danger mr-3" />
                )}
                <span className="text-fg">{notification.message}</span>
                <IconButton
                  variant="ghost"
                  size="sm"
                  aria-label="Dismiss notification"
                  className="ml-auto"
                  onClick={() => setNotification(null)}
                >
                  <X size={16} />
                </IconButton>
              </div>
            </Card>
          )}

          <div className="flex flex-col lg:flex-row gap-8">
            {/* Tab Navigation */}
            <div className="lg:w-64 lg:flex-shrink-0">
              <Card className="p-4">
                <nav className="space-y-2">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors duration-200 cursor-pointer ${
                        activeTab === tab.id
                          ? 'bg-accent-primary text-accent-primary-foreground'
                          : 'text-fg-secondary hover:bg-surface-hover'
                      }`}
                    >
                      {tab.icon}
                      <div className="flex-1">
                        <div className="font-gaming font-medium">{tab.label}</div>
                        <div className="text-xs opacity-75">{tab.description}</div>
                      </div>
                    </button>
                  ))}
                </nav>
              </Card>
            </div>

            {/* Tab Content */}
            <div className="flex-1">
              {activeTab === 'account' && renderAccountTab()}
              {activeTab === 'game' && renderGameTab()}
              {activeTab === 'notifications' && renderNotificationsTab()}
              {activeTab === 'privacy' && renderPrivacyTab()}
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}