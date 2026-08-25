'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/components/providers/ThemeProvider';
import { AuthModal } from '@/components/auth/AuthModal';
import { Button } from '@/components/ui/Button';
import { IconButton } from '@/components/ui/IconButton';
import { Settings, Crown, LogOut, User, LayoutDashboard, Sun, Moon } from 'lucide-react';

export function Header() {
  const { user, isAuthenticated, logout } = useAuth();
  const { resolvedTheme, toggleTheme } = useTheme();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  const handleAuthClick = (mode: 'login' | 'register') => {
    setAuthMode(mode);
    setShowAuthModal(true);
  };

  const handleLogout = async () => {
    await logout();
  };

  return (
    <header className="bg-surface-base border-b border-border-subtle">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center justify-center space-x-3">
            <Crown size={32} className="text-accent-primary" />
            <span className="text-xl font-gaming font-bold text-fg">
              Chess Unboxed
            </span>
          </Link>

          <nav className="hidden md:flex items-center space-x-6 lg:space-x-8">
            {isAuthenticated && (
              <>
                <Link
                  href="/dashboard"
                  className="flex items-center space-x-1 lg:space-x-2 text-fg-secondary hover:text-fg transition-colors duration-300"
                >
                  <LayoutDashboard size={18} />
                  <span className="font-medium text-sm lg:text-base">Dashboard</span>
                </Link>
                <Link
                  href="/settings"
                  className="flex items-center space-x-1 lg:space-x-2 text-fg-secondary hover:text-fg transition-colors duration-300"
                >
                  <Settings size={18} />
                  <span className="font-medium text-sm lg:text-base">Settings</span>
                </Link>
              </>
            )}
          </nav>

          <div className="flex items-center space-x-2">
            <IconButton
              variant="ghost"
              size="md"
              onClick={toggleTheme}
              aria-label={resolvedTheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {resolvedTheme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </IconButton>

            {/* Authentication */}
            {isAuthenticated && user ? (
              <div className="flex items-center space-x-2">
                <Link href="/profile">
                  <div className="hidden sm:flex items-center space-x-3 px-3 lg:px-4 py-2 rounded-lg transition-colors duration-300 hover:bg-surface-raised cursor-pointer bg-surface-hover">
                    <div className="flex flex-col">
                      <div className="text-sm font-medium text-fg">
                        {user.display_name || user.username}
                      </div>
                      <div className="text-xs text-fg-secondary">
                        Rating: {user.current_rating}
                      </div>
                    </div>
                  </div>
                </Link>
                <IconButton
                  variant="ghost"
                  size="md"
                  onClick={handleLogout}
                  aria-label="Logout"
                >
                  <LogOut size={18} />
                </IconButton>
              </div>
            ) : (
              <Link href="/login">
                <Button variant="secondary" className="flex items-center gap-2">
                  <User size={18} />
                  <span className="text-sm">Log In</span>
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        defaultMode={authMode}
      />
    </header>
  );
}
