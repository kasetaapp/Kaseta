import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react-native';
import { Text } from 'react-native';
import { AuthProvider, useAuth, UserProfile } from '@/contexts/AuthContext';
import * as Haptics from 'expo-haptics';

// Mock supabase
const mockGetSession = jest.fn();
const mockOnAuthStateChange = jest.fn();
const mockSignInWithPassword = jest.fn();
const mockSignInWithOtp = jest.fn();
const mockVerifyOtp = jest.fn();
const mockSignUp = jest.fn();
const mockSignOut = jest.fn();
const mockResetPasswordForEmail = jest.fn();
const mockRefreshSession = jest.fn();
const mockFrom = jest.fn();
const mockSelect = jest.fn();
const mockEq = jest.fn();
const mockSingle = jest.fn();
const mockUpdate = jest.fn();

jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: () => mockGetSession(),
      onAuthStateChange: (callback: any) => mockOnAuthStateChange(callback),
      signInWithPassword: (params: any) => mockSignInWithPassword(params),
      signInWithOtp: (params: any) => mockSignInWithOtp(params),
      verifyOtp: (params: any) => mockVerifyOtp(params),
      signUp: (params: any) => mockSignUp(params),
      signOut: () => mockSignOut(),
      resetPasswordForEmail: (email: string) => mockResetPasswordForEmail(email),
      refreshSession: () => mockRefreshSession(),
    },
    from: (table: string) => mockFrom(table),
  },
  isSupabaseConfigured: jest.fn(() => true),
}));

// Test component to access auth context
function TestComponent({ testId = 'test' }: { testId?: string }) {
  const auth = useAuth();
  return (
    <>
      <Text testID={`${testId}-loading`}>{auth.isLoading ? 'loading' : 'ready'}</Text>
      <Text testID={`${testId}-authenticated`}>{auth.isAuthenticated ? 'yes' : 'no'}</Text>
      <Text testID={`${testId}-configured`}>{auth.isConfigured ? 'yes' : 'no'}</Text>
      <Text testID={`${testId}-user`}>{auth.user?.id || 'none'}</Text>
      <Text testID={`${testId}-profile`}>{auth.profile?.full_name || 'none'}</Text>
    </>
  );
}

