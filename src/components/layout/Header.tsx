'use client';

import React from 'react';
import Link from 'next/link';
import { useUserStore } from '@/store/userStore';

export function Header() {
  const user = useUserStore((state) => state.user);

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center space-x-2">
            <div className="text-2xl">♔</div>
            <span className="text-xl font-bold text-primary-600">Chess Optim Boo</span>
          </Link>

          <nav className="hidden md:flex items-center space-x-6">
            <Link href="/lobby" className="text-gray-600 hover:text-primary-600 transition-colors">
              Lobbies
            </Link>
            <Link href="/leaderboard" className="text-gray-600 hover:text-primary-600 transition-colors">
              Leaderboard
            </Link>
            <Link href="/settings" className="text-gray-600 hover:text-primary-600 transition-colors">
              Settings
            </Link>
          </nav>

          <div className="flex items-center space-x-4">
            {user && (
              <div className="flex items-center space-x-2">
                <div className="text-sm text-gray-600">
                  {user.name}
                </div>
                <div className="text-xs text-gray-500">
                  Rating: {user.stats.rating}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
