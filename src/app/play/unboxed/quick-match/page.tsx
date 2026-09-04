'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { useAuth } from '@/hooks/useAuth';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/Loading';
import { Trophy, Swords, Zap, Clock, Crown, ArrowLeft } from 'lucide-react';
import { TIME_CONTROL_PRESETS, TIME_CONTROL_BUCKETS, getDefaultPreset, type TimeControlBucket } from '@/lib/timeControls';

const TIME_CONTROL_ICONS: Record<TimeControlBucket, any> = {
  bullet: Zap,
  blitz: Swords,
  rapid: Clock,
  classical: Crown,
};

export default function QuickMatchHubPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading, isGuest } = useAuth();

  const [queueType, setQueueType] = useState<'ranked' | 'casual'>('casual');
  const [timeControl, setTimeControl] = useState<TimeControlBucket>('blitz');
  const [presetId, setPresetId] = useState<string>(getDefaultPreset('blitz').id);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Each bucket pools separately by exact preset — picking a new bucket
  // resets to its default preset rather than carrying over a stale id.
  const handleSelectBucket = (bucket: TimeControlBucket) => {
    setTimeControl(bucket);
    setPresetId(getDefaultPreset(bucket).id);
  };

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  // Guests can't select ranked at all — if a guest session lands here with
  // 'ranked' already selected (shouldn't happen since it starts as
  // 'casual'), fall back to casual rather than letting the request 403.
  useEffect(() => {
    if (isGuest && queueType === 'ranked') setQueueType('casual');
  }, [isGuest, queueType]);

  const handleFindMatch = async () => {
    setIsSearching(true);
    setError(null);
    try {
      const response = await fetch('/api/matchmaking/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ queueType, timeControl, presetId }),
      });
      const body = await response.json();
      if (!body.success) {
        setError(body.error || 'Failed to join matchmaking');
        setIsSearching(false);
        return;
      }
      if (body.data.status === 'matched') {
        router.push(`/game/${body.data.gameId}`);
      } else {
        router.push(`/play/unboxed/quick-match/${body.data.queueId}`);
      }
    } catch (err) {
      console.error('Failed to join matchmaking:', err);
      setError('Failed to join matchmaking. Please try again.');
      setIsSearching(false);
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
          <div className="max-w-3xl mx-auto">
            <div className="mb-8">
              <Button variant="secondary" onClick={() => router.push('/dashboard')} className="flex items-center space-x-2">
                <ArrowLeft size={16} />
                <span>Back to Dashboard</span>
              </Button>
            </div>

            <Card className="p-4 text-center mb-8 bg-gradient-to-br from-amber-500/20 to-orange-600/20">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-r from-amber-500 to-orange-600 text-white mb-6">
                <Trophy size={40} />
              </div>
              <h2 className="text-3xl font-bold text-fg">Quick Match</h2>
              <p className="text-sm text-fg-secondary mt-2">Get paired with an opponent automatically.</p>
            </Card>

            <Card className="p-6">
              <h3 className="text-xl font-bold text-fg mb-4">Match Type</h3>
              <div className="grid grid-cols-2 gap-3 mb-6">
                <button type="button" onClick={() => setQueueType('casual')}>
                  <Card interactive className={`p-4 text-center ${queueType === 'casual' ? 'ring-2 ring-accent-primary' : ''}`}>
                    <div className="font-semibold text-fg">Casual</div>
                    <div className="text-xs text-fg-secondary">Unrated — open to everyone</div>
                  </Card>
                </button>
                <button
                  type="button"
                  onClick={() => !isGuest && setQueueType('ranked')}
                  disabled={isGuest}
                  className={isGuest ? 'cursor-not-allowed opacity-50' : ''}
                >
                  <Card interactive={!isGuest} className={`p-4 text-center ${queueType === 'ranked' ? 'ring-2 ring-accent-primary' : ''}`}>
                    <div className="font-semibold text-fg">Ranked</div>
                    <div className="text-xs text-fg-secondary">
                      {isGuest ? 'Sign up to play ranked' : 'Affects your ELO rating'}
                    </div>
                  </Card>
                </button>
              </div>

              <h3 className="text-xl font-bold text-fg mb-4">Time Control</h3>
              <div className="grid grid-cols-2 gap-3 mb-6">
                {TIME_CONTROL_BUCKETS.map((bucket) => {
                  const Icon = TIME_CONTROL_ICONS[bucket];
                  const defaultPreset = getDefaultPreset(bucket);
                  const isSelected = timeControl === bucket;
                  return (
                    <button key={bucket} type="button" onClick={() => handleSelectBucket(bucket)}>
                      <Card interactive className={`p-4 text-center ${isSelected ? 'ring-2 ring-accent-primary' : ''}`}>
                        <Icon size={24} className="mx-auto mb-2 text-accent-primary" />
                        <div className="font-semibold text-fg text-sm capitalize">{bucket}</div>
                        <div className="text-xs text-fg-secondary">{Math.round(defaultPreset.initialTimeSec / 60)} min</div>
                      </Card>
                    </button>
                  );
                })}
              </div>

              <h3 className="text-sm font-semibold text-fg-secondary mb-3">Preset</h3>
              <div className="flex flex-wrap gap-2 mb-8">
                {TIME_CONTROL_PRESETS[timeControl].map((preset) => (
                  <button key={preset.id} type="button" onClick={() => setPresetId(preset.id)}>
                    <Card
                      interactive
                      className={`px-4 py-2 text-sm font-semibold ${presetId === preset.id ? 'ring-2 ring-accent-primary' : ''}`}
                    >
                      {preset.label}
                    </Card>
                  </button>
                ))}
              </div>

              {error && <p className="text-sm text-status-danger mb-4">{error}</p>}

              <Button onClick={handleFindMatch} disabled={isSearching} className="w-full" size="lg">
                {isSearching ? 'Searching…' : 'Find Match'}
              </Button>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