describe('AuthContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Default mock implementations
    mockGetSession.mockResolvedValue({ data: { session: null } });
    mockOnAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: jest.fn() } },
    });
    mockFrom.mockReturnValue({
      select: mockSelect.mockReturnValue({
        eq: mockEq.mockReturnValue({
          single: mockSingle.mockResolvedValue({ data: null, error: null }),
        }),
      }),
      update: mockUpdate.mockReturnValue({
        eq: mockEq.mockResolvedValue({ error: null }),
      }),
    });
  });

  describe('AuthProvider', () => {
    it('renders children correctly', async () => {
      render(
        <AuthProvider>
          <Text testID="child">Child Content</Text>
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('child')).toBeTruthy();
      });
    });

    it('starts with loading state', () => {
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      // Initially loading
      expect(screen.getByTestId('test-loading').props.children).toBe('loading');
    });

    it('sets isLoading to false after initialization', async () => {
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('test-loading').props.children).toBe('ready');
      });
    });

    it('initializes with session from getSession', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' };
      const mockSession = { user: mockUser };

      mockGetSession.mockResolvedValue({ data: { session: mockSession } });
      mockSingle.mockResolvedValue({
        data: { id: 'user-123', full_name: 'Test User' },
        error: null,
      });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('test-user').props.children).toBe('user-123');
      });
    });

    it.skip('fetches profile when session exists', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' };
      const mockSession = { user: mockUser };
      const mockProfile = { id: 'user-123', full_name: 'John Doe' };

      mockGetSession.mockResolvedValue({ data: { session: mockSession } });

      // Reset the mock chain to return the profile
      mockFrom.mockReturnValue({
        select: mockSelect.mockReturnValue({
          eq: mockEq.mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: mockProfile, error: null }),
          }),
        }),
        update: mockUpdate.mockReturnValue({
          eq: mockEq.mockResolvedValue({ error: null }),
        }),
      });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('test-profile').props.children).toBe('John Doe');
      });

      expect(mockFrom).toHaveBeenCalledWith('profiles');
    });

    it('handles auth state changes', async () => {
      let authCallback: any;
      mockOnAuthStateChange.mockImplementation((callback) => {
        authCallback = callback;
        return { data: { subscription: { unsubscribe: jest.fn() } } };
      });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('test-loading').props.children).toBe('ready');
      });

      // Simulate sign in event
      const mockUser = { id: 'new-user', email: 'new@example.com' };
      const mockSession = { user: mockUser };

      await act(async () => {
        authCallback('SIGNED_IN', mockSession);
      });

      expect(Haptics.notificationAsync).toHaveBeenCalledWith(
        Haptics.NotificationFeedbackType.Success
      );
    });

    it('triggers haptic on sign out', async () => {
      let authCallback: any;
      mockOnAuthStateChange.mockImplementation((callback) => {
        authCallback = callback;
        return { data: { subscription: { unsubscribe: jest.fn() } } };
      });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('test-loading').props.children).toBe('ready');
      });

      await act(async () => {
        authCallback('SIGNED_OUT', null);
      });

      expect(Haptics.impactAsync).toHaveBeenCalledWith(
        Haptics.ImpactFeedbackStyle.Medium
      );
    });
  });

  describe('useAuth hook', () => {
    it('throws error when used outside provider', () => {
      const consoleError = console.error;
      console.error = jest.fn();

      expect(() => {
        render(<TestComponent />);
      }).toThrow('useAuth must be used within an AuthProvider');

      console.error = consoleError;
    });
  });

  describe('signInWithEmail', () => {
    it('calls supabase signInWithPassword', async () => {
      mockSignInWithPassword.mockResolvedValue({ error: null });

      let authMethods: any;
      function CaptureAuth() {
        authMethods = useAuth();
        return null;
      }

      render(
        <AuthProvider>
          <CaptureAuth />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(authMethods).toBeDefined();
      });

      await act(async () => {
        await authMethods.signInWithEmail('test@example.com', 'password123');
      });

      expect(mockSignInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
    });

    it('triggers error haptic on failure', async () => {
      mockSignInWithPassword.mockResolvedValue({
        error: { message: 'Invalid credentials' }
      });

      let authMethods: any;
      function CaptureAuth() {
        authMethods = useAuth();
        return null;
      }

      render(
        <AuthProvider>
          <CaptureAuth />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(authMethods).toBeDefined();
      });

      await act(async () => {
        await authMethods.signInWithEmail('test@example.com', 'wrong');
      });

      expect(Haptics.notificationAsync).toHaveBeenCalledWith(
        Haptics.NotificationFeedbackType.Error
      );
    });
  });

  describe('signInWithPhone', () => {
    it('calls supabase signInWithOtp', async () => {
      mockSignInWithOtp.mockResolvedValue({ error: null });

      let authMethods: any;
      function CaptureAuth() {
        authMethods = useAuth();
        return null;
      }

      render(
        <AuthProvider>
          <CaptureAuth />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(authMethods).toBeDefined();
      });

      await act(async () => {
        await authMethods.signInWithPhone('+1234567890');
      });

      expect(mockSignInWithOtp).toHaveBeenCalledWith({
        phone: '+1234567890',
      });
    });

    it('triggers medium haptic on success', async () => {
      mockSignInWithOtp.mockResolvedValue({ error: null });

      let authMethods: any;
      function CaptureAuth() {
        authMethods = useAuth();
        return null;
      }

      render(
        <AuthProvider>
          <CaptureAuth />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(authMethods).toBeDefined();
      });

      await act(async () => {
        await authMethods.signInWithPhone('+1234567890');
      });

      expect(Haptics.impactAsync).toHaveBeenCalledWith(
        Haptics.ImpactFeedbackStyle.Medium
      );
    });
  });

  describe('verifyOTP', () => {
    it('calls supabase verifyOtp with correct params', async () => {
      mockVerifyOtp.mockResolvedValue({ error: null });

      let authMethods: any;
      function CaptureAuth() {
        authMethods = useAuth();
        return null;
      }

      render(
        <AuthProvider>
          <CaptureAuth />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(authMethods).toBeDefined();
      });

      await act(async () => {
        await authMethods.verifyOTP('+1234567890', '123456');
      });

      expect(mockVerifyOtp).toHaveBeenCalledWith({
        phone: '+1234567890',
        token: '123456',
        type: 'sms',
      });
    });
  });

  describe('signUp', () => {
    it('calls supabase signUp with email and password', async () => {
      mockSignUp.mockResolvedValue({ error: null });

      let authMethods: any;
      function CaptureAuth() {
        authMethods = useAuth();
        return null;
      }

      render(
        <AuthProvider>
          <CaptureAuth />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(authMethods).toBeDefined();
      });

      await act(async () => {
        await authMethods.signUp('test@example.com', 'password123');
      });

      expect(mockSignUp).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
        options: { data: undefined },
      });
    });

    it('passes metadata to signUp', async () => {
      mockSignUp.mockResolvedValue({ error: null });

      let authMethods: any;
      function CaptureAuth() {
        authMethods = useAuth();
        return null;
      }

      render(
        <AuthProvider>
          <CaptureAuth />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(authMethods).toBeDefined();
      });

      await act(async () => {
        await authMethods.signUp('test@example.com', 'password123', {
          full_name: 'John Doe',
          phone: '+1234567890',
        });
      });

      expect(mockSignUp).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
        options: {
          data: { full_name: 'John Doe', phone: '+1234567890' },
        },
      });
    });
  });

  describe('signOut', () => {
    it('calls supabase signOut and clears profile', async () => {
      mockSignOut.mockResolvedValue({});

      let authMethods: any;
      function CaptureAuth() {
        authMethods = useAuth();
        return null;
      }

      render(
        <AuthProvider>
          <CaptureAuth />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(authMethods).toBeDefined();
      });

      await act(async () => {
        await authMethods.signOut();
      });

      expect(mockSignOut).toHaveBeenCalled();
    });
  });

  describe('resetPassword', () => {
    it('calls supabase resetPasswordForEmail', async () => {
      mockResetPasswordForEmail.mockResolvedValue({ error: null });

      let authMethods: any;
      function CaptureAuth() {
        authMethods = useAuth();
        return null;
      }

      render(
        <AuthProvider>
          <CaptureAuth />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(authMethods).toBeDefined();
      });

      await act(async () => {
        await authMethods.resetPassword('test@example.com');
      });

      expect(mockResetPasswordForEmail).toHaveBeenCalledWith('test@example.com');
    });

    it('triggers success haptic on success', async () => {
      mockResetPasswordForEmail.mockResolvedValue({ error: null });

      let authMethods: any;
      function CaptureAuth() {
        authMethods = useAuth();
        return null;
      }

      render(
        <AuthProvider>
          <CaptureAuth />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(authMethods).toBeDefined();
      });

      await act(async () => {
        await authMethods.resetPassword('test@example.com');
      });

      expect(Haptics.notificationAsync).toHaveBeenCalledWith(
        Haptics.NotificationFeedbackType.Success
      );
    });
  });

  describe('updateProfile', () => {
    it('updates profile in database', async () => {
      const mockUser = { id: 'user-123' };
      const mockSession = { user: mockUser };

      mockGetSession.mockResolvedValue({ data: { session: mockSession } });
      mockUpdate.mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null }),
      });

      let authMethods: any;
      function CaptureAuth() {
        authMethods = useAuth();
        return null;
      }

      render(
        <AuthProvider>
          <CaptureAuth />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(authMethods?.user).toBeDefined();
      });

      await act(async () => {
        await authMethods.updateProfile({ full_name: 'New Name' });
      });

      expect(mockFrom).toHaveBeenCalledWith('profiles');
    });

    it('returns error when not authenticated', async () => {
      let authMethods: any;
      function CaptureAuth() {
        authMethods = useAuth();
        return null;
      }

      render(
        <AuthProvider>
          <CaptureAuth />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(authMethods).toBeDefined();
      });

      let result: { error: Error | null } | undefined;
      await act(async () => {
        result = await authMethods.updateProfile({ full_name: 'New Name' });
      });

      expect(result?.error).toBeTruthy();
      expect(result?.error?.message).toBe('Not authenticated');
    });
  });

  describe('refreshSession', () => {
    it('refreshes session from supabase', async () => {
      const newSession = { user: { id: 'refreshed-user' } };
      mockRefreshSession.mockResolvedValue({ data: { session: newSession } });

      let authMethods: any;
      function CaptureAuth() {
        authMethods = useAuth();
        return null;
      }

      render(
        <AuthProvider>
          <CaptureAuth />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(authMethods).toBeDefined();
      });

      await act(async () => {
        await authMethods.refreshSession();
      });

      expect(mockRefreshSession).toHaveBeenCalled();
    });
  });

  describe('isConfigured', () => {
    it('reflects supabase configuration status', async () => {
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('test-configured').props.children).toBe('yes');
      });
    });
  });
});
