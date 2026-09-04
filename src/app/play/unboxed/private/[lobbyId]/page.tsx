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
import { Copy, Check, ArrowLeft } from 'lucide-react';

interface LobbyRow {
  id: string;
  host_id: string;
  invite_code: string;
  status: 'waiting' | 'active' | 'cancelled' | 'expired';
  game_id: string | null;
  time_control: string | null;
  initial_time_sec: number | null;
}

export default function PrivateLobbyWaitingRoomPage() {
  const router = useRouter();
  const params = useParams<{ lobbyId: string }>();
  const { isAuthenticated, isLoading, user } = useAuth();

  const [lobby, setLobby] = useState<LobbyRow | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
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

  const fetchLobby = useCallback(async () => {
    const response = await fetch(`/api/lobbies/${params.lobbyId}`, { credentials: 'include' });
    const body = await response.json();
    if (!body.success) {
      setError(body.error || 'Lobby not found');
      return null;
    }
    setLobby(body.data.lobby as LobbyRow);
    return body.data.lobby as LobbyRow;
  }, [params.lobbyId]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  // Initial fetch, Realtime subscription, and a 5s poll fallback (Realtime
  // Postgres Changes needs a real Postgres WAL — it doesn't fire against the
  // dev-mode devDb mock, so the poll is what actually gets dev-mode users
  // into their game).
  useEffect(() => {
    if (!isAuthenticated || !params.lobbyId) return;

    fetchLobby().then((row) => {
      if (row?.status === 'active' && row.game_id) goToGame(row.game_id);
    });

    // In dev mode `supabase` is the in-memory devDb mock (no `.channel()` —
    // no real Postgres WAL to subscribe to); the 5s poll below is what
    // actually gets dev-mode users into their game.
    const channel =
      typeof supabase.channel === 'function'
        ? supabase
            .channel(`lobby:${params.lobbyId}`)
            .on(
              'postgres_changes',
              { event: 'UPDATE', schema: 'public', table: 'lobbies', filter: `id=eq.${params.lobbyId}` },
              (payload: { new: LobbyRow }) => {
                setLobby(payload.new);
                if (payload.new.status === 'active' && payload.new.game_id) goToGame(payload.new.game_id);
              }
            )
            .subscribe()
        : null;

    const pollInterval = setInterval(async () => {
      const row = await fetchLobby();
      if (row?.status === 'active' && row.game_id) goToGame(row.game_id);
    }, 5000);

    return () => {
      if (channel) supabase.removeChannel(channel);
      clearInterval(pollInterval);
    };
  }, [isAuthenticated, params.lobbyId, fetchLobby, goToGame]);

  const handleCopy = async (text: string, kind: 'code' | 'link') => {
    try {
      await navigator.clipboard.writeText(text);
      if (kind === 'code') {
        setCopiedCode(true);
        setTimeout(() => setCopiedCode(false), 2000);
      } else {
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2000);
      }
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleCancel = async () => {
    setIsCancelling(true);
    try {
      await fetch(`/api/lobbies/${params.lobbyId}/cancel`, { method: 'POST', credentials: 'include' });
      router.push('/play/unboxed/private');
    } catch (err) {
      console.error('Failed to cancel lobby:', err);
      setIsCancelling(false);
    }
  };

  if (isLoading || (!lobby && !error)) {
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

  if (error || !lobby) {
    return (
      <>
        <Header />
        <main className="flex-1 min-h-screen flex items-center justify-center bg-surface-base">
          <Card className="p-8 text-center max-w-md">
            <p className="text-status-danger mb-4">{error || 'Lobby not found'}</p>
            <Button onClick={() => router.push('/play/unboxed/private')}>Back to Lobbies</Button>
          </Card>
        </main>
        <Footer />
      </>
    );
  }

  if (lobby.host_id !== user?.id) {
    return (
      <>
        <Header />
        <main className="flex-1 min-h-screen flex items-center justify-center bg-surface-base">
          <Card className="p-8 text-center max-w-md">
            <p className="text-status-danger mb-4">You are not the host of this lobby.</p>
            <Button onClick={() => router.push('/play/unboxed/private')}>Back to Lobbies</Button>
          </Card>
        </main>
        <Footer />
      </>
    );
  }

  const shareLink = typeof window !== 'undefined' ? `${window.location.origin}/play/unboxed/private?code=${lobby.invite_code}` : '';
  const isTerminal = lobby.status === 'cancelled' || lobby.status === 'expired';

  return (
    <>
      <Header />
      <main className="flex-1 min-h-screen bg-surface-base">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-md mx-auto">
            <div className="mb-6">
              <Button variant="secondary" onClick={() => router.push('/play/unboxed/private')} className="flex items-center space-x-2">
                <ArrowLeft size={16} />
                <span>Back</span>
              </Button>
            </div>

            <Card className="p-8 text-center">
              {isTerminal ? (
                <>
                  <h2 className="text-2xl font-bold text-fg mb-4">
                    {lobby.status === 'expired' ? 'This lobby expired' : 'Lobby cancelled'}
                  </h2>
                  <Button onClick={() => router.push('/play/unboxed/private')}>Create a New Lobby</Button>
                </>
              ) : (
                <>
                  <h2 className="text-xl font-bold text-fg mb-2">Invite Code</h2>
                  <p className="text-sm text-fg-secondary mb-6">Share this with the person you want to play.</p>

                  <div className="text-4xl font-mono tracking-[0.3em] font-bold text-accent-primary mb-6 bg-surface-sunken rounded-lg py-4">
                    {lobby.invite_code}
                  </div>

                  <div className="flex gap-3 mb-8">
                    <Button variant="secondary" onClick={() => handleCopy(lobby.invite_code, 'code')} className="flex-1 flex items-center justify-center space-x-2">
                      {copiedCode ? <Check size={16} /> : <Copy size={16} />}
                      <span>{copiedCode ? 'Copied' : 'Copy Code'}</span>
                    </Button>
                    <Button variant="secondary" onClick={() => handleCopy(shareLink, 'link')} className="flex-1 flex items-center justify-center space-x-2">
                      {copiedLink ? <Check size={16} /> : <Copy size={16} />}
                      <span>{copiedLink ? 'Copied' : 'Copy Link'}</span>
                    </Button>
                  </div>

                  <div className="flex items-center justify-center space-x-3 mb-8 text-fg-secondary">
                    <LoadingSpinner size="sm" />
                    <span>Waiting for opponent…</span>
                  </div>

                  <Button variant="danger" onClick={handleCancel} disabled={isCancelling}>
                    {isCancelling ? 'Cancelling…' : 'Cancel Lobby'}
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
