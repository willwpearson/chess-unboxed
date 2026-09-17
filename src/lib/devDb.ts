import bcrypt from 'bcryptjs';
import { puzzlesSeed } from '@/data/puzzles.seed';

// Minimal in-memory stand-in for the Supabase client used by src/app/api/auth/*
// and src/app/api/puzzles/* routes when NEXT_PUBLIC_DEV_MODE=true. Implements
// only the chain shapes those routes actually call: from(table).insert().select().single(),
// .select().or().single(), .select().eq().single(), .update().eq(), and
// .upsert(rows, { onConflict }). Data lives for the life of the dev server
// process and reseeds the fixed dev user and curated puzzle set on every restart.

type Row = Record<string, any>;

const tables: Record<string, Row[]> = {
  users: [],
  user_sessions: [],
  user_ratings: [],
  games: [],
  lobbies: [],
  matchmaking_queue: [],
  password_reset_tokens: [],
  puzzles: [],
  user_puzzle_ratings: [],
  puzzle_attempts: [],
};

let nextId = 1;
function genId() {
  return `dev-${nextId++}`;
}

function seed() {
  tables.users.push({
    id: genId(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    email: 'dev@local.test',
    username: 'devuser',
    display_name: 'Dev User',
    bio: null,
    avatar_url: null,
    country: null,
    timezone: null,
    birth_date: null,
    is_verified: true,
    is_active: true,
    is_guest: false,
    last_seen: new Date().toISOString(),
    premium_until: null,
    fide_rating: null,
    preferred_time_control: null,
    playstyle_tags: null,
    total_games: 0,
    wins: 0,
    losses: 0,
    draws: 0,
    current_rating: 1200,
    peak_rating: 1200,
    profile_visibility: 'public',
    allow_friend_requests: true,
    show_online_status: true,
    password_hash: bcrypt.hashSync('devpassword', 12),
  });

  tables.puzzles.push(
    ...puzzlesSeed.map((p) => ({
      id: genId(),
      created_at: new Date().toISOString(),
      slug: p.slug,
      starting_fen: p.startingFen,
      side_to_move: p.sideToMove,
      solution_moves: p.solutionMoves,
      is_wraparound_mode: p.isWraparoundMode,
      rating: p.rating,
      themes: p.themes,
      active: true,
    }))
  );
}
seed();

function matchesOr(row: Row, expr: string): boolean {
  // expr looks like "email.eq.foo@bar.com,username.eq.foo"
  return expr.split(',').some((clause) => {
    const [col, , value] = clause.split('.');
    return String(row[col]) === value;
  });
}

class QueryBuilder {
  private table: string;
  private op: 'select' | 'insert' | 'update' | 'upsert' | null = null;
  private payload: Row | Row[] | null = null;
  private onConflictCol = 'id';
  private filters: Array<(row: Row) => boolean> = [];
  private orderCol: string | null = null;
  private orderAsc = true;
  private limitN: number | null = null;

  constructor(table: string) {
    this.table = table;
  }

  select(_cols?: string) {
    if (!this.op) this.op = 'select';
    return this;
  }

  insert(row: Row) {
    this.op = 'insert';
    this.payload = row;
    return this;
  }

  update(row: Row) {
    this.op = 'update';
    this.payload = row;
    return this;
  }

  upsert(rows: Row | Row[], opts?: { onConflict?: string }) {
    this.op = 'upsert';
    this.payload = rows;
    this.onConflictCol = opts?.onConflict ?? 'id';
    return this;
  }

  eq(col: string, value: any) {
    this.filters.push((row) => row[col] === value);
    return this;
  }

  neq(col: string, value: any) {
    this.filters.push((row) => row[col] !== value);
    return this;
  }

  // Mirrors Supabase's .not(col, op, value) negated-filter shape. Only the
  // 'is' operator is implemented (the only one this codebase currently
  // uses, e.g. .not('white_last_seen_at', 'is', null)).
  not(col: string, op: string, value: any) {
    if (op !== 'is') {
      throw new Error(`devDb QueryBuilder.not() only supports the 'is' operator, got '${op}'`);
    }
    this.filters.push((row) => row[col] !== value);
    return this;
  }

  or(expr: string) {
    this.filters.push((row) => matchesOr(row, expr));
    return this;
  }

  gte(col: string, value: any) {
    this.filters.push((row) => row[col] >= value);
    return this;
  }

  lte(col: string, value: any) {
    this.filters.push((row) => row[col] <= value);
    return this;
  }

  in(col: string, values: any[]) {
    this.filters.push((row) => values.includes(row[col]));
    return this;
  }

  order(col: string, opts?: { ascending?: boolean }) {
    this.orderCol = col;
    this.orderAsc = opts?.ascending ?? true;
    return this;
  }

  limit(n: number) {
    this.limitN = n;
    return this;
  }

  private rows(): Row[] {
    let result = tables[this.table].filter((row) => this.filters.every((f) => f(row)));
    if (this.orderCol) {
      const col = this.orderCol;
      const dir = this.orderAsc ? 1 : -1;
      result = [...result].sort((a, b) => (a[col] > b[col] ? 1 : a[col] < b[col] ? -1 : 0) * dir);
    }
    if (this.limitN != null) {
      result = result.slice(0, this.limitN);
    }
    return result;
  }

  private execute(): { data: any; error: any } {
    const store = tables[this.table];

    if (this.op === 'insert' && this.payload) {
      const row: Row = { id: genId(), created_at: new Date().toISOString(), ...this.payload };
      store.push(row);
      return { data: row, error: null };
    }

    if (this.op === 'update' && this.payload) {
      const matched = tables[this.table].filter((row) => this.filters.every((f) => f(row)));
      matched.forEach((row) => Object.assign(row, this.payload));
      return { data: matched, error: null };
    }

    if (this.op === 'upsert' && this.payload) {
      const incomingRows = Array.isArray(this.payload) ? this.payload : [this.payload];
      const col = this.onConflictCol;
      const written = incomingRows.map((incoming) => {
        const existing = store.find((row) => row[col] === incoming[col]);
        if (existing) {
          Object.assign(existing, incoming);
          return existing;
        }
        const row: Row = { id: genId(), created_at: new Date().toISOString(), ...incoming };
        store.push(row);
        return row;
      });
      return { data: written, error: null };
    }

    // select
    return { data: this.rows(), error: null };
  }

  single() {
    const { data, error } = this.execute();
    if (Array.isArray(data)) {
      return Promise.resolve({ data: data[0] ?? null, error: data[0] ? null : { message: 'Not found' } });
    }
    return Promise.resolve({ data, error });
  }

  then(resolve: (value: { data: any; error: any }) => void, reject?: (reason: any) => void) {
    return Promise.resolve(this.execute()).then(resolve, reject);
  }
}

export const devDb = {
  from(table: string) {
    if (!tables[table]) tables[table] = [];
    return new QueryBuilder(table);
  },
};
