'use client';

import React, { useState, useEffect } from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Leaderboard } from '@/components/leaderboard/Leaderboard';
import { api } from '@/lib/api';

export default function LeaderboardPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [leaderboardData, setLeaderboardData] = useState<{
    rating: any[];
    endless: any[];
  }>({ rating: [], endless: [] });

  const fetchLeaderboard = async () => {
    setIsLoading(true);
    
    try {
      const data = await api.getLeaderboard();
      setLeaderboardData(data);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    await fetchLeaderboard();
  };

  // Fetch data on component mount
  useEffect(() => {
    fetchLeaderboard();
  }, []);

  return (
    <>
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        <Leaderboard
          onRefresh={handleRefresh}
          isLoading={isLoading}
          data={leaderboardData}
        />
      </main>
      <Footer />
    </>
  );
}
