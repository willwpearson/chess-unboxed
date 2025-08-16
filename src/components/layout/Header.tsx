'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { AuthModal } from '@/components/auth/AuthModal';
import { Settings, Crown, LogIn, LogOut, User, LayoutDashboard } from 'lucide-react';

export function Header() {
  const { user, isAuthenticated, logout } = useAuth();
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
    <header className="bg-card border-b-2 border-b-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center justify-center space-x-3">
            <Crown size={32} className="text-secondary" />
            <span className="text-xl font-gaming font-bold gaming-title">
              Chess Unboxed
            </span>
          </Link>

          <nav className="hidden md:flex items-center space-x-6 lg:space-x-8">
            {isAuthenticated && (
              <>
                <Link 
                  href="/dashboard" 
                  className="flex items-center space-x-1 lg:space-x-2 text-secondary hover:text-accent transition-colors duration-300"
                >
                  <LayoutDashboard size={18} />
                  <span className="font-medium text-sm lg:text-base">Dashboard</span>
                </Link>
                <Link 
                  href="/settings" 
                  className="flex items-center space-x-1 lg:space-x-2 text-secondary hover:text-accent transition-colors duration-300"
                >
                  <Settings size={18} />
                  <span className="font-medium text-sm lg:text-base">Settings</span>
                </Link>
              </>
            )}
          </nav>

          <div className="flex items-center space-x-4">
            {/* Authentication */}
            {isAuthenticated && user ? (
              <div className="flex items-center space-x-3">
                <Link href="/profile">
                  <div className="hidden sm:flex items-center space-x-3 px-3 lg:px-4 py-2 rounded-lg transition-colors duration-300 hover:bg-secondary cursor-pointer bg-accent">
                    <div className="flex flex-col">
                      <div className="text-sm font-medium text-primary">
                        {user.display_name || user.username}
                      </div>
                      <div className="text-xs text-primary">
                        Rating: {user.current_rating}
                      </div>
                    </div>
                  </div>
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-1 p-2 rounded-lg transition-colors duration-300 hover:bg-accent text-accent hover:text-primary cursor-pointer"
                >
                  <LogOut size={18} />
                  <span className="hidden md:inline text-sm">Logout</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleAuthClick('register')}
                  className="flex items-center space-x-1 px-3 py-2 rounded-lg transition-all duration-300 bg-secondary hover:bg-secondary-900 text-primary-50 cursor-pointer shadow-lg"
                >
                  <User size={18} />
                  <span className="text-sm">Log In</span>
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
