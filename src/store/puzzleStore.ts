import { create } from 'zustand';
import type { PieceColor, PieceType, Square } from '@/types/game';
import { useGameStore } from './gameStore';

// Puzzle-session bookkeeping layered on top of useGameStore's gameManager
// (see gameStore.initPuzzle). This store never re-validates a solution
// itself — the server (/api/puzzles/[puzzleId]/attempt) is the sole
// authority, per this repo's security priority. It only reconciles the
// local board with what the server says happened: apply the opponent's
// reply on a correct-but-not-final move, or roll the board back to the
// puzzle's start on a wrong move.

export type PuzzleAttemptStatus = 'idle' | 'checking' | 'correct-continue' | 'solved' | 'failed';

export interface ActivePuzzle {
  puzzleId: string;
  startingFen: string;
  sideToMove: PieceColor;
  isWraparoundMode: boolean;
  rating: number;
}

interface PuzzleStore {
  currentPuzzle: ActivePuzzle | null;
  moveIndex: number;
  hintsUsed: number;
  status: PuzzleAttemptStatus;
  ratingChange: number | null;
  loadPuzzle: (puzzle: ActivePuzzle) => void;
  submitMove: (from: Square, to: Square, promotion: PieceType | undefined, source: 'practice' | 'daily') => Promise<void>;
  reset: () => void;
}

interface AttemptResponse {
  success: boolean;
  error?: string;
  data?: {
    correct?: boolean;
    opponentReply?: { from: Square; to: Square; promotion?: PieceType };
    solved?: boolean;
    done?: boolean;
    ratingChange?: number | null;
    alreadyAttempted?: boolean;
  };
}

export const usePuzzleStore = create<PuzzleStore>()((set, get) => ({
  currentPuzzle: null,
  moveIndex: 0,
  hintsUsed: 0,
  status: 'idle',
  ratingChange: null,

  loadPuzzle: (puzzle: ActivePuzzle) => {
    useGameStore.getState().initPuzzle({ startingFen: puzzle.startingFen, sideToMove: puzzle.sideToMove });
    set({ currentPuzzle: puzzle, moveIndex: 0, hintsUsed: 0, status: 'idle', ratingChange: null });
  },

  submitMove: async (from, to, promotion, source) => {
    const { currentPuzzle, moveIndex } = get();
    if (!currentPuzzle) return;

    set({ status: 'checking' });

    // Optimistic local apply for instant board feedback — the server call
    // below is what actually decides correctness; if it disagrees, the
    // board is rebuilt from scratch and only the confirmed-correct prefix
    // is replayed.
    useGameStore.getState().gameManager?.makeMove(from, to, promotion);
    useGameStore.setState({ currentGame: useGameStore.getState().gameManager?.getGameState() ?? null });

    try {
      const response = await fetch(`/api/puzzles/${currentPuzzle.puzzleId}/attempt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ moveIndex, from, to, promotion, source }),
      });
      const body: AttemptResponse = await response.json();

      if (!body.success || !body.data) {
        set({ status: 'idle' });
        return;
      }

      const { correct, opponentReply, solved, ratingChange } = body.data;

      if (!correct) {
        // Wrong move — rebuild the board from the puzzle start (the
        // optimistic apply above was never confirmed by the server).
        useGameStore.getState().initPuzzle({
          startingFen: currentPuzzle.startingFen,
          sideToMove: currentPuzzle.sideToMove,
        });
        set({ status: 'failed', ratingChange: ratingChange ?? null });
        return;
      }

      if (solved) {
        set({ status: 'solved', ratingChange: ratingChange ?? null });
        return;
      }

      if (opponentReply) {
        useGameStore.getState().gameManager?.makeMove(opponentReply.from, opponentReply.to, opponentReply.promotion);
        useGameStore.setState({ currentGame: useGameStore.getState().gameManager?.getGameState() ?? null });
      }

      set({ status: 'correct-continue', moveIndex: moveIndex + 2 });
    } catch (error) {
      console.error('Puzzle attempt failed:', error);
      set({ status: 'idle' });
    }
  },

  reset: () => set({ currentPuzzle: null, moveIndex: 0, hintsUsed: 0, status: 'idle', ratingChange: null }),
}));
