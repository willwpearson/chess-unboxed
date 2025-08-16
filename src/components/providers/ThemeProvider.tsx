'use client';

import React, { createContext, useContext, useEffect } from 'react';

interface ThemeContextType {
  theme: 'dark';
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = 'dark' as const;

  useEffect(() => {
    // Apply dark theme to document root
    const root = document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add('dark');
    
    // Set CSS custom properties for gaming theme (dark mode only)
    root.style.setProperty('--gaming-bg-primary', '#0f0f1a');
    root.style.setProperty('--gaming-bg-secondary', '#1a1a2e');
    root.style.setProperty('--gaming-bg-tertiary', '#16213e');
    root.style.setProperty('--gaming-accent-primary', '#7c3aed');
    root.style.setProperty('--gaming-accent-secondary', '#06d6a0');
    root.style.setProperty('--gaming-accent-danger', '#ef4444');
    root.style.setProperty('--gaming-text-primary', '#ffffff');
    root.style.setProperty('--gaming-text-secondary', '#a1a1aa');
    root.style.setProperty('--gaming-border', '#374151');
  }, []);

  return (
    <ThemeContext.Provider value={{ theme }}>
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