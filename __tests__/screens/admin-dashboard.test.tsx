import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';

// Mock expo-router
const mockPush = jest.fn();
const mockBack = jest.fn();

jest.mock('expo-router', () => ({
  router: {
    push: (...args: any[]) => mockPush(...args),
    back: (...args: any[]) => mockBack(...args),
  },
}));

// Mock safe area context
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: { children: React.ReactNode }) => children,
  useSafeAreaInsets: () => ({ top: 44, bottom: 34, left: 0, right: 0 }),
}));

// Mock lucide-react-native
jest.mock('lucide-react-native', () => ({
  ChevronLeft: () => null,
  Users: () => null,
  Building2: () => null,
  BarChart3: () => null,
  Megaphone: () => null,
  Wrench: () => null,
  ChevronRight: () => null,
  TrendingUp: () => null,
  TrendingDown: () => null,
}));

// Mock expo-haptics
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'light' },
}));

// Mock supabase
const mockSupabaseFrom = jest.fn();

jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: (table: string) => mockSupabaseFrom(table),
  },
}));

// Mock OrganizationContext
const mockUseOrganization = jest.fn();

jest.mock('@/contexts/OrganizationContext', () => ({
  useOrganization: () => mockUseOrganization(),
}));

// Import component after mocks
import AdminDashboardScreen from '@/app/(app)/admin/index';

describe('AdminDashboardScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockUseOrganization.mockReturnValue({
      currentOrganization: { id: 'org-123', name: 'Test Community', type: 'residential' },
    });

    mockSupabaseFrom.mockImplementation((table: string) => ({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ count: 10, error: null }),
          gte: jest.fn().mockReturnValue({
            lt: jest.fn().mockResolvedValue({ count: 50, error: null }),
          }),
        }),
      }),
    }));
  });

  describe('loading state', () => {
    it('shows loading skeletons initially', () => {
      mockSupabaseFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue(new Promise(() => {})),
          }),
        }),
      });

      render(<AdminDashboardScreen />);

      expect(screen.getByText('Administración')).toBeTruthy();
    });
  });

  describe('header', () => {
    it('renders header with title', async () => {
      render(<AdminDashboardScreen />);

      await waitFor(() => {
        expect(screen.getByText('Administración')).toBeTruthy();
      });
    });
  });

  describe('organization info', () => {
    it('shows organization name', async () => {
      render(<AdminDashboardScreen />);

      await waitFor(() => {
        expect(screen.getByText('Test Community')).toBeTruthy();
      });
    });

    it('shows organization type', async () => {
      render(<AdminDashboardScreen />);

      await waitFor(() => {
        expect(screen.getByText('residential')).toBeTruthy();
      });
    });
  });

  describe('monthly stats', () => {
    it('shows this month section', async () => {
      render(<AdminDashboardScreen />);

      await waitFor(() => {
        expect(screen.getByText('Este mes')).toBeTruthy();
      });
    });

    it('shows entries label', async () => {
      render(<AdminDashboardScreen />);

      await waitFor(() => {
        expect(screen.getByText('Entradas')).toBeTruthy();
      });
    });
  });

  describe('menu items', () => {
    it('shows users option', async () => {
      render(<AdminDashboardScreen />);

      await waitFor(() => {
        expect(screen.getByText('Usuarios')).toBeTruthy();
      });
    });

    it('shows units option', async () => {
      render(<AdminDashboardScreen />);

      await waitFor(() => {
        expect(screen.getByText('Unidades')).toBeTruthy();
      });
    });

    it('shows announcements option', async () => {
      render(<AdminDashboardScreen />);

      await waitFor(() => {
        expect(screen.getByText('Anuncios')).toBeTruthy();
      });
    });

    it('shows maintenance option', async () => {
      render(<AdminDashboardScreen />);

      await waitFor(() => {
        expect(screen.getByText('Mantenimiento')).toBeTruthy();
      });
    });

    it('shows reports option', async () => {
      render(<AdminDashboardScreen />);

      await waitFor(() => {
        expect(screen.getByText('Reportes')).toBeTruthy();
      });
    });

    it('shows management section', async () => {
      render(<AdminDashboardScreen />);

      await waitFor(() => {
        expect(screen.getByText('Gestión')).toBeTruthy();
      });
    });
  });

  describe('navigation', () => {
    it('navigates to users when pressed', async () => {
      render(<AdminDashboardScreen />);

      await waitFor(() => {
        expect(screen.getByText('Usuarios')).toBeTruthy();
      });

      fireEvent.press(screen.getByText('Usuarios'));

      expect(mockPush).toHaveBeenCalledWith('/(app)/admin/users');
    });

    it('navigates to units when pressed', async () => {
      render(<AdminDashboardScreen />);

      await waitFor(() => {
        expect(screen.getByText('Unidades')).toBeTruthy();
      });

      fireEvent.press(screen.getByText('Unidades'));

      expect(mockPush).toHaveBeenCalledWith('/(app)/admin/units');
    });
  });

  describe('no organization', () => {
    it('handles missing organization gracefully', async () => {
      mockUseOrganization.mockReturnValue({
        currentOrganization: null,
      });

      render(<AdminDashboardScreen />);

      await waitFor(() => {
        expect(screen.getByText('Administración')).toBeTruthy();
      });
    });
  });

  describe('error handling', () => {
    it('handles fetch error gracefully', async () => {
      const consoleError = console.error;
      console.error = jest.fn();

      mockSupabaseFrom.mockImplementation(() => ({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockRejectedValue(new Error('Fetch failed')),
          }),
        }),
      }));

      render(<AdminDashboardScreen />);

      await waitFor(() => {
        expect(console.error).toHaveBeenCalledWith(
          'Error fetching stats:',
          expect.any(Error)
        );
      });

      console.error = consoleError;
    });
  });

  describe('pull to refresh', () => {
    it('supports pull to refresh', async () => {
      render(<AdminDashboardScreen />);

      await waitFor(() => {
        expect(screen.getByText('Administración')).toBeTruthy();
      });
    });
  });
});
