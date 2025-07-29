'use client';

import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useUserStore } from '@/store/userStore';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
});

export function Providers({ children }: { children: React.ReactNode }) {
  // Initialize user on app start
  React.useEffect(() => {
    useUserStore.getState().loadUserFromStorage();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
