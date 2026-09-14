import { supabaseAdmin } from '../src/lib/supabase';
import { generatePuzzles } from '../src/lib/puzzleGenerator/generate';

// Run with: npm run db:generate-puzzles
//
// Manual/occasional generator — not wired to a cron job or API route (see
// the puzzle-generator implementation plan for why). Every candidate is
// self-validated (real checkmate, through the same engine the runtime
// attempt route uses) and classified as wraparound-dependent or
// standard-style before being written, so puzzles go active immediately
// with no separate review step. Upserts by `slug`, so re-running after
// motif changes is safe and idempotent — a puzzle whose shape changed
// gets a new slug rather than silently mutating an old one.

async function main() {
  console.log('Generating puzzles...');
  const summary = generatePuzzles();

  console.log(`Generated ${summary.puzzles.length} valid puzzle(s).`);
  console.log('By motif:', summary.countsByMotif);
  console.log('By classification:', summary.countsByClassification);

  if (summary.rejected.length > 0) {
    console.log(`Rejected ${summary.rejected.length} candidate(s):`);
    for (const r of summary.rejected) {
      console.log(`  - ${r.slug}: ${r.reason}`);
    }
  }

  if (summary.puzzles.length === 0) {
    console.log('Nothing to upsert.');
    return;
  }

  const rows = summary.puzzles.map((p) => ({
    slug: p.slug,
    starting_fen: p.startingFen,
    side_to_move: p.sideToMove,
    solution_moves: p.solutionMoves,
    is_wraparound_mode: p.isWraparoundMode,
    rating: p.rating,
    themes: p.themes,
    active: true,
  }));

  const { error } = await supabaseAdmin.from('puzzles').upsert(rows, { onConflict: 'slug' });
  if (error) {
    console.error('Failed to upsert puzzles:', error.message);
    process.exit(1);
  }

  console.log(`Upserted ${rows.length} puzzle(s).`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
