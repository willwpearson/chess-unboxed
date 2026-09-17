import { supabaseAdmin } from '../src/lib/supabase';
import { validatePuzzleSolution } from '../src/lib/puzzleValidation';
import { puzzlesSeed } from '../src/data/puzzles.seed';

// Run with: npm run db:seed-puzzles
//
// Every puzzle is self-validated (replayed through the same GameManager the
// runtime attempt route uses) before anything is written — this fails the
// whole run rather than seeding partially-broken data. Upserts by `slug` so
// re-running after editing a puzzle in puzzles.seed.ts is safe and
// idempotent.

async function main() {
  console.log(`Validating ${puzzlesSeed.length} puzzle(s)...`);

  for (const puzzle of puzzlesSeed) {
    const result = validatePuzzleSolution(puzzle);
    if (!result.valid) {
      console.error('Puzzle validation FAILED:', result.error);
      process.exit(1);
    }
    console.log(`  ✓ ${puzzle.slug}`);
  }

  console.log('All puzzles validated. Upserting...');

  const rows = puzzlesSeed.map((p) => ({
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

  console.log(`Seeded ${rows.length} puzzle(s).`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
