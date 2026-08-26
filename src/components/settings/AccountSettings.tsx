'use client';

import React, { useState } from 'react';
import { User, Key, Trash2, AlertTriangle } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';

interface AccountSettingsProps {
  isLoading: boolean;
  onNotification: (notification: { type: 'success' | 'error', message: string }) => void;
}

const inputClasses = (hasError?: boolean) =>
  `w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-primary transition-all bg-surface-sunken border text-fg ${
    hasError ? 'border-accent-danger' : 'border-border-subtle'
  }`;

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
      <Card className="p-6">
        <div className="flex items-center space-x-3 mb-6">
          <User size={36} className="text-accent-primary" />
          <h2 className="text-2xl font-gaming font-bold text-fg">Account Information</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-gaming font-medium text-fg mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={user?.email || ''}
              className={inputClasses()}
              readOnly
            />
            <p className="text-xs text-fg-muted mt-1">
              Email changes require verification
            </p>
          </div>

          <div>
            <label className="block text-sm font-gaming font-medium text-fg mb-2">
              Username
            </label>
            <input
              type="text"
              value={user?.username || ''}
              className={inputClasses()}
              readOnly
            />
            <p className="text-xs text-fg-muted mt-1">
              Username changes coming soon
            </p>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-border-subtle">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-gaming font-medium text-fg">Password</h3>
              <p className="text-sm text-fg-muted">Change your account password</p>
            </div>
            <Button variant="secondary" onClick={() => setShowPasswordDialog(true)}>
              <Key size={16} className="mr-2" />
              Change Password
            </Button>
          </div>
        </div>
      </Card>

      {/* Danger Zone */}
      <Card className="p-6 border-accent-danger">
        <div className="flex items-center space-x-3 mb-6">
          <AlertTriangle size={24} className="text-accent-danger" />
          <h2 className="text-2xl font-gaming font-bold text-accent-danger">Danger Zone</h2>
        </div>

        <div className="flex justify-between items-center">
          <div>
            <h3 className="font-gaming font-medium text-fg">Delete Account</h3>
            <p className="text-sm text-fg-muted">
              Permanently delete your account and all data. This action cannot be undone.
            </p>
          </div>
          <Button variant="danger" onClick={() => setShowDeleteDialog(true)}>
            <Trash2 size={16} className="mr-2" />
            Delete Account
          </Button>
        </div>
      </Card>

      {/* Password Change Modal */}
      {showPasswordDialog && (
        <Modal isOpen={showPasswordDialog} onClose={() => setShowPasswordDialog(false)} title="Change Password">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-fg mb-2">
                Current Password
              </label>
              <input
                type="password"
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                className={inputClasses(!!passwordErrors.currentPassword)}
              />
              {passwordErrors.currentPassword && (
                <p className="text-sm text-accent-danger mt-1">{passwordErrors.currentPassword}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-fg mb-2">
                New Password
              </label>
              <input
                type="password"
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                className={inputClasses(!!passwordErrors.newPassword)}
              />
              {passwordErrors.newPassword && (
                <p className="text-sm text-accent-danger mt-1">{passwordErrors.newPassword}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-fg mb-2">
                Confirm New Password
              </label>
              <input
                type="password"
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                className={inputClasses(!!passwordErrors.confirmPassword)}
              />
              {passwordErrors.confirmPassword && (
                <p className="text-sm text-accent-danger mt-1">{passwordErrors.confirmPassword}</p>
              )}
            </div>

            <div className="flex justify-end space-x-4 mt-6">
              <Button
                variant="secondary"
                onClick={() => {
                  setShowPasswordDialog(false);
                  setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                  setPasswordErrors({});
                }}
              >
                Cancel
              </Button>
              <Button onClick={handlePasswordChange} disabled={saving}>
                {saving ? 'Changing...' : 'Change Password'}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Account Modal */}
      {showDeleteDialog && (
        <Modal isOpen={showDeleteDialog} onClose={() => setShowDeleteDialog(false)} title="Delete Account">
          <div className="space-y-4">
            <div className="flex items-center space-x-3 text-accent-danger mb-4">
              <AlertTriangle size={24} />
              <h3 className="font-gaming font-bold text-lg">Are you absolutely sure?</h3>
            </div>

            <p className="text-fg">
              This action <strong>cannot be undone</strong>. This will permanently delete your account
              and remove all of your data from our servers, including:
            </p>

            <ul className="list-disc list-inside text-fg-secondary space-y-1">
              <li>Your profile and account information</li>
              <li>All game history and statistics</li>
              <li>Friend connections and messages</li>
              <li>Tournament participation records</li>
              <li>Any premium features or subscriptions</li>
            </ul>

            <div className="border-t border-border-subtle pt-4 mt-6">
              <p className="text-sm text-fg-secondary mb-4">
                Please type <strong>DELETE</strong> to confirm:
              </p>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="Type DELETE to confirm"
                className={inputClasses(true)}
              />
            </div>

            <div className="flex justify-end space-x-4 mt-6">
              <Button
                variant="secondary"
                onClick={() => {
                  setShowDeleteDialog(false);
                  setDeleteConfirmText('');
                }}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={handleDeleteAccount}
                disabled={saving || deleteConfirmText !== 'DELETE'}
              >
                {saving ? 'Deleting...' : 'Delete Account'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
