/**
 * Leaderboard Component
 * Displays player rankings and statistics
 */
'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Trophy, Medal, Award, TrendingUp, Users, Zap, RefreshCw } from 'lucide-react';

interface LeaderboardEntry {
  rank: number;
  playerId: string;
  nickname: string;
  rating: number;
  gamesPlayed: number;
  wins: number;
  losses: number;
  draws: number;
  winRate: number;
  endlessHighScore?: number;
}

interface LeaderboardProps {
  onRefresh: () => void;
  isLoading?: boolean;
  data?: {
    rating: Array<LeaderboardEntry>;
    endless: Array<{ id: string; score: number; rank: number; player?: { nickname: string } }>;
  };
}

const MOCK_LEADERBOARD: LeaderboardEntry[] = [
  {
    rank: 1,
    playerId: '1',
    nickname: 'ChessMaster2024',
    rating: 2150,
    gamesPlayed: 342,
    wins: 245,
    losses: 67,
    draws: 30,
    winRate: 71.6,
    endlessHighScore: 15
  },
  {
    rank: 2,
    playerId: '2',
    nickname: 'QueenSlayer',
    rating: 2089,
    gamesPlayed: 198,
    wins: 134,
    losses: 44,
    draws: 20,
    winRate: 67.7,
    endlessHighScore: 12
  },
  {
    rank: 3,
    playerId: '3',
    nickname: 'KnightRider',
    rating: 1987,
    gamesPlayed: 267,
    wins: 156,
    losses: 78,
    draws: 33,
    winRate: 58.4,
    endlessHighScore: 9
  },
  {
    rank: 4,
    playerId: '4',
    nickname: 'PawnStorm',
    rating: 1876,
    gamesPlayed: 423,
    wins: 231,
    losses: 142,
    draws: 50,
    winRate: 54.6,
    endlessHighScore: 7
  },
  {
    rank: 5,
    playerId: '5',
    nickname: 'CastleDefender',
    rating: 1834,
    gamesPlayed: 156,
    wins: 89,
    losses: 52,
    draws: 15,
    winRate: 57.1,
    endlessHighScore: 11
  },
  {
    rank: 6,
    playerId: '6',
    nickname: 'EndlessWanderer',
    rating: 1789,
    gamesPlayed: 89,
    wins: 52,
    losses: 28,
    draws: 9,
    winRate: 58.4,
    endlessHighScore: 18
  },
  {
    rank: 7,
    playerId: '7',
    nickname: 'BishopBlitz',
    rating: 1745,
    gamesPlayed: 278,
    wins: 145,
    losses: 103,
    draws: 30,
    winRate: 52.2,
    endlessHighScore: 5
  },
  {
    rank: 8,
    playerId: '8',
    nickname: 'RookiePlayer',
    rating: 1678,
    gamesPlayed: 134,
    wins: 67,
    losses: 56,
    draws: 11,
    winRate: 50.0,
    endlessHighScore: 3
  },
  {
    rank: 9,
    playerId: '9',
    nickname: 'CheckmateSeeker',
    rating: 1634,
    gamesPlayed: 203,
    wins: 98,
    losses: 89,
    draws: 16,
    winRate: 48.3,
    endlessHighScore: 6
  },
  {
    rank: 10,
    playerId: '10',
    nickname: 'TacticMaster',
    rating: 1587,
    gamesPlayed: 167,
    wins: 78,
    losses: 73,
    draws: 16,
    winRate: 46.7,
    endlessHighScore: 4
  }
];

