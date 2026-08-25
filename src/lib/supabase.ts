import { createClient } from '@supabase/supabase-js';
import { devDb } from './devDb';

const isDevMode = process.env.NEXT_PUBLIC_DEV_MODE === 'true';

let supabase: any;
let supabaseAdmin: any;

if (isDevMode) {
  // Offline dev mode: no network calls, no Supabase project required.
  // See docs/CONTEXT.md for how to use the seeded devuser/devpassword account.
  supabase = devDb;
  supabaseAdmin = devDb;
} else {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables');
  }

  // Client for public operations (client-side)
  supabase = createClient(supabaseUrl, supabaseAnonKey);

  // Admin client for server-side operations (with service role key)
  supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

export { supabase, supabaseAdmin };

// Database types based on your schema
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          email: string | null;
          username: string;
          display_name: string | null;
          bio: string | null;
          avatar_url: string | null;
          country: string | null;
          timezone: string | null;
          birth_date: string | null;
          is_verified: boolean;
          is_active: boolean;
          last_seen: string;
          premium_until: string | null;
          fide_rating: number | null;
          preferred_time_control: string | null;
          playstyle_tags: string[] | null;
          total_games: number;
          wins: number;
          losses: number;
          draws: number;
          current_rating: number;
          peak_rating: number;
          profile_visibility: 'public' | 'friends' | 'private';
          allow_friend_requests: boolean;
          show_online_status: boolean;
          password_hash: string;
        };
        Insert: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          email?: string | null;
          username: string;
          display_name?: string | null;
          bio?: string | null;
          avatar_url?: string | null;
          country?: string | null;
          timezone?: string | null;
          birth_date?: string | null;
          is_verified?: boolean;
          is_active?: boolean;
          last_seen?: string;
          premium_until?: string | null;
          fide_rating?: number | null;
          preferred_time_control?: string | null;
          playstyle_tags?: string[] | null;
          total_games?: number;
          wins?: number;
          losses?: number;
          draws?: number;
          current_rating?: number;
          peak_rating?: number;
          profile_visibility?: 'public' | 'friends' | 'private';
          allow_friend_requests?: boolean;
          show_online_status?: boolean;
          password_hash?: string;
        };
        Update: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          email?: string | null;
          username?: string;
          display_name?: string | null;
          bio?: string | null;
          avatar_url?: string | null;
          country?: string | null;
          timezone?: string | null;
          birth_date?: string | null;
          is_verified?: boolean;
          is_active?: boolean;
          last_seen?: string;
          premium_until?: string | null;
          fide_rating?: number | null;
          preferred_time_control?: string | null;
          playstyle_tags?: string[] | null;
          total_games?: number;
          wins?: number;
          losses?: number;
          draws?: number;
          current_rating?: number;
          peak_rating?: number;
          profile_visibility?: 'public' | 'friends' | 'private';
          allow_friend_requests?: boolean;
          show_online_status?: boolean;
          password_hash?: string;
        };
      };
      user_sessions: {
        Row: {
          id: string;
          user_id: string | null;
          device_info: any;
          ip_address: string | null;
          user_agent: string | null;
          created_at: string;
          expires_at: string | null;
          is_active: boolean;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          device_info?: any;
          ip_address?: string | null;
          user_agent?: string | null;
          created_at?: string;
          expires_at?: string | null;
          is_active?: boolean;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          device_info?: any;
          ip_address?: string | null;
          user_agent?: string | null;
          created_at?: string;
          expires_at?: string | null;
          is_active?: boolean;
        };
      };
      games: {
        Row: {
          id: string;
          created_at: string;
          ended_at: string | null;
          mode: 'bot';
          white_player_id: string | null;
          black_player_id: string | null;
          winner_id: string | null;
          status: 'in_progress' | 'completed' | 'abandoned';
          moves: any; // jsonb
        };
        Insert: {
          id?: string;
          created_at?: string;
          ended_at?: string | null;
          mode: 'bot';
          white_player_id?: string | null;
          black_player_id?: string | null;
          winner_id?: string | null;
          status?: 'in_progress' | 'completed' | 'abandoned';
          moves?: any;
        };
        Update: {
          id?: string;
          created_at?: string;
          ended_at?: string | null;
          mode?: 'bot';
          white_player_id?: string | null;
          black_player_id?: string | null;
          winner_id?: string | null;
          status?: 'in_progress' | 'completed' | 'abandoned';
          moves?: any;
        };
      };
    };
  };
}

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];
export type InsertTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert'];
export type UpdateTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update'];

// Type helpers
export type User = Tables<'users'>;
export type UserSession = Tables<'user_sessions'>;
export type Game = Tables<'games'>;
