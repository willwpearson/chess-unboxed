'use client';

import React, { useState } from 'react';
import { User, Key, Trash2, AlertTriangle } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { useAuth } from '@/hooks/useAuth';

interface AccountSettingsProps {
  isLoading: boolean;
  onNotification: (notification: { type: 'success' | 'error', message: string }) => void;
}

export function AccountSettings({ isLoading, onNotification }: AccountSettingsProps) {
  const { user } = useAuth();
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Password change state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({});
  
  // Delete account state
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  // Password change handler
  const handlePasswordChange = async () => {
    // Validate password
    const errors: Record<string, string> = {};
    
    if (!passwordData.currentPassword) {
      errors.currentPassword = 'Current password is required';
    }
    
    if (!passwordData.newPassword) {
      errors.newPassword = 'New password is required';
    } else if (passwordData.newPassword.length < 8) {
      errors.newPassword = 'Password must be at least 8 characters';
    }
    
    if (!passwordData.confirmPassword) {
      errors.confirmPassword = 'Please confirm your new password';
    } else if (passwordData.newPassword !== passwordData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }
    
    setPasswordErrors(errors);
    
    if (Object.keys(errors).length > 0) return;

    try {
      setSaving(true);
      
      const response = await fetch('/api/users/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to change password');
      }

      setShowPasswordDialog(false);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      onNotification({ type: 'success', message: 'Password changed successfully!' });
    } catch (error) {
      console.error('Error changing password:', error);
      onNotification({ 
        type: 'error', 
        message: error instanceof Error ? error.message : 'Failed to change password'
      });
    } finally {
      setSaving(false);
    }
  };

  // Delete account handler
  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') {
      onNotification({ type: 'error', message: 'Please type DELETE to confirm account deletion' });
      return;
    }

    try {
      setSaving(true);
      
      const response = await fetch('/api/users/delete-account', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete account');
      }

      // Redirect to home page after successful deletion
      window.location.href = '/';
    } catch (error) {
      console.error('Error deleting account:', error);
      onNotification({ 
        type: 'error', 
        message: error instanceof Error ? error.message : 'Failed to delete account'
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* User Information */}
      <div className="gaming-card p-6">
        <div className="flex items-center space-x-3 mb-6">
          <User size={36} className="text-secondary" />
          <h2 className="text-2xl font-gaming font-bold text-primary-300">Account Information</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-gaming font-medium text-primary-300 mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={user?.email || ''}
              className="w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent transition-all bg-primary text-foreground"
              readOnly
            />
            <p className="text-xs text-primary-400 mt-1">
              Email changes require verification
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-gaming font-medium text-primary-300 mb-2">
              Username
            </label>
            <input
              type="text"
              value={user?.username || ''}
              className="w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent transition-all bg-primary text-foreground"
              readOnly
            />
            <p className="text-xs text-primary-400 mt-1">
              Username changes coming soon
            </p>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-gaming-border">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-gaming font-medium text-primary-300">Password</h3>
              <p className="text-sm text-primary-400">Change your account password</p>
            </div>
            <button
              onClick={() => setShowPasswordDialog(true)}
              className="gaming-button-secondary flex items-center"
            >
              <Key size={16} className="mr-2" />
              Change Password
            </button>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="gaming-card p-6 border-destructive">
        <div className="flex items-center space-x-3 mb-6">
          <AlertTriangle size={24} className="text-destructive" />
          <h2 className="text-2xl font-gaming font-bold text-destructive">Danger Zone</h2>
        </div>
        
        <div className="flex justify-between items-center">
          <div>
            <h3 className="font-gaming font-medium text-primary-300">Delete Account</h3>
            <p className="text-sm text-primary-400">
              Permanently delete your account and all data. This action cannot be undone.
            </p>
          </div>
          <button
            onClick={() => setShowDeleteDialog(true)}
            className="bg-destructive hover:bg-red-700 text-white px-6 py-3 rounded-lg font-gaming font-medium transition-colors duration-300 flex items-center cursor-pointer"
          >
            <Trash2 size={16} className="mr-2" />
            Delete Account
          </button>
        </div>
      </div>

      {/* Password Change Modal */}
      {showPasswordDialog && (
        <Modal isOpen={showPasswordDialog} onClose={() => setShowPasswordDialog(false)} title="Change Password">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gaming-text-primary mb-2">
                Current Password
              </label>
              <input
                type="password"
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                className={`w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-gaming-accent-primary transition-all bg-[var(--gaming-bg-tertiary)] border-2 text-[var(--gaming-text-primary)] ${
                  passwordErrors.currentPassword ? 'border-gaming-accent-danger' : 'border-[var(--gaming-border)]'
                }`}
              />
              {passwordErrors.currentPassword && (
                <p className="text-sm text-gaming-accent-danger mt-1">{passwordErrors.currentPassword}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gaming-text-primary mb-2">
                New Password
              </label>
              <input
                type="password"
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                className={`w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-gaming-accent-primary transition-all bg-[var(--gaming-bg-tertiary)] border-2 text-[var(--gaming-text-primary)] ${
                  passwordErrors.newPassword ? 'border-gaming-accent-danger' : 'border-[var(--gaming-border)]'
                }`}
              />
              {passwordErrors.newPassword && (
                <p className="text-sm text-gaming-accent-danger mt-1">{passwordErrors.newPassword}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gaming-text-primary mb-2">
                Confirm New Password
              </label>
              <input
                type="password"
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                className={`w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-gaming-accent-primary transition-all bg-[var(--gaming-bg-tertiary)] border-2 text-[var(--gaming-text-primary)] ${
                  passwordErrors.confirmPassword ? 'border-gaming-accent-danger' : 'border-[var(--gaming-border)]'
                }`}
              />
              {passwordErrors.confirmPassword && (
                <p className="text-sm text-gaming-accent-danger mt-1">{passwordErrors.confirmPassword}</p>
              )}
            </div>

            <div className="flex justify-end space-x-4 mt-6">
              <button
                onClick={() => {
                  setShowPasswordDialog(false);
                  setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                  setPasswordErrors({});
                }}
                className="gaming-button-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handlePasswordChange}
                disabled={saving}
                className={`gaming-button ${saving ? 'opacity-50' : ''}`}
              >
                {saving ? 'Changing...' : 'Change Password'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Account Modal */}
      {showDeleteDialog && (
        <Modal isOpen={showDeleteDialog} onClose={() => setShowDeleteDialog(false)} title="Delete Account">
          <div className="space-y-4">
            <div className="flex items-center space-x-3 text-gaming-accent-danger mb-4">
              <AlertTriangle size={24} />
              <h3 className="font-gaming font-bold text-lg">Are you absolutely sure?</h3>
            </div>
            
            <p className="text-gaming-text-primary">
              This action <strong>cannot be undone</strong>. This will permanently delete your account 
              and remove all of your data from our servers, including:
            </p>
            
            <ul className="list-disc list-inside text-gaming-text-secondary space-y-1">
              <li>Your profile and account information</li>
              <li>All game history and statistics</li>
              <li>Friend connections and messages</li>
              <li>Tournament participation records</li>
              <li>Any premium features or subscriptions</li>
            </ul>

            <div className="border-t border-gaming-border pt-4 mt-6">
              <p className="text-sm text-gaming-text-secondary mb-4">
                Please type <strong>DELETE</strong> to confirm:
              </p>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="Type DELETE to confirm"
                className="w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-gaming-accent-danger transition-all border-2 border-[var(--gaming-accent-danger)] bg-[var(--gaming-bg-tertiary)] text-[var(--gaming-text-primary)]"
              />
            </div>

            <div className="flex justify-end space-x-4 mt-6">
              <button
                onClick={() => {
                  setShowDeleteDialog(false);
                  setDeleteConfirmText('');
                }}
                className="gaming-button-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={saving || deleteConfirmText !== 'DELETE'}
                className={`bg-gaming-accent-danger hover:bg-red-700 text-white px-6 py-3 rounded-lg font-gaming font-medium transition-colors ${
                  saving || deleteConfirmText !== 'DELETE' ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {saving ? 'Deleting...' : 'Delete Account'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}