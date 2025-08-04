'use client';

import React from 'react';
import Link from 'next/link';
import { useUserStore } from '@/store/userStore';
import { useTheme } from '@/components/providers/ThemeProvider';
import { Moon, Sun, Settings, Trophy, Users } from 'lucide-react';

export function Header() {
  const user = useUserStore((state) => state.user);
  const { theme, setTheme } = useTheme();

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
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

            {/* User Info */}
            {user && (
              <div className="hidden sm:flex items-center space-x-3 px-3 lg:px-4 py-2 rounded-lg" style={{ background: 'var(--gaming-bg-tertiary)' }}>
                <div className="flex flex-col">
                  <div className="text-sm font-medium" style={{ color: 'var(--gaming-text-primary)' }}>
                    {user.name}
                  </div>
                  <div className="text-xs" style={{ color: 'var(--gaming-text-secondary)' }}>
                    Rating: {user.stats.rating}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
