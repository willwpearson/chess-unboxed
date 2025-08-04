'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function ClassicMultiplayerPage() {
  const router = useRouter();

  useEffect(() => {
    // Store the selected game mode and redirect to lobby
    localStorage.setItem('selectedGameMode', 'classic');
    router.replace('/lobby');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Redirecting to Multiplayer Lobby...</p>
      </div>
    </div>
  );
}