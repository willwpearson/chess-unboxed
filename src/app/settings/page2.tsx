'use client';

import React, { useEffect } from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { SettingsPanel } from '@/components/settings/SettingsPanel';
import { useUserStore } from '@/store/userStore';

export default function SettingsPage() {
  const { loadUserFromStorage } = useUserStore();

  useEffect(() => {
    loadUserFromStorage();
  }, [loadUserFromStorage]);

  return (
    <>
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        <SettingsPanel />
      </main>
      <Footer />
    </>
  );
}
