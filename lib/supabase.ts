/**
 * KASETA - Supabase Client Configuration
 * Configured with expo-secure-store for token persistence
 */

import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// Supabase configuration
// TODO: Replace with your actual Supabase credentials
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key';

/**
 * Custom storage adapter using expo-secure-store
 * Falls back to localStorage for web
 */
const ExpoSecureStoreAdapter = {
  getItem: async (key: string): Promise<string | null> => {
    if (Platform.OS === 'web') {
      if (typeof localStorage !== 'undefined') {
        return localStorage.getItem(key);
      }
      return null;
    }
    try {
      return await SecureStore.getItemAsync(key);
    } catch (error) {
      console.warn('SecureStore getItem error:', error);
      return null;
    }
  },

  setItem: async (key: string, value: string): Promise<void> => {
    if (Platform.OS === 'web') {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(key, value);
      }
      return;
    }
    try {
      await SecureStore.setItemAsync(key, value);
    } catch (error) {
      console.warn('SecureStore setItem error:', error);
    }
  },

  removeItem: async (key: string): Promise<void> => {
    if (Platform.OS === 'web') {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(key);
      }
      return;
    }
    try {
      await SecureStore.deleteItemAsync(key);
    } catch (error) {
      console.warn('SecureStore removeItem error:', error);
    }
  },
};

/**
 * Supabase client instance
 * Configured with:
 * - Secure token storage (expo-secure-store)
 * - Auto refresh tokens
 * - Persist session
 */
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: ExpoSecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

/**
 * Helper to check if Supabase is properly configured
 */
export const isSupabaseConfigured = (): boolean => {
  return (
    SUPABASE_URL !== 'https://your-project.supabase.co' &&
    SUPABASE_ANON_KEY !== 'your-anon-key'
  );
};

/**
 * Database types (will be generated from Supabase)
 * TODO: Generate types with `npx supabase gen types typescript`
 */
export type Database = {
  public: {
    Tables: {
      // Users profile extension
      profiles: {
        Row: {
          id: string;
          email: string | null;
          phone: string | null;
          full_name: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email?: string | null;
          phone?: string | null;
          full_name?: string | null;
          avatar_url?: string | null;
        };
        Update: {
          email?: string | null;
          phone?: string | null;
          full_name?: string | null;
          avatar_url?: string | null;
        };
      };
      // Organizations
      organizations: {
        Row: {
          id: string;
          name: string;
          type: 'residential' | 'corporate' | 'educational' | 'industrial' | 'healthcare' | 'events';
          logo_url: string | null;
          settings: Record<string, unknown>;
          created_at: string;
        };
        Insert: {
          name: string;
          type: 'residential' | 'corporate' | 'educational' | 'industrial' | 'healthcare' | 'events';
          logo_url?: string | null;
          settings?: Record<string, unknown>;
        };
        Update: {
          name?: string;
          type?: 'residential' | 'corporate' | 'educational' | 'industrial' | 'healthcare' | 'events';
          logo_url?: string | null;
          settings?: Record<string, unknown>;
        };
      };
      // Organization memberships
      memberships: {
        Row: {
          id: string;
          user_id: string;
          organization_id: string;
          role: 'super_admin' | 'admin' | 'resident' | 'guard';
          unit: string | null;
          created_at: string;
        };
        Insert: {
          user_id: string;
          organization_id: string;
          role: 'super_admin' | 'admin' | 'resident' | 'guard';
          unit?: string | null;
        };
        Update: {
          role?: 'super_admin' | 'admin' | 'resident' | 'guard';
          unit?: string | null;
        };
      };
      // Invitations
      invitations: {
        Row: {
          id: string;
          organization_id: string;
          created_by: string;
          visitor_name: string;
          visitor_email: string | null;
          visitor_phone: string | null;
          type: 'single' | 'recurring' | 'temporary';
          status: 'active' | 'used' | 'expired' | 'cancelled';
          valid_from: string;
          valid_until: string;
          short_code: string;
          qr_data: string;
          used_at: string | null;
          created_at: string;
        };
        Insert: {
          organization_id: string;
          created_by: string;
          visitor_name: string;
          visitor_email?: string | null;
          visitor_phone?: string | null;
          type: 'single' | 'recurring' | 'temporary';
          valid_from: string;
          valid_until: string;
        };
        Update: {
          status?: 'active' | 'used' | 'expired' | 'cancelled';
          used_at?: string | null;
        };
      };
      // Access logs
      access_logs: {
        Row: {
          id: string;
          organization_id: string;
          invitation_id: string | null;
          visitor_name: string;
          entry_type: 'invitation' | 'manual' | 'resident';
          direction: 'entry' | 'exit';
          registered_by: string;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          organization_id: string;
          invitation_id?: string | null;
          visitor_name: string;
          entry_type: 'invitation' | 'manual' | 'resident';
          direction: 'entry' | 'exit';
          registered_by: string;
          notes?: string | null;
        };
        Update: {
          notes?: string | null;
        };
      };
    };
  };
};

export default supabase;
