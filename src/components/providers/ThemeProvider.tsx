'use client';

import React, { createContext, useContext, useEffect } from 'react';
import { useUserStore } from '@/store/userStore';

interface ThemeContextType {
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { user, updatePreferences } = useUserStore();
  const theme = user?.preferences.theme || 'light';

  const setTheme = (newTheme: 'light' | 'dark') => {
    updatePreferences({ theme: newTheme });
  };

  useEffect(() => {
    // Apply theme to document root
    const root = document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    
    // Update CSS custom properties for gaming theme
    if (theme === 'dark') {
      root.style.setProperty('--gaming-bg-primary', '#0f0f1a');
      root.style.setProperty('--gaming-bg-secondary', '#1a1a2e');
      root.style.setProperty('--gaming-bg-tertiary', '#16213e');
      root.style.setProperty('--gaming-accent-primary', '#7c3aed');
      root.style.setProperty('--gaming-accent-secondary', '#06d6a0');
      root.style.setProperty('--gaming-accent-danger', '#ef4444');
      root.style.setProperty('--gaming-text-primary', '#ffffff');
      root.style.setProperty('--gaming-text-secondary', '#a1a1aa');
      root.style.setProperty('--gaming-border', '#374151');
    } else {
      root.style.setProperty('--gaming-bg-primary', '#ffffff');
      root.style.setProperty('--gaming-bg-secondary', '#f8fafc');
      root.style.setProperty('--gaming-bg-tertiary', '#e2e8f0');
      root.style.setProperty('--gaming-accent-primary', '#7c3aed');
      root.style.setProperty('--gaming-accent-secondary', '#059669');
      root.style.setProperty('--gaming-accent-danger', '#dc2626');
      root.style.setProperty('--gaming-text-primary', '#1f2937');
      root.style.setProperty('--gaming-text-secondary', '#6b7280');
      root.style.setProperty('--gaming-border', '#d1d5db');
    }
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}