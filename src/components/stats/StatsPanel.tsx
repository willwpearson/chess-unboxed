/**
 * Stats Panel Component
 * Displays player statistics and endless mode sessions
 */
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { api, EndlessSession } from '@/lib/api';
import { usePlayer } from '@/hooks';
import { Trophy, Zap, TrendingUp, Users, RefreshCw } from 'lucide-react';

interface StatsEntry {
  id: string;
  playerName: string;
  score: number;
  active: boolean;
  rank: number;
}

interface StatsProps {
  onRefresh?: () => void;
  isLoading?: boolean;
}

export function StatsPanel({ onRefresh, isLoading }: StatsProps) {
  const [endlessStats, setEndlessStats] = useState<StatsEntry[]>([]);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { player } = usePlayer();

  const fetchEndlessStats = async () => {
    setIsLoadingStats(true);
    setError(null);
    
    try {
      const response = await api.getEndlessSessions();
      if (response.success && response.data) {
        const statsData: StatsEntry[] = response.data.sessions
          .sort((a, b) => b.score - a.score)
          .map((session, index) => ({
            id: session.id,
            playerName: session.player?.nickname || 'Unknown Player',
            score: session.score,
            active: session.active,
            rank: index + 1,
          }));
        
        setEndlessStats(statsData);
      }
    } catch (error) {
      console.error('Error fetching endless stats:', error);
      setError('Failed to fetch stats');
    } finally {
      setIsLoadingStats(false);
    }
  };

  const handleRefresh = async () => {
    await fetchEndlessStats();
    if (onRefresh) {
      onRefresh();
    }
  };

  const startEndlessSession = async () => {
    if (!player) {
      alert('Please wait for player initialization...');
      return;
    }

    setIsLoadingStats(true);
    
    try {
      const response = await api.createEndlessSession(player.id);
      if (response.success) {
        console.log('Started endless session:', response.data);
        await fetchEndlessStats();
        alert('Endless session started! Good luck!');
      } else {
        throw new Error(response.error || 'Failed to start endless session');
      }
    } catch (error) {
      console.error('Error starting endless session:', error);
      alert('Failed to start endless session. Please try again.');
    } finally {
      setIsLoadingStats(false);
    }
  };

  useEffect(() => {
    fetchEndlessStats();
  }, []);

  const activeSession = endlessStats.find(stat => 
    player && stat.playerName === player.nickname && stat.active
  );

  const playerBestScore = endlessStats
    .filter(stat => player && stat.playerName === player.nickname)
    .reduce((max, stat) => Math.max(max, stat.score), 0);

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-fg">Endless Mode</h1>
          <p className="text-fg-secondary mt-1">Challenge yourself - one loss and you&apos;re out!</p>
        </div>

        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={isLoading || isLoadingStats}
            className="flex items-center space-x-2"
          >
            <RefreshCw size={16} className={isLoading || isLoadingStats ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </Button>

          {player && !activeSession && (
            <Button
              onClick={startEndlessSession}
              disabled={isLoadingStats}
              className="flex items-center space-x-2"
            >
              <Zap size={16} />
              <span>Start Session</span>
            </Button>
          )}
        </div>
      </div>

      {/* Player Stats */}
      {player && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-accent-primary mb-1">
                {playerBestScore}
              </div>
              <div className="text-sm text-fg-secondary">Your Best Score</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-accent-secondary mb-1">
                {endlessStats.filter(s => s.playerName === player.nickname).length}
              </div>
              <div className="text-sm text-fg-secondary">Sessions Played</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-status-success mb-1">
                {activeSession ? 'Active' : 'None'}
              </div>
              <div className="text-sm text-fg-secondary">Current Session</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Active Session Alert */}
      {activeSession && (
        <Card className="border-accent-primary bg-accent-primary/5">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <Zap className="text-accent-primary" size={24} />
              <div>
                <h3 className="font-semibold text-fg">Active Endless Session</h3>
                <p className="text-fg-secondary">
                  Current Score: <span className="font-bold">{activeSession.score}</span>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error Display */}
      {error && (
        <Card className="border-status-danger bg-status-danger/5">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="text-status-danger">{error}</div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Leaderboard */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-fg">Endless Mode Leaderboard</h2>
            <span className="text-sm text-fg-muted">
              {endlessStats.length} sessions
            </span>
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          {endlessStats.slice(0, 10).map((stat) => (
            <div
              key={stat.id}
              className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                stat.rank <= 3
                  ? 'bg-status-warning/10 border-status-warning/30'
                  : 'bg-surface-raised border-border-subtle'
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className="flex items-center justify-center w-8 h-8">
                  {stat.rank === 1 && <Trophy className="text-status-warning" size={20} />}
                  {stat.rank === 2 && <Trophy className="text-fg-muted" size={20} />}
                  {stat.rank === 3 && <Trophy className="text-accent-secondary" size={20} />}
                  {stat.rank > 3 && (
                    <span className="text-sm font-bold text-fg-secondary">#{stat.rank}</span>
                  )}
                </div>

                <div>
                  <div className="font-medium text-fg">{stat.playerName}</div>
                  {stat.active && (
                    <Badge variant="success" size="sm" className="mt-0.5">Active</Badge>
                  )}
                </div>
              </div>

              <div className="text-right">
                <div className="text-lg font-bold text-accent-primary">
                  {stat.score}
                </div>
                <div className="text-xs text-fg-muted">Score</div>
              </div>
            </div>
          ))}

          {endlessStats.length === 0 && !isLoadingStats && (
            <div className="text-center py-8">
              <Zap size={48} className="mx-auto mb-4 text-fg-muted" />
              <h3 className="text-lg font-semibold text-fg mb-2">No Sessions Yet</h3>
              <p className="text-fg-secondary">
                Be the first to start an endless mode session!
              </p>
            </div>
          )}

          {isLoadingStats && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-primary mx-auto mb-4"></div>
              <p className="text-fg-secondary">Loading sessions...</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
