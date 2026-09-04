'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { useAuth } from '@/hooks/useAuth';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/Loading';
import { Users, Swords, Zap, Clock, Hourglass, Crown, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { TIME_CONTROL_PRESETS } from '@/lib/timeControls';

// UI shortcuts for creating a lobby, sourced from the same fixed presets
// Phase 3's matchmaking pool uses (src/lib/timeControls.ts), plus an
// 'Untimed' option that only makes sense for a private lobby (matchmaking
// has no untimed pool).
const TIME_CONTROLS: {
  key: 'bullet' | 'blitz' | 'rapid' | 'classical' | null;
  label: string;
  description: string;
  icon: any;
  initialTimeSec?: number;
  incrementSec?: number;
}[] = [
  { key: 'bullet', label: TIME_CONTROL_PRESETS.bullet.label, description: '1 min', icon: Zap, initialTimeSec: TIME_CONTROL_PRESETS.bullet.initialTimeSec, incrementSec: TIME_CONTROL_PRESETS.bullet.incrementSec },
  { key: 'blitz', label: TIME_CONTROL_PRESETS.blitz.label, description: '5 min', icon: Swords, initialTimeSec: TIME_CONTROL_PRESETS.blitz.initialTimeSec, incrementSec: TIME_CONTROL_PRESETS.blitz.incrementSec },
  { key: 'rapid', label: TIME_CONTROL_PRESETS.rapid.label, description: '10 min', icon: Clock, initialTimeSec: TIME_CONTROL_PRESETS.rapid.initialTimeSec, incrementSec: TIME_CONTROL_PRESETS.rapid.incrementSec },
  { key: 'classical', label: TIME_CONTROL_PRESETS.classical.label, description: '30 min', icon: Crown, initialTimeSec: TIME_CONTROL_PRESETS.classical.initialTimeSec, incrementSec: TIME_CONTROL_PRESETS.classical.incrementSec },
  { key: null, label: 'Untimed', description: 'No clock', icon: Hourglass },
];

export default function PrivateLobbyHubPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, isLoading } = useAuth();

  const [selectedTimeControl, setSelectedTimeControl] = useState(TIME_CONTROLS[1]);
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const [code, setCode] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    const prefill = searchParams.get('code');
    if (prefill) setCode(prefill.toUpperCase().slice(0, 6));
  }, [searchParams]);

  const handleCreateLobby = async () => {
    setIsCreating(true);
    setCreateError(null);
    try {
      const response = await fetch('/api/lobbies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          timeControl: selectedTimeControl.key,
          initialTimeSec: selectedTimeControl.initialTimeSec,
          incrementSec: selectedTimeControl.incrementSec,
          colorPreference: 'random',
        }),
      });
      const body = await response.json();
      if (!body.success) {
        setCreateError(body.error || 'Failed to create lobby');
        return;
      }
      router.push(`/play/unboxed/private/${body.data.lobby.id}`);
    } catch (error) {
      console.error('Failed to create lobby:', error);
      setCreateError('Failed to create lobby. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length !== 6) return;
    setIsJoining(true);
    setJoinError(null);
    try {
      const response = await fetch('/api/lobbies/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ code }),
      });
      const body = await response.json();
      if (!body.success) {
        setJoinError(body.error || 'Failed to join lobby');
        return;
      }
      router.push(`/game/${body.data.gameId}`);
    } catch (error) {
      console.error('Failed to join lobby:', error);
      setJoinError('Failed to join lobby. Please try again.');
    } finally {
      setIsJoining(false);
    }
  };

  if (isLoading) {
    return (
      <>
        <Header />
        <main className="flex-1 min-h-screen flex items-center justify-center bg-surface-base">
          <LoadingSpinner size="lg" />
        </main>
        <Footer />
      </>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect
  }

  return (
    <>
      <Header />
      <main className="flex-1 min-h-screen bg-surface-base">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="mb-8">
              <Button variant="secondary" onClick={() => router.push('/dashboard')} className="flex items-center space-x-2">
                <ArrowLeft size={16} />
                <span>Back to Dashboard</span>
              </Button>
            </div>

            <Card className="p-4 text-center mb-8 bg-gradient-to-br from-blue-500/20 to-cyan-600/20">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-r from-blue-500 to-cyan-600 text-white mb-6">
                <Users size={40} />
              </div>
              <h2 className="text-3xl font-bold text-fg">Play with a Friend</h2>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Create a lobby */}
              <Card className="p-6">
                <h3 className="text-xl font-bold text-fg mb-4">Create a Lobby</h3>
                <p className="text-sm text-fg-secondary mb-6">Pick a time control, then share the invite code with a friend.</p>

                <div className="grid grid-cols-2 gap-3 mb-6">
                  {TIME_CONTROLS.map((tc) => {
                    const Icon = tc.icon;
                    const isSelected = selectedTimeControl.label === tc.label;
                    return (
                      <button key={tc.label} onClick={() => setSelectedTimeControl(tc)} type="button">
                        <Card
                          interactive
                          className={`p-4 text-center ${isSelected ? 'ring-2 ring-accent-primary' : ''}`}
                        >
                          <Icon size={24} className="mx-auto mb-2 text-accent-primary" />
                          <div className="font-semibold text-fg text-sm">{tc.label}</div>
                          <div className="text-xs text-fg-secondary">{tc.description}</div>
                        </Card>
                      </button>
                    );
                  })}
                </div>

                {createError && <p className="text-sm text-status-danger mb-4">{createError}</p>}

                <Button onClick={handleCreateLobby} disabled={isCreating} className="w-full" size="lg">
                  {isCreating ? 'Creating…' : 'Create Lobby'}
                </Button>
              </Card>

              {/* Join a lobby */}
              <Card className="p-6">
                <h3 className="text-xl font-bold text-fg mb-4">Join with a Code</h3>
                <p className="text-sm text-fg-secondary mb-6">Enter the 6-character invite code your friend shared with you.</p>

                <form onSubmit={handleJoin} className="space-y-4">
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase().slice(0, 6))}
                    maxLength={6}
                    placeholder="ABC123"
                    className="w-full px-3 py-3 text-center text-2xl tracking-[0.3em] font-mono border border-border-subtle rounded-md bg-surface-sunken text-fg placeholder:text-fg-muted focus:outline-none focus:ring-2 focus:ring-accent-primary"
                  />

                  {joinError && <p className="text-sm text-status-danger">{joinError}</p>}

                  <Button type="submit" disabled={isJoining || code.length !== 6} className="w-full" size="lg">
                    {isJoining ? 'Joining…' : 'Join Game'}
                  </Button>
                </form>
              </Card>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
