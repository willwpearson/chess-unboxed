'use client';

import React, { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { StatsPanel } from '@/components/stats/StatsPanel';

export default function StatsPage() {
  const [isLoading, setIsLoading] = useState(false);

  const handleRefresh = async () => {
    setIsLoading(true);
    
    try {
      // Simulate refresh delay
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.error('Error refreshing stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        <StatsPanel
          onRefresh={handleRefresh}
          isLoading={isLoading}
        />
      </main>
      <Footer />
    </>
  );
}
