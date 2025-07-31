/**
 * Stats Panel Component
 * Displays player statistics and endless mode sessions
 */
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
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
          <h1 className="text-3xl font-bold text-gray-900">Endless Mode</h1>
          <p className="text-gray-600 mt-1">Challenge yourself - one loss and you&apos;re out!</p>
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
              className="flex items-center space-x-2 bg-purple-600 hover:bg-purple-700"
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
              <div className="text-2xl font-bold text-purple-600 mb-1">
                {playerBestScore}
              </div>
              <div className="text-sm text-gray-600">Your Best Score</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600 mb-1">
                {endlessStats.filter(s => s.playerName === player.nickname).length}
              </div>
              <div className="text-sm text-gray-600">Sessions Played</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600 mb-1">
                {activeSession ? 'Active' : 'None'}
              </div>
              <div className="text-sm text-gray-600">Current Session</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Active Session Alert */}
      {activeSession && (
        <Card className="border-purple-200 bg-purple-50">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <Zap className="text-purple-600" size={24} />
              <div>
                <h3 className="font-semibold text-purple-900">Active Endless Session</h3>
                <p className="text-purple-700">
                  Current Score: <span className="font-bold">{activeSession.score}</span>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error Display */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="text-red-600">{error}</div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Leaderboard */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Endless Mode Leaderboard</h2>
            <span className="text-sm text-gray-500">
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
                  ? 'bg-gradient-to-r from-yellow-50 to-amber-50 border-yellow-200' 
                  : 'bg-white border-gray-200'
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className="flex items-center justify-center w-8 h-8">
                  {stat.rank === 1 && <Trophy className="text-yellow-500" size={20} />}
                  {stat.rank === 2 && <Trophy className="text-gray-400" size={20} />}
                  {stat.rank === 3 && <Trophy className="text-amber-600" size={20} />}
                  {stat.rank > 3 && (
                    <span className="text-sm font-bold text-gray-600">#{stat.rank}</span>
                  )}
                </div>
                
                <div>
                  <div className="font-medium">{stat.playerName}</div>
                  {stat.active && (
                    <div className="text-xs text-green-600 font-medium">● Active</div>
                  )}
                </div>
              </div>
              
              <div className="text-right">
                <div className="text-lg font-bold text-purple-600">
                  {stat.score}
                </div>
                <div className="text-xs text-gray-500">Score</div>
              </div>
            </div>
          ))}
          
          {endlessStats.length === 0 && !isLoadingStats && (
            <div className="text-center py-8">
              <Zap size={48} className="mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Sessions Yet</h3>
              <p className="text-gray-600">
                Be the first to start an endless mode session!
              </p>
            </div>
          )}
          
          {isLoadingStats && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading sessions...</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
