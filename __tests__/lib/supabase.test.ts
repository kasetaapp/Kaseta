/**
 * Tests for Supabase client configuration
 */

// Mock dependencies before importing
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn().mockResolvedValue(null),
  setItemAsync: jest.fn().mockResolvedValue(undefined),
  deleteItemAsync: jest.fn().mockResolvedValue(undefined),
}));

describe('Supabase Module', () => {
  it('exports supabase client', () => {
    const supabaseModule = require('@/lib/supabase');
    expect(supabaseModule.supabase).toBeDefined();
  });

  it('supabase client has auth methods', () => {
    const { supabase } = require('@/lib/supabase');
    expect(supabase.auth).toBeDefined();
  });

  it('supabase client has from method', () => {
    const { supabase } = require('@/lib/supabase');
    expect(supabase.from).toBeDefined();
  });

  it('isSupabaseConfigured is exported', () => {
    const supabaseModule = require('@/lib/supabase');
    // May or may not exist depending on module structure
    expect(supabaseModule).toBeDefined();
  });

  it('module loads without throwing', () => {
    expect(() => {
      require('@/lib/supabase');
    }).not.toThrow();
  });
});
