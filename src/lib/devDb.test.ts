import { describe, expect, it } from 'vitest';
import { devDb } from './devDb';
import { puzzlesSeed } from '@/data/puzzles.seed';

describe('devDb', () => {
  it('seeds the curated puzzle set on load', async () => {
    const { data, error } = await devDb.from('puzzles').select('*').eq('active', true);
    expect(error).toBeNull();
    expect(data).toHaveLength(puzzlesSeed.length);
    expect(data.map((p: any) => p.slug).sort()).toEqual(puzzlesSeed.map((p) => p.slug).sort());
  });

  it('upsert inserts a new row when the onConflict column has no match', async () => {
    const { data, error } = await devDb
      .from('puzzles')
      .upsert([{ slug: 'test-upsert-new', starting_fen: '8/8/8/8/8/8/8/8 w - - 0 1', rating: 999, active: true }], {
        onConflict: 'slug',
      });
    expect(error).toBeNull();
    expect(data).toHaveLength(1);

    const { data: found } = await devDb.from('puzzles').select('*').eq('slug', 'test-upsert-new').single();
    expect(found.rating).toBe(999);
  });

  it('upsert updates the existing row in place when the onConflict column matches', async () => {
    await devDb.from('puzzles').upsert([{ slug: 'test-upsert-existing', rating: 1000, active: true }], {
      onConflict: 'slug',
    });
    const { data: firstFound } = await devDb.from('puzzles').select('*').eq('slug', 'test-upsert-existing').single();
    const originalId = firstFound.id;

    await devDb.from('puzzles').upsert([{ slug: 'test-upsert-existing', rating: 1234, active: true }], {
      onConflict: 'slug',
    });

    const { data: all } = await devDb.from('puzzles').select('*').eq('slug', 'test-upsert-existing');
    expect(all).toHaveLength(1);
    expect(all[0].id).toBe(originalId);
    expect(all[0].rating).toBe(1234);
  });
});
