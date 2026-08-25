/**
 * ProfileEditor Component
 * Allows users to edit their profile settings including avatar upload
 */
'use client';

import React, { useState, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { 
  User, 
  Camera, 
  Save, 
  X, 
  MapPin, 
  Globe,
  Upload,
  AlertCircle,
  Check
} from 'lucide-react';

interface ProfileEditorProps {
  user: ReturnType<typeof useAuth>['user'];
  onSave?: (updatedUser: any) => void;
  onCancel?: () => void;
  className?: string;
}

interface ProfileFormData {
  username: string;
  display_name: string;
  bio: string;
  country: string;
  website: string;
  avatar_file?: File;
}

interface ValidationErrors {
  username?: string;
  display_name?: string;
  bio?: string;
  country?: string;
  website?: string;
  avatar?: string;
  general?: string;
}

// File upload validation
const AVATAR_MAX_SIZE = 5 * 1024 * 1024; // 5MB
const AVATAR_ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export function ProfileEditor({ user, onSave, onCancel, className = '' }: ProfileEditorProps) {
  const { refreshUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<ProfileFormData>({
    username: user?.username || '',
    display_name: user?.display_name || '',
    bio: user?.bio || '',
    country: user?.country || '',
    website: user?.website || '',
  });

  const [avatarPreview, setAvatarPreview] = useState<string | null>(user?.avatar_url || null);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {};

    // Username validation
    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    } else if (formData.username.length > 20) {
      newErrors.username = 'Username must be less than 20 characters';
    } else if (!/^[a-zA-Z0-9_-]+$/.test(formData.username)) {
      newErrors.username = 'Username can only contain letters, numbers, underscores, and hyphens';
    }

    // Display name validation
    if (!formData.display_name.trim()) {
      newErrors.display_name = 'Display name is required';
    } else if (formData.display_name.length < 2) {
      newErrors.display_name = 'Display name must be at least 2 characters';
    } else if (formData.display_name.length > 50) {
      newErrors.display_name = 'Display name must be less than 50 characters';
    }

    // Bio validation
    if (formData.bio.length > 500) {
      newErrors.bio = 'Bio must be less than 500 characters';
    }

    // Country validation
    if (formData.country.length > 100) {
      newErrors.country = 'Country must be less than 100 characters';
    }

    // Website validation
    if (formData.website && formData.website.length > 200) {
      newErrors.website = 'Website URL must be less than 200 characters';
    } else if (formData.website && !isValidUrl(formData.website)) {
      newErrors.website = 'Please enter a valid website URL';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isValidUrl = (string: string): boolean => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  };

  const validateAvatarFile = (file: File): string | null => {
    if (file.size > AVATAR_MAX_SIZE) {
      return 'Avatar file size must be less than 5MB';
    }

    if (!AVATAR_ALLOWED_TYPES.includes(file.type)) {
      return 'Avatar must be a JPEG, PNG, WebP, or GIF image';
    }

    return null;
  };

  const handleInputChange = (field: keyof Omit<ProfileFormData, 'avatar_file'>, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
    
    // Clear success message when editing
    if (saveSuccess) {
      setSaveSuccess(false);
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const validationError = validateAvatarFile(file);
    if (validationError) {
      setErrors(prev => ({ ...prev, avatar: validationError }));
      return;
    }

    // Clear avatar error
    setErrors(prev => ({ ...prev, avatar: undefined }));

    // Set the file in form data
    setFormData(prev => ({ ...prev, avatar_file: file }));

    // Create preview URL
    const reader = new FileReader();
    reader.onload = (e) => {
      setAvatarPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Clear success message
    if (saveSuccess) {
      setSaveSuccess(false);
    }
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      const formDataToSend = new FormData();
      
      // Add form fields
      formDataToSend.append('username', formData.username);
      formDataToSend.append('display_name', formData.display_name);
      formDataToSend.append('bio', formData.bio);
      formDataToSend.append('country', formData.country);
      formDataToSend.append('website', formData.website);
      
      // Add avatar file if selected
      if (formData.avatar_file) {
        formDataToSend.append('avatar', formData.avatar_file);
      }

      const response = await fetch('/api/users/profile', {
        method: 'PUT',
        credentials: 'include',
        body: formDataToSend,
      });

      const result = await response.json();

      if (!result.success) {
        setErrors({ general: result.error || 'Failed to update profile' });
        return;
      }

      // Success!
      setSaveSuccess(true);
      
      // Refresh user data in auth context
      await refreshUser();
      
      // Call onSave callback if provided
      if (onSave) {
        onSave(result.data?.user);
      }

      // Auto-hide success message after 3 seconds
      setTimeout(() => {
        setSaveSuccess(false);
      }, 3000);

    } catch (error) {
      console.error('Profile update error:', error);
      setErrors({ general: 'An unexpected error occurred. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    // Reset form to original values
    setFormData({
      username: user?.username || '',
      display_name: user?.display_name || '',
      bio: user?.bio || '',
      country: user?.country || '',
      website: user?.website || '',
    });
    setAvatarPreview(user?.avatar_url || null);
    setErrors({});
    setSaveSuccess(false);
    
    if (onCancel) {
      onCancel();
    }
  };

  if (!user) {
    return (
      <div className="gaming-card p-6 text-center">
        <p className="text-destructive">No user data available</p>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="gaming-card p-6">
        <div className="flex items-center space-x-3 mb-6">
          <User size={24} className="text-secondary" />
          <h2 className="text-2xl font-gaming font-bold text-primary-300">
            Edit Profile
          </h2>
        </div>

        {/* Success Message */}
        {saveSuccess && (
          <div className="mb-6 p-4 bg-background bg-opacity-10 border-2 border-secondary rounded-lg">
            <div className="flex items-center space-x-2 text-secondary">
              <Check size={20} />
              <span className="font-medium">Profile updated successfully!</span>
            </div>
          </div>
        )}

        {/* General Error */}
        {errors.general && (
          <div className="mb-6 p-4 bg-background bg-opacity-10 border-2 border-destructive rounded-lg">
            <div className="flex items-center space-x-2 text-destructive">
              <AlertCircle size={20} />
              <span>{errors.general}</span>
            </div>
          </div>
        )}

        {/* Avatar Section */}
        <div className="mb-6">
          <label className="block text-sm font-gaming font-semibold text-primary-300 mb-3">
            Profile Avatar
          </label>
          <div className="flex items-center space-x-4">
            <div 
              className="relative cursor-pointer group"
              onClick={handleAvatarClick}
            >
              <div className="w-24 h-24 rounded-full border-4 border-accent overflow-hidden bg-background flex items-center justify-center transition-all duration-300 group-hover:border-accent">
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt="Avatar preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User size={32} className="text-primary-400" />
                )}
                
                {/* Hover overlay */}
                <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <Camera size={20} className="text-white" />
                </div>
              </div>
            </div>
            
            <div>
              <button
                type="button"
                onClick={handleAvatarClick}
                className="gaming-button-secondary flex items-center space-x-2"
                disabled={isLoading}
              >
                <Upload size={16} />
                <span>Upload Avatar</span>
              </button>
              <p className="text-xs text-primary-400 mt-2">
                Max 5MB • JPEG, PNG, WebP, or GIF
              </p>
              {errors.avatar && (
                <p className="text-xs text-destructive mt-1">
                  {errors.avatar}
                </p>
              )}
            </div>
            
            <input
              ref={fileInputRef}
              type="file"
              accept={AVATAR_ALLOWED_TYPES.join(',')}
              onChange={handleAvatarChange}
              className="hidden"
            />
          </div>
        </div>

        {/* Form Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Username */}
          <div>
            <label htmlFor="username" className="block text-sm font-gaming font-semibold text-primary-300 mb-2">
              Username *
            </label>
            <input
              id="username"
              type="text"
              value={formData.username}
              onChange={(e) => handleInputChange('username', e.target.value)}
              className={`w-full px-4 py-3 bg-background border-2 rounded-lg text-primary-300 placeholder-primary-400 focus:outline-none focus:border-accent transition-colors ${
                errors.username ? 'border-destructive' : 'border-border'
              }`}
              placeholder="Enter your username"
              disabled={isLoading}
            />
            {errors.username && (
              <p className="text-xs text-destructive mt-1">
                {errors.username}
              </p>
            )}
          </div>

          {/* Display Name */}
          <div>
            <label htmlFor="display_name" className="block text-sm font-gaming font-semibold text-primary-300 mb-2">
              Display Name *
            </label>
            <input
              id="display_name"
              type="text"
              value={formData.display_name}
              onChange={(e) => handleInputChange('display_name', e.target.value)}
              className={`w-full px-4 py-3 bg-background border-2 rounded-lg text-primary-300 placeholder-primary-400 focus:outline-none focus:border-accent transition-colors ${
                errors.display_name ? 'border-destructive' : 'border-border'
              }`}
              placeholder="Enter your display name"
              disabled={isLoading}
            />
            {errors.display_name && (
              <p className="text-xs text-destructive mt-1">
                {errors.display_name}
              </p>
            )}
          </div>

          {/* Country */}
          <div>
            <label htmlFor="country" className="block text-sm font-gaming font-semibold text-primary-300 mb-2">
              <MapPin size={16} className="inline mr-1" />
              Country
            </label>
            <input
              id="country"
              type="text"
              value={formData.country}
              onChange={(e) => handleInputChange('country', e.target.value)}
              className={`w-full px-4 py-3 bg-background border-2 rounded-lg text-primary-300 placeholder-primary-400 focus:outline-none focus:border-accent transition-colors ${
                errors.country ? 'border-destructive' : 'border-border'
              }`}
              placeholder="Enter your country"
              disabled={isLoading}
            />
            {errors.country && (
              <p className="text-xs text-destructive mt-1">
                {errors.country}
              </p>
            )}
          </div>

          {/* Website */}
          <div>
            <label htmlFor="website" className="block text-sm font-gaming font-semibold text-primary-300 mb-2">
              <Globe size={16} className="inline mr-1" />
              Website
            </label>
            <input
              id="website"
              type="url"
              value={formData.website}
              onChange={(e) => handleInputChange('website', e.target.value)}
              className={`w-full px-4 py-3 bg-background border-2 rounded-lg text-primary-300 placeholder-primary-400 focus:outline-none focus:border-accent transition-colors ${
                errors.website ? 'border-destructive' : 'border-border'
              }`}
              placeholder="https://your-website.com"
              disabled={isLoading}
            />
            {errors.website && (
              <p className="text-xs text-destructive mt-1">
                {errors.website}
              </p>
            )}
          </div>
        </div>

        {/* Bio */}
        <div className="mt-6">
          <label htmlFor="bio" className="block text-sm font-gaming font-semibold text-primary-300 mb-2">
            Bio
          </label>
          <textarea
            id="bio"
            value={formData.bio}
            onChange={(e) => handleInputChange('bio', e.target.value)}
            rows={4}
            className={`w-full px-4 py-3 bg-background border-2 rounded-lg text-primary-300 placeholder-primary-400 focus:outline-none focus:border-accent transition-colors resize-none ${
              errors.bio ? 'border-destructive' : 'border-border'
            }`}
            placeholder="Tell us about yourself... (optional)"
            disabled={isLoading}
          />
          <div className="flex justify-between items-center mt-1">
            {errors.bio ? (
              <p className="text-xs text-destructive">
                {errors.bio}
              </p>
            ) : (
              <div />
            )}
            <p className="text-xs text-primary-400">
              {formData.bio.length}/500
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-4 mt-8 pt-6 border-t border-border">
          <button
            type="button"
            onClick={handleCancel}
            className="gaming-button flex items-center space-x-2"
            disabled={isLoading}
          >
            <X size={16} />
            <span>Cancel</span>
          </button>
          
          <button
            type="button"
            onClick={handleSave}
            className="gaming-button-secondary flex items-center space-x-2"
            disabled={isLoading}
          >
            <Save size={16} />
            <span>{isLoading ? 'Saving...' : 'Save Changes'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}