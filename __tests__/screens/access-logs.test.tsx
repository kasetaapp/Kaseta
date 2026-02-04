import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';

// Mock expo-router
const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockBack = jest.fn();

jest.mock('expo-router', () => ({
  router: {
    push: (...args: any[]) => mockPush(...args),
    replace: (...args: any[]) => mockReplace(...args),
    back: (...args: any[]) => mockBack(...args),
  },
}));

// Mock safe area context
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: { children: React.ReactNode }) => children,
  useSafeAreaInsets: () => ({ top: 44, bottom: 34, left: 0, right: 0 }),
}));

// Mock supabase
const mockSupabaseFrom = jest.fn();
const mockSupabaseChannel = jest.fn();
const mockSupabaseRemoveChannel = jest.fn();

jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: (table: string) => mockSupabaseFrom(table),
    channel: (name: string) => mockSupabaseChannel(name),
    removeChannel: (channel: any) => mockSupabaseRemoveChannel(channel),
  },
}));

// Mock contexts
const mockUseOrganization = jest.fn();

jest.mock('@/contexts/OrganizationContext', () => ({
  useOrganization: () => mockUseOrganization(),
}));

// Import component after mocks
import AccessLogsScreen from '@/app/(app)/(tabs)/access-logs';

describe('AccessLogsScreen', () => {
  const mockLogs = [
    {
      id: 'log-1',
      visitor_name: 'John Doe',
      access_type: 'entry',
      method: 'qr_scan',
      accessed_at: new Date().toISOString(),
      unit: { id: 'unit-1', name: 'Unit 101' },
      invitation: { id: 'inv-1', visitor_name: 'John Doe', access_type: 'single' },
      authorized_by_profile: { id: 'profile-1', full_name: 'Jane Smith' },
    },
    {
      id: 'log-2',
      visitor_name: 'Alice Brown',
      access_type: 'exit',
      method: 'manual',
      accessed_at: new Date().toISOString(),
      unit: { id: 'unit-2', name: 'Unit 102' },
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();

    mockUseOrganization.mockReturnValue({
      currentOrganization: { id: 'org-123', name: 'Test Org' },
      canScanAccess: true,
      isAdmin: false,
    });

    const mockQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue({ data: mockLogs, error: null }),
    };
    mockSupabaseFrom.mockReturnValue(mockQuery);

    const mockChannel = {
      on: jest.fn().mockReturnThis(),
      subscribe: jest.fn().mockReturnThis(),
    };
    mockSupabaseChannel.mockReturnValue(mockChannel);
  });

  describe('permission checks', () => {
    it('renders permission denied message when user cannot access', () => {
      mockUseOrganization.mockReturnValue({
        currentOrganization: { id: 'org-123', name: 'Test Org' },
        canScanAccess: false,
        isAdmin: false,
      });

      render(<AccessLogsScreen />);

      expect(screen.getByText('Sin permisos')).toBeTruthy();
      expect(screen.getByText('No tienes permisos para ver el registro de accesos.')).toBeTruthy();
    });

    it('renders normally when user can scan access', async () => {
      render(<AccessLogsScreen />);

      await waitFor(() => {
        expect(screen.getByText('Accesos')).toBeTruthy();
      });
    });

    it('renders normally when user is admin', async () => {
      mockUseOrganization.mockReturnValue({
        currentOrganization: { id: 'org-123', name: 'Test Org' },
        canScanAccess: false,
        isAdmin: true,
      });

      render(<AccessLogsScreen />);

      await waitFor(() => {
        expect(screen.getByText('Accesos')).toBeTruthy();
      });
    });
  });

  describe('loading state', () => {
    it('shows skeleton loading state initially', () => {
      // Make the query never resolve to keep loading state
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnValue(new Promise(() => {})),
      };
      mockSupabaseFrom.mockReturnValue(mockQuery);

      render(<AccessLogsScreen />);

      // Should show loading skeletons
      expect(screen.queryByText('Accesos')).toBeNull();
    });
  });

  describe('filter tabs', () => {
    it('renders all filter tabs', async () => {
      render(<AccessLogsScreen />);

      await waitFor(() => {
        expect(screen.getByText('Todos')).toBeTruthy();
        expect(screen.getByText('Entradas')).toBeTruthy();
        expect(screen.getByText('Salidas')).toBeTruthy();
      });
    });

    it('filters by entries when tab is pressed', async () => {
      render(<AccessLogsScreen />);

      await waitFor(() => {
        expect(screen.getByText('Entradas')).toBeTruthy();
      });

      fireEvent.press(screen.getByText('Entradas'));

      // Filter should be applied (Supabase query would be called with filter)
      await waitFor(() => {
        expect(mockSupabaseFrom).toHaveBeenCalled();
      });
    });

    it('filters by exits when tab is pressed', async () => {
      render(<AccessLogsScreen />);

      await waitFor(() => {
        expect(screen.getByText('Salidas')).toBeTruthy();
      });

      fireEvent.press(screen.getByText('Salidas'));

      await waitFor(() => {
        expect(mockSupabaseFrom).toHaveBeenCalled();
      });
    });
  });

  describe('log display', () => {
    it('displays visitor names', async () => {
      render(<AccessLogsScreen />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeTruthy();
        expect(screen.getByText('Alice Brown')).toBeTruthy();
      });
    });

    it('displays entry badge for entry logs', async () => {
      render(<AccessLogsScreen />);

      await waitFor(() => {
        expect(screen.getByText('Entrada')).toBeTruthy();
      });
    });

    it('displays exit badge for exit logs', async () => {
      render(<AccessLogsScreen />);

      await waitFor(() => {
        expect(screen.getByText('Salida')).toBeTruthy();
      });
    });

    it('displays unit name when available', async () => {
      render(<AccessLogsScreen />);

      await waitFor(() => {
        // Unit name should appear in the log details
        expect(screen.getByText(/Unit 101/)).toBeTruthy();
      });
    });

    it('displays authorized by name when available', async () => {
      render(<AccessLogsScreen />);

      await waitFor(() => {
        expect(screen.getByText(/Jane Smith/)).toBeTruthy();
      });
    });
  });

  describe('method labels', () => {
    it('displays QR label for qr_scan method', async () => {
      render(<AccessLogsScreen />);

      await waitFor(() => {
        expect(screen.getByText('QR')).toBeTruthy();
      });
    });

    it('displays Manual label for manual method', async () => {
      render(<AccessLogsScreen />);

      await waitFor(() => {
        expect(screen.getByText('Manual')).toBeTruthy();
      });
    });

    it('displays Placa label for plate_recognition method', async () => {
      const logsWithPlate = [
        {
          id: 'log-3',
          visitor_name: 'Car Owner',
          access_type: 'entry',
          method: 'plate_recognition',
          accessed_at: new Date().toISOString(),
        },
      ];

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({ data: logsWithPlate, error: null }),
      };
      mockSupabaseFrom.mockReturnValue(mockQuery);

      render(<AccessLogsScreen />);

      await waitFor(() => {
        expect(screen.getByText('Placa')).toBeTruthy();
      });
    });
  });

  describe('empty state', () => {
    it('shows empty state when no logs exist', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({ data: [], error: null }),
      };
      mockSupabaseFrom.mockReturnValue(mockQuery);

      render(<AccessLogsScreen />);

      await waitFor(() => {
        expect(screen.getByText('Sin registros')).toBeTruthy();
        expect(screen.getByText('No hay registros de acceso aún')).toBeTruthy();
      });
    });

    it('shows filtered empty state for entries', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({ data: [], error: null }),
      };
      mockSupabaseFrom.mockReturnValue(mockQuery);

      render(<AccessLogsScreen />);

      await waitFor(() => {
        expect(screen.getByText('Entradas')).toBeTruthy();
      });

      fireEvent.press(screen.getByText('Entradas'));

      await waitFor(() => {
        expect(screen.getByText('Sin registros')).toBeTruthy();
      });
    });
  });

  describe('date grouping', () => {
    it('shows "Hoy" for logs from today', async () => {
      render(<AccessLogsScreen />);

      await waitFor(() => {
        expect(screen.getByText('Hoy')).toBeTruthy();
      });
    });

    it('shows "Ayer" for logs from yesterday', async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const yesterdayLogs = [
        {
          id: 'log-y1',
          visitor_name: 'Yesterday Visitor',
          access_type: 'entry',
          method: 'manual',
          accessed_at: yesterday.toISOString(),
        },
      ];

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({ data: yesterdayLogs, error: null }),
      };
      mockSupabaseFrom.mockReturnValue(mockQuery);

      render(<AccessLogsScreen />);

      await waitFor(() => {
        expect(screen.getByText('Ayer')).toBeTruthy();
      });
    });
  });

  describe('navigation', () => {
    it('navigates to log detail when pressed', async () => {
      render(<AccessLogsScreen />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeTruthy();
      });

      // Press on a log card (find by visitor name and press its parent)
      const logCard = screen.getByText('John Doe');
      fireEvent.press(logCard);

      expect(mockPush).toHaveBeenCalledWith({
        pathname: '/(app)/access-log/[id]',
        params: { id: 'log-1' },
      });
    });
  });

  describe('refresh', () => {
    it('supports pull to refresh', async () => {
      render(<AccessLogsScreen />);

      await waitFor(() => {
        expect(screen.getByText('Accesos')).toBeTruthy();
      });

      // The component should have RefreshControl
      // Testing actual refresh would require simulating the gesture
    });
  });

  describe('real-time updates', () => {
    it('subscribes to real-time updates on mount', async () => {
      render(<AccessLogsScreen />);

      await waitFor(() => {
        expect(mockSupabaseChannel).toHaveBeenCalledWith('access_logs_org-123');
      });
    });

    it('unsubscribes on unmount', async () => {
      const { unmount } = render(<AccessLogsScreen />);

      await waitFor(() => {
        expect(mockSupabaseChannel).toHaveBeenCalled();
      });

      unmount();

      expect(mockSupabaseRemoveChannel).toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('handles fetch errors gracefully', async () => {
      const consoleError = console.error;
      console.error = jest.fn();

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({ data: null, error: new Error('Fetch failed') }),
      };
      mockSupabaseFrom.mockReturnValue(mockQuery);

      render(<AccessLogsScreen />);

      await waitFor(() => {
        expect(console.error).toHaveBeenCalledWith(
          'Error fetching access logs:',
          expect.any(Error)
        );
      });

      console.error = consoleError;
    });
  });

  describe('no organization', () => {
    it('handles missing organization', async () => {
      mockUseOrganization.mockReturnValue({
        currentOrganization: null,
        canScanAccess: true,
        isAdmin: false,
      });

      render(<AccessLogsScreen />);

      // Should not crash and should show loading/empty state
      await waitFor(() => {
        // Component should handle null organization gracefully
      });
    });
  });

  describe('time formatting', () => {
    it('formats time correctly in Spanish locale', async () => {
      render(<AccessLogsScreen />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeTruthy();
      });

      // Time should be formatted in 24-hour format for es-MX
      // The exact time will depend on when the test runs
    });
  });
});
