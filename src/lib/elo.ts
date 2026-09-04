// Pure ELO math — no DB access. Per docs/MULTIPLAYER_PROGRESS.md Key Decisions:
// K=40 while provisional (<10 games in the relevant time-control bucket),
// K=20 at rating >= 2000, K=32 otherwise; standard logistic expected score.

export type MatchScore = 1 | 0.5 | 0;

export function getKFactor(gamesPlayed: number, rating: number): number {
  if (gamesPlayed < 10) return 40;
  if (rating >= 2000) return 20;
  return 32;
}

export function expectedScore(ratingSelf: number, ratingOpponent: number): number {
  return 1 / (1 + Math.pow(10, (ratingOpponent - ratingSelf) / 400));
}

export function computeRatingDelta(
  rating: number,
  gamesPlayed: number,
  opponentRating: number,
  score: MatchScore
): number {
  const k = getKFactor(gamesPlayed, rating);
  return Math.round(k * (score - expectedScore(rating, opponentRating)));
}
