import { NextRequest, NextResponse } from 'next/server';
import { getAuthUserId } from '@/lib/server/authUser';
import { getOrCreatePuzzleRating } from '@/lib/server/applyPuzzleResult';

// The caller's own puzzle rating, independent of any specific puzzle. Every
// other puzzle route (`next`, `daily`, `attempt`) only ever returns a
// puzzle's difficulty rating, not the user's — this is the one place the UI
// can read the user's actual user_puzzle_ratings row.

export async function GET(request: NextRequest) {
  const userId = getAuthUserId(request);
  if (!userId) {
    return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
  }

  try {
    const row = await getOrCreatePuzzleRating(userId);
    return NextResponse.json({
      success: true,
      data: {
        rating: row.rating,
        peakRating: row.peak_rating,
        puzzlesAttempted: row.puzzles_attempted,
        puzzlesSolved: row.puzzles_solved,
      },
      timestamp: Date.now(),
    });
  } catch {
    return NextResponse.json({ success: false, error: 'Failed to load puzzle rating' }, { status: 500 });
  }
}