export function Leaderboard({ onRefresh, isLoading, data }: LeaderboardProps) {
  const [selectedTab, setSelectedTab] = useState<'rating' | 'endless'>('rating');
  
  // Use real data if available, fallback to mock data for development
  const ratingLeaderboard = data?.rating || MOCK_LEADERBOARD;
  const endlessLeaderboard = data?.endless?.map(session => ({
    rank: session.rank,
    playerId: session.id,
    nickname: session.player?.nickname || 'Unknown Player',
    rating: 0, // Not applicable for endless mode
    gamesPlayed: 0, // Not applicable for endless mode
    wins: 0,
    losses: 0,
    draws: 0,
    winRate: 0,
    endlessHighScore: session.score,
  })) || [];

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="text-yellow-500" size={24} />;
      case 2:
        return <Medal className="text-gray-400" size={24} />;
      case 3:
        return <Award className="text-amber-600" size={24} />;
      default:
        return <span className="text-lg font-bold text-gray-600">#{rank}</span>;
    }
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 2000) return 'text-purple-600 font-bold';
    if (rating >= 1800) return 'text-blue-600 font-semibold';
    if (rating >= 1600) return 'text-green-600 font-medium';
    if (rating >= 1400) return 'text-yellow-600';
    return 'text-gray-600';
  };

  const sortedLeaderboard = selectedTab === 'rating' 
    ? [...ratingLeaderboard].sort((a, b) => b.rating - a.rating)
    : [...endlessLeaderboard].sort((a, b) => (b.endlessHighScore || 0) - (a.endlessHighScore || 0));

  const renderPlayerRow = (entry: LeaderboardEntry, index: number) => {
    const displayRank = selectedTab === 'rating' ? entry.rank : index + 1;
    const isTop3 = displayRank <= 3;

    return (
      <div
        key={entry.playerId}
        className={`flex items-center p-4 rounded-lg border transition-all hover:shadow-md ${
          isTop3 ? 'bg-gradient-to-r from-yellow-50 to-amber-50 border-yellow-200' : 'bg-white border-gray-200'
        }`}
      >
        {/* Rank */}
        <div className="flex items-center justify-center w-12 h-12 mr-4">
          {getRankIcon(displayRank)}
        </div>

        {/* Player Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-3">
            <h3 className="font-semibold text-lg truncate">{entry.nickname}</h3>
            {isTop3 && (
              <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
                Top {displayRank}
              </span>
            )}
          </div>

          <div className="flex items-center space-x-4 mt-1 text-sm text-gray-600">
            <span className="flex items-center">
              <Users size={14} className="mr-1" />
              {entry.gamesPlayed} games
            </span>
            <span className="flex items-center">
              <TrendingUp size={14} className="mr-1" />
              {entry.winRate.toFixed(1)}% win rate
            </span>
            <span>
              W:{entry.wins} L:{entry.losses} D:{entry.draws}
            </span>
          </div>
        </div>

        {/* Stats */}
        <div className="text-right">
          {selectedTab === 'rating' ? (
            <div>
              <div className={`text-2xl font-bold ${getRatingColor(entry.rating)}`}>
                {entry.rating}
              </div>
              <div className="text-xs text-gray-500">Rating</div>
            </div>
          ) : (
            <div>
              <div className="text-2xl font-bold text-purple-600">
                {entry.endlessHighScore || 0}
              </div>
              <div className="text-xs text-gray-500">High Score</div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Leaderboard</h1>
          <p className="text-gray-600 mt-1">See how you rank against other players</p>
        </div>
        
        <Button
          variant="outline"
          onClick={onRefresh}
          disabled={isLoading}
          className="flex items-center space-x-2"
        >
          <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
          <span>Refresh</span>
        </Button>
      </div>

      {/* Tab Selector */}
      <Card>
        <CardContent className="p-0">
          <div className="flex border-b">
            <button
              className={`flex-1 py-4 px-6 text-center font-medium transition-colors ${
                selectedTab === 'rating'
                  ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
              onClick={() => setSelectedTab('rating')}
            >
              <div className="flex items-center justify-center space-x-2">
                <Trophy size={18} />
                <span>Rating Leaderboard</span>
              </div>
            </button>
            
            <button
              className={`flex-1 py-4 px-6 text-center font-medium transition-colors ${
                selectedTab === 'endless'
                  ? 'bg-purple-50 text-purple-600 border-b-2 border-purple-600'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
              onClick={() => setSelectedTab('endless')}
            >
              <div className="flex items-center justify-center space-x-2">
                <Zap size={18} />
                <span>Endless Mode</span>
              </div>
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Leaderboard */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">
              {selectedTab === 'rating' ? 'Top Players by Rating' : 'Endless Mode Champions'}
            </h2>
            <span className="text-sm text-gray-500">
              {sortedLeaderboard.length} players
            </span>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-3">
          {sortedLeaderboard.map((entry, index) => renderPlayerRow(entry, index))}
          
          {sortedLeaderboard.length === 0 && (
            <div className="text-center py-12">
              <Trophy size={64} className="mx-auto mb-4 text-gray-400" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Data Available</h3>
              <p className="text-gray-600">
                Play some games to appear on the leaderboard!
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600 mb-1">
              {ratingLeaderboard.reduce((sum: number, entry: LeaderboardEntry) => sum + entry.gamesPlayed, 0).toLocaleString()}
            </div>
            <div className="text-sm text-gray-600">Total Games Played</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600 mb-1">
              {ratingLeaderboard.length}
            </div>
            <div className="text-sm text-gray-600">Active Players</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600 mb-1">
              {endlessLeaderboard.length > 0 ? Math.max(...endlessLeaderboard.map((e: LeaderboardEntry) => e.endlessHighScore || 0)) : 0}
            </div>
            <div className="text-sm text-gray-600">Highest Endless Score</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
