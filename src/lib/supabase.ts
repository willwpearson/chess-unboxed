import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Client for public operations (client-side)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Admin client for server-side operations (with service role key)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Database types based on your schema
export interface Database {
  public: {
    Tables: {
      players: {
        Row: {
          id: string;
          created_at: string;
          nickname: string | null;
          score: number;
          is_active: boolean;
        };
        Insert: {
          id?: string;
          created_at?: string;
          nickname?: string | null;
          score?: number;
          is_active?: boolean;
        };
        Update: {
          id?: string;
          created_at?: string;
          nickname?: string | null;
          score?: number;
          is_active?: boolean;
        };
      };
      games: {
        Row: {
          id: string;
          created_at: string;
          ended_at: string | null;
          mode: 'bot' | 'pvp' | 'endless';
          player1_id: string | null;
          player2_id: string | null;
          winner_id: string | null;
          status: 'in_progress' | 'completed' | 'abandoned';
          moves: any; // jsonb
        };
        Insert: {
          id?: string;
          created_at?: string;
          ended_at?: string | null;
          mode: 'bot' | 'pvp' | 'endless';
          player1_id?: string | null;
          player2_id?: string | null;
          winner_id?: string | null;
          status?: 'in_progress' | 'completed' | 'abandoned';
          moves?: any;
        };
        Update: {
          id?: string;
          created_at?: string;
          ended_at?: string | null;
          mode?: 'bot' | 'pvp' | 'endless';
          player1_id?: string | null;
          player2_id?: string | null;
          winner_id?: string | null;
          status?: 'in_progress' | 'completed' | 'abandoned';
          moves?: any;
        };
      };
      lobbies: {
        Row: {
          id: string;
          created_at: string;
          host_id: string | null;
          guest_id: string | null;
          status: 'waiting' | 'full' | 'in_game';
        };
        Insert: {
          id?: string;
          created_at?: string;
          host_id?: string | null;
          guest_id?: string | null;
          status?: 'waiting' | 'full' | 'in_game';
        };
        Update: {
          id?: string;
          created_at?: string;
          host_id?: string | null;
          guest_id?: string | null;
          status?: 'waiting' | 'full' | 'in_game';
        };
      };
      endless_sessions: {
        Row: {
          id: string;
          player_id: string | null;
          score: number;
          active: boolean;
          started_at: string;
          ended_at: string | null;
        };
        Insert: {
          id?: string;
          player_id?: string | null;
          score?: number;
          active?: boolean;
          started_at?: string;
          ended_at?: string | null;
        };
        Update: {
          id?: string;
          player_id?: string | null;
          score?: number;
          active?: boolean;
          started_at?: string;
          ended_at?: string | null;
        };
      };
    };
  };
}

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];
export type InsertTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert'];
export type UpdateTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update'];

// Type helpers
export type Player = Tables<'players'>;
export type Game = Tables<'games'>;
export type Lobby = Tables<'lobbies'>;
export type EndlessSession = Tables<'endless_sessions'>;
