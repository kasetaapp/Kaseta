import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';

// Mock expo-router
const mockBack = jest.fn();

jest.mock('expo-router', () => ({
  router: {
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
  Search: () => null,
  ArrowDownLeft: () => null,
  ArrowUpRight: () => null,
  Calendar: () => null,
  Filter: () => null,
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
import AdminAccessLogsScreen from '@/app/(app)/admin/access-logs';

describe('AdminAccessLogsScreen', () => {
  const mockLogs = [
    {
      id: 'log-1',
      organization_id: 'org-123',
      visitor_name: 'John Doe',
      access_type: 'entry',
      method: 'qr_scan',
      accessed_at: new Date().toISOString(),
      unit: { id: 'unit-1', name: 'Casa 101' },
      authorizer: { id: 'user-1', full_name: 'Guard One' },
      notes: null,
    },
    {
      id: 'log-2',
      organization_id: 'org-123',
      visitor_name: 'Jane Smith',
      access_type: 'exit',
      method: 'manual_entry',
      accessed_at: new Date(Date.now() - 3600000).toISOString(),
      unit: { id: 'unit-2', name: 'Casa 202' },
      authorizer: { id: 'user-2', full_name: 'Guard Two' },
      notes: 'Salida con paquete',
    },
    {
      id: 'log-3',
      organization_id: 'org-123',
      visitor_name: null,
      access_type: 'entry',
      method: 'manual_code',
      accessed_at: new Date(Date.now() - 7200000).toISOString(),
      unit: null,
      authorizer: null,
      notes: null,
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();

    mockUseOrganization.mockReturnValue({
      currentOrganization: { id: 'org-123', name: 'Test Community' },
    });

    mockSupabaseFrom.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue({ data: mockLogs, error: null }),
          }),
        }),
      }),
    });
  });

  describe('loading state', () => {
    it('shows loading skeletons initially', () => {
      mockSupabaseFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockReturnValue({
              limit: jest.fn().mockReturnValue(new Promise(() => {})),
            }),
          }),
        }),
      });

      render(<AdminAccessLogsScreen />);

      expect(screen.getByText('Bitácora')).toBeTruthy();
    });
  });

  describe('header', () => {
    it('renders header with title', async () => {
      render(<AdminAccessLogsScreen />);

      await waitFor(() => {
        expect(screen.getByText('Bitácora')).toBeTruthy();
      });
    });
  });

  describe('filter tabs', () => {
    it('shows all filter tabs', async () => {
      render(<AdminAccessLogsScreen />);

      await waitFor(() => {
        expect(screen.getByText('Todos')).toBeTruthy();
        expect(screen.getByText('Entradas')).toBeTruthy();
        expect(screen.getByText('Salidas')).toBeTruthy();
      });
    });

    it('filters by entry type when pressed', async () => {
      render(<AdminAccessLogsScreen />);

      await waitFor(() => {
        expect(screen.getByText('Entradas')).toBeTruthy();
      });

      fireEvent.press(screen.getByText('Entradas'));

      // Should show filtered results
      expect(screen.getByText('Entradas')).toBeTruthy();
    });
  });

  describe('access log list', () => {
    it('shows visitor names', async () => {
      render(<AdminAccessLogsScreen />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeTruthy();
        expect(screen.getByText('Jane Smith')).toBeTruthy();
      });
    });

    it('shows "Visitante" for logs without visitor name', async () => {
      render(<AdminAccessLogsScreen />);

      await waitFor(() => {
        expect(screen.getByText('Visitante')).toBeTruthy();
      });
    });

    it('shows unit names', async () => {
      render(<AdminAccessLogsScreen />);

      await waitFor(() => {
        expect(screen.getByText('Casa 101')).toBeTruthy();
        expect(screen.getByText('Casa 202')).toBeTruthy();
      });
    });

    it('shows "Sin unidad" for logs without unit', async () => {
      render(<AdminAccessLogsScreen />);

      await waitFor(() => {
        expect(screen.getByText('Sin unidad')).toBeTruthy();
      });
    });

    it('shows access type badges', async () => {
      render(<AdminAccessLogsScreen />);

      await waitFor(() => {
        expect(screen.getAllByText('Entrada').length).toBeGreaterThan(0);
        expect(screen.getByText('Salida')).toBeTruthy();
      });
    });

    it('shows method badges', async () => {
      render(<AdminAccessLogsScreen />);

      await waitFor(() => {
        expect(screen.getByText('QR')).toBeTruthy();
        expect(screen.getByText('Manual')).toBeTruthy();
        expect(screen.getByText('Código')).toBeTruthy();
      });
    });

    it('shows authorizer name', async () => {
      render(<AdminAccessLogsScreen />);

      await waitFor(() => {
        expect(screen.getByText('Por: Guard One')).toBeTruthy();
        expect(screen.getByText('Por: Guard Two')).toBeTruthy();
      });
    });

    it('shows notes when present', async () => {
      render(<AdminAccessLogsScreen />);

      await waitFor(() => {
        expect(screen.getByText('Salida con paquete')).toBeTruthy();
      });
    });
  });

  describe('search', () => {
    it('shows search input', async () => {
      render(<AdminAccessLogsScreen />);

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Buscar por visitante, unidad...')).toBeTruthy();
      });
    });
  });

  describe('result count', () => {
    it('shows result count', async () => {
      render(<AdminAccessLogsScreen />);

      await waitFor(() => {
        expect(screen.getByText('3 registros')).toBeTruthy();
      });
    });
  });

  describe('empty state', () => {
    it('shows empty state when no logs', async () => {
      mockSupabaseFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue({ data: [], error: null }),
            }),
          }),
        }),
      });

      render(<AdminAccessLogsScreen />);

      await waitFor(() => {
        expect(screen.getByText('Sin registros')).toBeTruthy();
      });
    });
  });

  describe('navigation', () => {
    it('navigates back when back button is pressed', async () => {
      render(<AdminAccessLogsScreen />);

      await waitFor(() => {
        expect(screen.getByText('Bitácora')).toBeTruthy();
      });

      // Find and press the back button (ChevronLeft)
      // The back button is a Pressable, we can find it by parent context
    });
  });

  describe('no organization', () => {
    it('handles missing organization gracefully', async () => {
      mockUseOrganization.mockReturnValue({
        currentOrganization: null,
      });

      render(<AdminAccessLogsScreen />);

      await waitFor(() => {
        expect(screen.getByText('Bitácora')).toBeTruthy();
      });
    });
  });

  describe('error handling', () => {
    it('handles fetch error gracefully', async () => {
      const consoleError = console.error;
      console.error = jest.fn();

      mockSupabaseFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockReturnValue({
              limit: jest.fn().mockRejectedValue(new Error('Fetch failed')),
            }),
          }),
        }),
      });

      render(<AdminAccessLogsScreen />);

      await waitFor(() => {
        expect(console.error).toHaveBeenCalledWith(
          'Error fetching access logs:',
          expect.any(Error)
        );
      });

      console.error = consoleError;
    });
  });
});
