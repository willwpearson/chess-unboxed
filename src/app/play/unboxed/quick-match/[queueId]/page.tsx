'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/Loading';
import { ArrowLeft } from 'lucide-react';

interface QueueStatus {
  status: 'waiting' | 'matched' | 'cancelled' | 'expired';
  matchedGameId: string | null;
  expiresAt: string;
}

export default function QuickMatchWaitingPage() {
  const router = useRouter();
  const params = useParams<{ queueId: string }>();
  const { isAuthenticated, isLoading } = useAuth();

  const [status, setStatus] = useState<QueueStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

  const redirectedRef = useRef(false);

  const goToGame = useCallback(
    (gameId: string) => {
      if (redirectedRef.current) return;
      redirectedRef.current = true;
      router.push(`/game/${gameId}`);
    },
    [router]
  );

  const fetchStatus = useCallback(async () => {
    const response = await fetch(`/api/matchmaking/status?queueId=${params.queueId}`, { credentials: 'include' });
    const body = await response.json();
    if (!body.success) {
      setError(body.error || 'Queue entry not found');
      return null;
    }
    setStatus(body.data as QueueStatus);
    return body.data as QueueStatus;
  }, [params.queueId]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  // Same Realtime + 5s poll fallback pattern as the private-lobby waiting
  // room: Realtime Postgres Changes needs a real Postgres WAL and doesn't
  // fire against the dev-mode devDb mock, so the poll is what actually
  // advances dev-mode users.
  useEffect(() => {
    if (!isAuthenticated || !params.queueId) return;

    fetchStatus().then((row) => {
      if (row?.status === 'matched' && row.matchedGameId) goToGame(row.matchedGameId);
    });

    const channel =
      typeof supabase.channel === 'function'
        ? supabase
            .channel(`matchmaking:${params.queueId}`)
            .on(
              'postgres_changes',
              { event: 'UPDATE', schema: 'public', table: 'matchmaking_queue', filter: `id=eq.${params.queueId}` },
              (payload: { new: { status: string; matched_game_id: string | null; expires_at: string } }) => {
                setStatus({
                  status: payload.new.status as QueueStatus['status'],
                  matchedGameId: payload.new.matched_game_id,
                  expiresAt: payload.new.expires_at,
                });
                if (payload.new.status === 'matched' && payload.new.matched_game_id) {
                  goToGame(payload.new.matched_game_id);
                }
              }
            )
            .subscribe()
        : null;

    const pollInterval = setInterval(async () => {
      const row = await fetchStatus();
      if (row?.status === 'matched' && row.matchedGameId) goToGame(row.matchedGameId);
    }, 5000);

    return () => {
      if (channel) supabase.removeChannel(channel);
      clearInterval(pollInterval);
    };
  }, [isAuthenticated, params.queueId, fetchStatus, goToGame]);

  const handleCancel = async () => {
    setIsCancelling(true);
    try {
      const response = await fetch('/api/matchmaking/leave', { method: 'POST', credentials: 'include' });
      const body = await response.json();
      if (!body.success && body.matchedGameId) {
        goToGame(body.matchedGameId);
        return;
      }
      router.push('/play/unboxed/quick-match');
    } catch (err) {
      console.error('Failed to cancel matchmaking search:', err);
      setIsCancelling(false);
    }
  };

  if (isLoading || (!status && !error)) {
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

  if (!isAuthenticated) return null;

  if (error || !status) {
    return (
      <>
        <Header />
        <main className="flex-1 min-h-screen flex items-center justify-center bg-surface-base">
          <Card className="p-8 text-center max-w-md">
            <p className="text-status-danger mb-4">{error || 'Queue entry not found'}</p>
            <Button onClick={() => router.push('/play/unboxed/quick-match')}>Back to Quick Match</Button>
          </Card>
        </main>
        <Footer />
      </>
    );
  }

  const isTerminal = status.status === 'cancelled' || status.status === 'expired';

  return (
    <>
      <Header />
      <main className="flex-1 min-h-screen bg-surface-base">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-md mx-auto">
            <div className="mb-6">
              <Button variant="secondary" onClick={() => router.push('/play/unboxed/quick-match')} className="flex items-center space-x-2">
                <ArrowLeft size={16} />
                <span>Back</span>
              </Button>
            </div>

            <Card className="p-8 text-center">
              {isTerminal ? (
                <>
                  <h2 className="text-2xl font-bold text-fg mb-4">
                    {status.status === 'expired' ? 'Search expired' : 'Search cancelled'}
                  </h2>
                  <Button onClick={() => router.push('/play/unboxed/quick-match')}>Search Again</Button>
                </>
              ) : (
                <>
                  <h2 className="text-xl font-bold text-fg mb-2">Finding an Opponent</h2>
                  <p className="text-sm text-fg-secondary mb-8">This usually only takes a moment.</p>

                  <div className="flex items-center justify-center space-x-3 mb-8 text-fg-secondary">
                    <LoadingSpinner size="sm" />
                    <span>Searching…</span>
                  </div>

                  <Button variant="danger" onClick={handleCancel} disabled={isCancelling}>
                    {isCancelling ? 'Cancelling…' : 'Cancel Search'}
                  </Button>
                </>
              )}
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
