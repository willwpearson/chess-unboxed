'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { RatingBadge } from '@/components/ui/RatingBadge';
import { Puzzle, Calendar } from 'lucide-react';

interface DailyPreview {
  rating: number;
  date: string;
  attempted: boolean;
  solved: boolean | null;
}

export default function PuzzlesLandingPage() {
  const router = useRouter();
  const [rating, setRating] = useState<number | null>(null);
  const [dailyPreview, setDailyPreview] = useState<DailyPreview | null>(null);

  useEffect(() => {
    fetch('/api/puzzles/daily', { credentials: 'include' })
      .then((r) => r.json())
      .then((body) => {
        if (body.success) {
          setDailyPreview(body.data);
          setRating(body.data.rating);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-surface-base flex flex-col">
      <Header />
      <main className="flex-1">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
          <Card className="p-8 text-center bg-gradient-to-br from-purple-500/20 to-pink-600/20">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-r from-purple-500 to-pink-600 text-white mb-6">
              <Puzzle size={40} />
            </div>
            <h1 className="text-3xl font-bold text-fg mb-2">Puzzles</h1>
            <p className="text-fg-secondary">Tactics built for the wraparound board.</p>
            {rating !== null && (
              <div className="mt-4">
                <RatingBadge rating={rating} size="md" />
              </div>
            )}
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Calendar size={18} className="text-fg-secondary" />
                <h2 className="text-lg font-semibold text-fg">Daily puzzle</h2>
              </div>
              {dailyPreview && <Badge variant="info">{dailyPreview.date}</Badge>}
            </div>
            {dailyPreview?.attempted ? (
              <p className="text-fg-secondary text-sm mb-4">
                {dailyPreview.solved ? 'Solved today — come back tomorrow.' : 'Attempted today — come back tomorrow.'}
              </p>
            ) : (
              <p className="text-fg-secondary text-sm mb-4">One puzzle, same for everyone, every day.</p>
            )}
            <Button onClick={() => router.push('/puzzles/daily')} disabled={dailyPreview?.attempted}>
              {dailyPreview?.attempted ? "Today's puzzle done" : "Play today's puzzle"}
            </Button>
          </Card>

          <Card className="p-6">
            <h2 className="text-lg font-semibold text-fg mb-2">Practice</h2>
            <p className="text-fg-secondary text-sm mb-4">
              Solve puzzles matched to your rating, one after another.
            </p>
            <Button onClick={() => router.push('/puzzles/practice')}>Start practice</Button>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}
