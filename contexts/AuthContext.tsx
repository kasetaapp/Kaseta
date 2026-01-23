/**
 * KASETA - Authentication Context
 * Provides auth state and methods throughout the app
 */

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
} from 'react';
import { Session, User, AuthError } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import * as Haptics from 'expo-haptics';

/**
 * User profile data from profiles table
 */
export interface UserProfile {
  id: string;
  email: string | null;
  phone: string | null;
  full_name: string | null;
  avatar_url: string | null;
}

/**
 * Auth context state
 */
interface AuthState {
  session: Session | null;
  user: User | null;
  profile: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isConfigured: boolean;
}

/**
 * Auth context methods
 */
interface AuthMethods {
  signInWithEmail: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signInWithPhone: (phone: string) => Promise<{ error: AuthError | null }>;
  verifyOTP: (phone: string, token: string) => Promise<{ error: AuthError | null }>;
  signUp: (
    email: string,
    password: string,
    metadata?: { full_name?: string; phone?: string }
  ) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<{ error: Error | null }>;
  refreshSession: () => Promise<void>;
}

type AuthContextType = AuthState & AuthMethods;

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Auth Provider component
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isConfigured = isSupabaseConfigured();
  const isAuthenticated = !!session && !!user;

  /**
   * Fetch user profile from database
   */
  const fetchProfile = useCallback(async (userId: string) => {
    if (!isConfigured) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.warn('Error fetching profile:', error);
        return;
      }

      setProfile(data as UserProfile);
    } catch (error) {
      console.warn('Error fetching profile:', error);
    }
  }, [isConfigured]);

  /**
   * Initialize auth state on mount
   */
  useEffect(() => {
    if (!isConfigured) {
      setIsLoading(false);
      return;
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      }
      setIsLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        await fetchProfile(session.user.id);
      } else {
        setProfile(null);
      }

      // Haptic feedback on auth events
      if (event === 'SIGNED_IN') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else if (event === 'SIGNED_OUT') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [isConfigured, fetchProfile]);

  /**
   * Sign in with email and password
   */
  const signInWithEmail = useCallback(
    async (email: string, password: string) => {
      if (!isConfigured) {
        return { error: { message: 'Supabase not configured' } as AuthError };
      }

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }

      return { error };
    },
    [isConfigured]
  );

  /**
   * Sign in with phone (sends OTP)
   */
  const signInWithPhone = useCallback(
    async (phone: string) => {
      if (!isConfigured) {
        return { error: { message: 'Supabase not configured' } as AuthError };
      }

      const { error } = await supabase.auth.signInWithOtp({
        phone,
      });

      if (error) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } else {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }

      return { error };
    },
    [isConfigured]
  );

  /**
   * Verify OTP code
   */
  const verifyOTP = useCallback(
    async (phone: string, token: string) => {
      if (!isConfigured) {
        return { error: { message: 'Supabase not configured' } as AuthError };
      }

      const { error } = await supabase.auth.verifyOtp({
        phone,
        token,
        type: 'sms',
      });

      if (error) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }

      return { error };
    },
    [isConfigured]
  );

  /**
   * Sign up with email and password
   */
  const signUp = useCallback(
    async (
      email: string,
      password: string,
      metadata?: { full_name?: string; phone?: string }
    ) => {
      if (!isConfigured) {
        return { error: { message: 'Supabase not configured' } as AuthError };
      }

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata,
        },
      });

      if (error) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }

      return { error };
    },
    [isConfigured]
  );

  /**
   * Sign out
   */
  const signOut = useCallback(async () => {
    if (!isConfigured) return;

    await supabase.auth.signOut();
    setProfile(null);
  }, [isConfigured]);

  /**
   * Reset password
   */
  const resetPassword = useCallback(
    async (email: string) => {
      if (!isConfigured) {
        return { error: { message: 'Supabase not configured' } as AuthError };
      }

      const { error } = await supabase.auth.resetPasswordForEmail(email);

      if (error) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      return { error };
    },
    [isConfigured]
  );

  /**
   * Update user profile
   */
  const updateProfile = useCallback(
    async (updates: Partial<UserProfile>) => {
      if (!isConfigured || !user) {
        return { error: new Error('Not authenticated') };
      }

      try {
        const { error } = await supabase
          .from('profiles')
          .update(updates)
          .eq('id', user.id);

        if (error) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          return { error };
        }

        // Update local profile state
        setProfile((prev) => (prev ? { ...prev, ...updates } : null));
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

        return { error: null };
      } catch (error) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        return { error: error as Error };
      }
    },
    [isConfigured, user]
  );

  /**
   * Refresh session
   */
  const refreshSession = useCallback(async () => {
    if (!isConfigured) return;

    const { data } = await supabase.auth.refreshSession();
    if (data.session) {
      setSession(data.session);
      setUser(data.session.user);
    }
  }, [isConfigured]);

  const value = useMemo<AuthContextType>(
    () => ({
      session,
      user,
      profile,
      isLoading,
      isAuthenticated,
      isConfigured,
      signInWithEmail,
      signInWithPhone,
      verifyOTP,
      signUp,
      signOut,
      resetPassword,
      updateProfile,
      refreshSession,
    }),
    [
      session,
      user,
      profile,
      isLoading,
      isAuthenticated,
      isConfigured,
      signInWithEmail,
      signInWithPhone,
      verifyOTP,
      signUp,
      signOut,
      resetPassword,
      updateProfile,
      refreshSession,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Hook to access auth context
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
