import { validatePuzzleSolution } from '@/lib/puzzleValidation';
import type { CandidatePuzzle } from './types';
import * as backRankSliderWrap from './motifs/backRankSliderWrap';
import * as knightCornerWrapFork from './motifs/knightCornerWrapFork';

// Per-motif base rating plus a small deterministic jitter (seeded from the
// slug, so reruns are stable) — a heuristic starting point in the same
// 1000-1800 band as the hand-authored set. Real calibration from
// puzzle_attempts solve-rate data is future work, not built here.
const MOTIF_BASE_RATING: Record<string, number> = {
  backRankSliderWrap: 1150,
  knightCornerWrapFork: 1450,
};

function hashString(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 31 + input.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

function jitterRating(motif: string, slug: string): number {
  const base = MOTIF_BASE_RATING[motif] ?? 1200;
  const jitter = hashString(slug) % 101; // 0-100
  return base + jitter;
}

export interface GeneratedPuzzle {
  slug: string;
  startingFen: string;
  sideToMove: CandidatePuzzle['sideToMove'];
  solutionMoves: CandidatePuzzle['solutionMoves'];
  isWraparoundMode: true;
  rating: number;
  themes: string[];
}

export interface GenerateSummary {
  puzzles: GeneratedPuzzle[];
  rejected: { slug: string; reason: string }[];
  countsByMotif: Record<string, number>;
  countsByClassification: { wraparound: number; standard: number };
}

function classifyAndBuild(
  candidate: CandidatePuzzle,
  seenSignatures: Set<string>,
  rejected: GenerateSummary['rejected']
): GeneratedPuzzle | null {
  const signature = `${candidate.startingFen}|${JSON.stringify(candidate.solutionMoves)}`;
  if (seenSignatures.has(signature)) {
    rejected.push({ slug: candidate.slug, reason: 'duplicate of an already-generated candidate' });
    return null;
  }

  const result = validatePuzzleSolution(candidate);
  if (!result.valid) {
    rejected.push({ slug: candidate.slug, reason: result.error ?? 'invalid' });
    return null;
  }

  seenSignatures.add(signature);

  const usedWraparound = result.usedWraparound ?? false;
  return {
    slug: candidate.slug,
    startingFen: candidate.startingFen,
    sideToMove: candidate.sideToMove,
    solutionMoves: candidate.solutionMoves,
    isWraparoundMode: true,
    rating: jitterRating(candidate.motif, candidate.slug),
    themes: [candidate.motif, usedWraparound ? 'wraparound' : 'standard-style', 'generated'],
  };
}

// Runs every motif's full parameter sweep, validates and classifies every
// candidate, and drops anything invalid or duplicate. Pure/no I/O — the
// caller (scripts/generatePuzzles.ts) is responsible for upserting the
// result into the DB.
export function generatePuzzles(): GenerateSummary {
  const puzzles: GeneratedPuzzle[] = [];
  const rejected: GenerateSummary['rejected'] = [];
  const seenSignatures = new Set<string>();
  const countsByMotif: Record<string, number> = {};
  const countsByClassification = { wraparound: 0, standard: 0 };

  const allCandidates: CandidatePuzzle[] = [];
  for (const params of backRankSliderWrap.sweep()) {
    const candidate = backRankSliderWrap.generate(params);
    if (candidate) allCandidates.push(candidate);
  }
  for (const params of knightCornerWrapFork.sweep()) {
    const candidate = knightCornerWrapFork.generate(params);
    if (candidate) allCandidates.push(candidate);
  }

  for (const candidate of allCandidates) {
    const built = classifyAndBuild(candidate, seenSignatures, rejected);
    if (!built) continue;

    puzzles.push(built);
    countsByMotif[candidate.motif] = (countsByMotif[candidate.motif] ?? 0) + 1;
    if (built.themes.includes('wraparound')) {
      countsByClassification.wraparound++;
    } else {
      countsByClassification.standard++;
    }
  }

  return { puzzles, rejected, countsByMotif, countsByClassification };
}
