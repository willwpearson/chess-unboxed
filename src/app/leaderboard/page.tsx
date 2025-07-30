'use client';

import React, { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Leaderboard } from '@/components/leaderboard/Leaderboard';

export default function LeaderboardPage() {
  const [isLoading, setIsLoading] = useState(false);

  const handleRefresh = async () => {
    setIsLoading(true);
    
    try {
      // TODO: Fetch real leaderboard data from API
      // const response = await fetch('/api/leaderboard');
      // const data = await response.json();
      
      // For now, simulate refresh
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('Refreshed leaderboard data');
    } catch (error) {
      console.error('Error refreshing leaderboard:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        <Leaderboard
          onRefresh={handleRefresh}
          isLoading={isLoading}
        />
      </main>
      <Footer />
    </>
  );
}
