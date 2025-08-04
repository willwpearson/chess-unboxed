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
      <SettingsPanel />
      <Footer />
    </>
  );
}
