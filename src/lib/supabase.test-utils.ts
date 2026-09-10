import { vi } from 'vitest';

// Hand-rolled fake for the fluent supabase-js query builder used throughout
// src/app/api/** and src/lib/server/** via `supabaseAdmin.from(...)`. Every
// terminal call (`.single()`, or simply `await`-ing the builder) pops the
// next queued result — mirroring how these call sites issue one query after
// another. Use `vi.mock('@/lib/supabase', () => ({ supabaseAdmin: mock }))`
// in a test file, then call `mock.queueResult(...)`/`queueResults(...)`
// before invoking the code under test, in the exact order its queries fire.

export interface SupabaseResult<T = any> {
  data: T | null;
  error: { message: string } | null;
}

export function ok<T>(data: T): SupabaseResult<T> {
  return { data, error: null };
}

export function fail(message: string): SupabaseResult<never> {
  return { data: null, error: { message } };
}

function createBuilder(popNextResult: () => SupabaseResult): any {
  const builder: any = {
    select: vi.fn(() => builder),
    eq: vi.fn(() => builder),
    neq: vi.fn(() => builder),
    or: vi.fn(() => builder),
    order: vi.fn(() => builder),
    limit: vi.fn(() => builder),
    insert: vi.fn(() => builder),
    update: vi.fn(() => builder),
    delete: vi.fn(() => builder),
    single: vi.fn(() => Promise.resolve(popNextResult())),
    // Makes the builder itself awaitable for call sites that don't chain
    // `.single()` (e.g. a bare `await supabaseAdmin.from(...).update(...).eq(...)`).
    then: (resolve: (value: SupabaseResult) => unknown, reject?: (reason: unknown) => unknown) =>
      Promise.resolve(popNextResult()).then(resolve, reject),
  };
  return builder;
}

export function createSupabaseAdminMock() {
  const queue: SupabaseResult[] = [];

  const popNextResult = (): SupabaseResult => {
    if (queue.length === 0) {
      throw new Error(
        'createSupabaseAdminMock: no queued result available — call queueResult()/queueResults() before invoking the code under test for every query it issues.'
      );
    }
    return queue.shift()!;
  };

  return {
    from: vi.fn(() => createBuilder(popNextResult)),
    queueResult(result: SupabaseResult) {
      queue.push(result);
    },
    queueResults(results: SupabaseResult[]) {
      queue.push(...results);
    },
    reset() {
      queue.length = 0;
    },
  };
}
