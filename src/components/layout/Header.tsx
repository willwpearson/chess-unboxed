'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/components/providers/ThemeProvider';
import { AuthModal } from '@/components/auth/AuthModal';
import { Moon, Sun, Settings, Trophy, Users, LogIn, LogOut, User, LayoutDashboard } from 'lucide-react';

export function Header() {
  const { user, isAuthenticated, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  const handleAuthClick = (mode: 'login' | 'register') => {
    setAuthMode(mode);
    setShowAuthModal(true);
  };

  const handleLogout = async () => {
    await logout();
  };

  return (
    <header style={{ 
      background: 'var(--gaming-bg-secondary)', 
      borderBottom: '2px solid var(--gaming-border)' 
    }}>
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center space-x-3">
            <div className="text-3xl">♔</div>
            <span className="text-xl font-gaming font-bold gaming-title">
              Chess Unboxed
            </span>
          </Link>

          <nav className="hidden md:flex items-center space-x-6 lg:space-x-8">
            {isAuthenticated && (
              <Link 
                href="/dashboard" 
                className="flex items-center space-x-1 lg:space-x-2 text-gaming-text-secondary hover:text-gaming-accent-primary transition-colors duration-300"
              >
                <LayoutDashboard size={18} />
                <span className="font-medium text-sm lg:text-base">Dashboard</span>
              </Link>
            )}
            <Link 
              href="/lobby" 
              className="flex items-center space-x-1 lg:space-x-2 text-gaming-text-secondary hover:text-gaming-accent-primary transition-colors duration-300"
            >
              <Users size={18} />
              <span className="font-medium text-sm lg:text-base">Lobbies</span>
            </Link>
            <Link 
              href="/leaderboard" 
              className="flex items-center space-x-1 lg:space-x-2 text-gaming-text-secondary hover:text-gaming-accent-primary transition-colors duration-300"
            >
              <Trophy size={18} />
              <span className="font-medium text-sm lg:text-base">Leaderboard</span>
            </Link>
            <Link 
              href="/settings" 
              className="flex items-center space-x-1 lg:space-x-2 text-gaming-text-secondary hover:text-gaming-accent-primary transition-colors duration-300"
            >
              <Settings size={18} />
              <span className="font-medium text-sm lg:text-base">Settings</span>
            </Link>
          </nav>

          <div className="flex items-center space-x-4">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-gaming-bg-tertiary transition-colors duration-300"
              style={{ color: 'var(--gaming-text-secondary)' }}
            >
              {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
            </button>

            {/* Authentication */}
            {isAuthenticated && user ? (
              <div className="flex items-center space-x-3">
                <Link href="/profile">
                  <div className="hidden sm:flex items-center space-x-3 px-3 lg:px-4 py-2 rounded-lg hover:bg-gaming-bg-tertiary transition-colors duration-300 cursor-pointer" style={{ background: 'var(--gaming-bg-tertiary)' }}>
                    <div className="flex flex-col">
                      <div className="text-sm font-medium" style={{ color: 'var(--gaming-text-primary)' }}>
                        {user.display_name || user.username}
                      </div>
                      <div className="text-xs" style={{ color: 'var(--gaming-text-secondary)' }}>
                        Rating: {user.current_rating}
                      </div>
                    </div>
                  </div>
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-1 p-2 rounded-lg hover:bg-gaming-bg-tertiary transition-colors duration-300"
                  style={{ color: 'var(--gaming-text-secondary)' }}
                >
                  <LogOut size={18} />
                  <span className="hidden md:inline text-sm">Logout</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleAuthClick('login')}
                  className="flex items-center space-x-1 px-3 py-2 rounded-lg hover:bg-gaming-bg-tertiary transition-colors duration-300"
                  style={{ color: 'var(--gaming-text-secondary)' }}
                >
                  <LogIn size={18} />
                  <span className="text-sm">Login</span>
                </button>
                <button
                  onClick={() => handleAuthClick('register')}
                  className="flex items-center space-x-1 px-3 py-2 rounded-lg transition-all duration-300"
                  style={{ 
                    background: 'var(--gaming-accent-primary)',
                    color: 'var(--gaming-text-primary)'
                  }}
                >
                  <User size={18} />
                  <span className="text-sm">Sign Up</span>
                </button>
              </div>
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
