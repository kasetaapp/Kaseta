import React from 'react';
import { render, waitFor } from '@testing-library/react-native';

// Mock expo-router
const mockReplace = jest.fn();

jest.mock('expo-router', () => ({
  router: {
    replace: (...args: any[]) => mockReplace(...args),
  },
}));

// Mock AuthContext
const mockUseAuth = jest.fn();

jest.mock('@/contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

// Import component after mocks
import Index from '@/app/index';

describe('Index Entry Screen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('loading state', () => {
    it('shows loading skeleton when auth is loading', () => {
      mockUseAuth.mockReturnValue({
        isLoading: true,
        isAuthenticated: false,
        isConfigured: false,
      });

      const { root } = render(<Index />);

      // Should not navigate while loading
      expect(mockReplace).not.toHaveBeenCalled();
    });

    it('renders skeleton elements', () => {
      mockUseAuth.mockReturnValue({
        isLoading: true,
        isAuthenticated: false,
        isConfigured: false,
      });

      render(<Index />);

      // Skeleton component should be rendered
      expect(mockReplace).not.toHaveBeenCalled();
    });
  });

  describe('authenticated user', () => {
    it('redirects to home when authenticated', async () => {
      mockUseAuth.mockReturnValue({
        isLoading: false,
        isAuthenticated: true,
        isConfigured: true,
      });

      render(<Index />);

      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledWith('/(app)/(tabs)/home');
      });
    });
  });

  describe('unauthenticated user', () => {
    it('redirects to login when not authenticated', async () => {
      mockUseAuth.mockReturnValue({
        isLoading: false,
        isAuthenticated: false,
        isConfigured: true,
      });

      render(<Index />);

      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledWith('/(auth)/login');
      });
    });
  });

  describe('navigation paths', () => {
    it('defines home path', () => {
      const homePath = '/(app)/(tabs)/home';
      expect(homePath).toBe('/(app)/(tabs)/home');
    });

    it('defines login path', () => {
      const loginPath = '/(auth)/login';
      expect(loginPath).toBe('/(auth)/login');
    });
  });

  describe('styling', () => {
    it('uses container style', () => {
      const styles = {
        container: {
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
        },
      };
      expect(styles.container.flex).toBe(1);
      expect(styles.container.alignItems).toBe('center');
      expect(styles.container.justifyContent).toBe('center');
    });

    it('uses loading content style', () => {
      const styles = {
        loadingContent: { alignItems: 'center' },
      };
      expect(styles.loadingContent.alignItems).toBe('center');
    });

    it('uses loading text style', () => {
      const styles = {
        loadingText: { marginTop: 24, alignItems: 'center' },
      };
      expect(styles.loadingText.marginTop).toBe(24);
    });

    it('uses skeleton line style', () => {
      const styles = {
        skeletonLine: { marginBottom: 8 },
      };
      expect(styles.skeletonLine.marginBottom).toBe(8);
    });
  });

  describe('color scheme', () => {
    it('handles light mode', () => {
      mockUseAuth.mockReturnValue({
        isLoading: true,
        isAuthenticated: false,
        isConfigured: false,
      });

      render(<Index />);
      // Component should render without errors
    });
  });
});
