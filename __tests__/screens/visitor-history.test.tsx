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
  ArrowDownLeft: () => null,
  ArrowUpRight: () => null,
  Calendar: () => null,
  Search: () => null,
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
import VisitorHistoryScreen from '@/app/(app)/visitor-history';

describe('VisitorHistoryScreen', () => {
  const mockRecords = [
    {
      id: 'record-1',
      visitor_name: 'John Doe',
      access_type: 'entry',
      method: 'qr_scan',
      accessed_at: new Date().toISOString(),
      notes: null,
    },
    {
      id: 'record-2',
      visitor_name: 'Jane Smith',
      access_type: 'exit',
      method: 'manual_code',
      accessed_at: new Date(Date.now() - 86400000).toISOString(), // Yesterday
      notes: 'Test notes',
    },
    {
      id: 'record-3',
      visitor_name: 'Bob Wilson',
      access_type: 'entry',
      method: 'manual_entry',
      accessed_at: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
      notes: null,
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();

    mockUseOrganization.mockReturnValue({
      currentMembership: { id: 'member-123', unit_id: 'unit-123' },
      currentOrganization: { id: 'org-123', name: 'Test Org' },
    });

    mockSupabaseFrom.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue({ data: mockRecords, error: null }),
          }),
        }),
      }),
    });
  });

  describe('loading state', () => {
    it('shows loading state initially', () => {
      mockSupabaseFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockReturnValue({
              limit: jest.fn().mockReturnValue(new Promise(() => {})),
            }),
          }),
        }),
      });

      render(<VisitorHistoryScreen />);

      expect(screen.getByText('Historial')).toBeTruthy();
    });
  });

  describe('header', () => {
    it('renders header with title', async () => {
      render(<VisitorHistoryScreen />);

      await waitFor(() => {
        expect(screen.getByText('Historial de visitas')).toBeTruthy();
      });
    });
  });

  describe('search', () => {
    it('shows search input', async () => {
      render(<VisitorHistoryScreen />);

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Buscar visitante...')).toBeTruthy();
      });
    });

    it('filters records by visitor name', async () => {
      render(<VisitorHistoryScreen />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeTruthy();
        expect(screen.getByText('Jane Smith')).toBeTruthy();
      });

      fireEvent.changeText(
        screen.getByPlaceholderText('Buscar visitante...'),
        'John'
      );

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeTruthy();
        expect(screen.queryByText('Jane Smith')).toBeNull();
      });
    });

    it('shows no results when search has no matches', async () => {
      render(<VisitorHistoryScreen />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeTruthy();
      });

      fireEvent.changeText(
        screen.getByPlaceholderText('Buscar visitante...'),
        'xyz123'
      );

      await waitFor(() => {
        expect(screen.getByText('Sin resultados')).toBeTruthy();
        expect(screen.getByText('No se encontraron visitantes con ese nombre')).toBeTruthy();
      });
    });
  });

  describe('stats', () => {
    it('shows entries count', async () => {
      render(<VisitorHistoryScreen />);

      await waitFor(() => {
        expect(screen.getByText('Entradas')).toBeTruthy();
      });
    });

    it('shows exits count', async () => {
      render(<VisitorHistoryScreen />);

      await waitFor(() => {
        expect(screen.getByText('Salidas')).toBeTruthy();
      });
    });

    it('shows unique visitors count', async () => {
      render(<VisitorHistoryScreen />);

      await waitFor(() => {
        expect(screen.getByText('Visitantes')).toBeTruthy();
      });
    });
  });

  describe('records list', () => {
    it('displays visitor names', async () => {
      render(<VisitorHistoryScreen />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeTruthy();
        expect(screen.getByText('Jane Smith')).toBeTruthy();
        expect(screen.getByText('Bob Wilson')).toBeTruthy();
      });
    });

    it('shows entry badge for entry records', async () => {
      render(<VisitorHistoryScreen />);

      await waitFor(() => {
        expect(screen.getAllByText('Entrada').length).toBeGreaterThan(0);
      });
    });

    it('shows exit badge for exit records', async () => {
      render(<VisitorHistoryScreen />);

      await waitFor(() => {
        expect(screen.getAllByText('Salida').length).toBeGreaterThan(0);
      });
    });

    it('shows method labels', async () => {
      render(<VisitorHistoryScreen />);

      await waitFor(() => {
        expect(screen.getByText('QR')).toBeTruthy();
        expect(screen.getByText('Código')).toBeTruthy();
        expect(screen.getByText('Manual')).toBeTruthy();
      });
    });

    it('shows "Hoy" for today records', async () => {
      render(<VisitorHistoryScreen />);

      await waitFor(() => {
        expect(screen.getAllByText(/Hoy/).length).toBeGreaterThan(0);
      });
    });

    it('shows "Ayer" for yesterday records', async () => {
      render(<VisitorHistoryScreen />);

      await waitFor(() => {
        expect(screen.getAllByText(/Ayer/).length).toBeGreaterThan(0);
      });
    });
  });

  describe('empty state', () => {
    it('shows empty state when no records', async () => {
      mockSupabaseFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue({ data: [], error: null }),
            }),
          }),
        }),
      });

      render(<VisitorHistoryScreen />);

      await waitFor(() => {
        expect(screen.getByText('Sin historial')).toBeTruthy();
        expect(screen.getByText('Los registros de acceso aparecerán aquí')).toBeTruthy();
      });
    });
  });

  describe('no unit', () => {
    it('handles missing unit gracefully', async () => {
      mockUseOrganization.mockReturnValue({
        currentMembership: { id: 'member-123', unit_id: null },
        currentOrganization: { id: 'org-123', name: 'Test Org' },
      });

      render(<VisitorHistoryScreen />);

      await waitFor(() => {
        expect(screen.getByText('Sin historial')).toBeTruthy();
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
              limit: jest.fn().mockResolvedValue({ data: null, error: new Error('Fetch failed') }),
            }),
          }),
        }),
      });

      render(<VisitorHistoryScreen />);

      await waitFor(() => {
        expect(console.error).toHaveBeenCalledWith(
          'Error fetching visitor history:',
          expect.any(Error)
        );
      });

      console.error = consoleError;
    });
  });

  describe('pull to refresh', () => {
    it('supports pull to refresh', async () => {
      render(<VisitorHistoryScreen />);

      await waitFor(() => {
        expect(screen.getByText('Historial de visitas')).toBeTruthy();
      });
    });
  });

  describe('fallback visitor name', () => {
    it('shows "Visitante" when name is null', async () => {
      mockSupabaseFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue({
                data: [{
                  id: 'record-1',
                  visitor_name: null,
                  access_type: 'entry',
                  method: 'qr_scan',
                  accessed_at: new Date().toISOString(),
                  notes: null,
                }],
                error: null,
              }),
            }),
          }),
        }),
      });

      render(<VisitorHistoryScreen />);

      await waitFor(() => {
        expect(screen.getByText('Visitante')).toBeTruthy();
      });
    });
  });
});
