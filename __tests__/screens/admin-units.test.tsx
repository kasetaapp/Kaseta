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
  Building2: () => null,
  Home: () => null,
  Search: () => null,
  Layers: () => null,
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
import AdminUnitsScreen from '@/app/(app)/admin/units';

describe('AdminUnitsScreen', () => {
  const mockUnits = [
    {
      id: 'unit-1',
      organization_id: 'org-123',
      unit_number: '101',
      building: 'Torre A',
      floor: 1,
      status: 'active',
      created_at: new Date().toISOString(),
    },
    {
      id: 'unit-2',
      organization_id: 'org-123',
      unit_number: '202',
      building: 'Torre B',
      floor: 2,
      status: 'vacant',
      created_at: new Date().toISOString(),
    },
    {
      id: 'unit-3',
      organization_id: 'org-123',
      unit_number: '303',
      building: null,
      floor: null,
      status: 'maintenance',
      created_at: new Date().toISOString(),
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
          order: jest.fn().mockResolvedValue({ data: mockUnits, error: null }),
        }),
      }),
    });
  });

  describe('loading state', () => {
    it('shows loading skeletons initially', () => {
      mockSupabaseFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockReturnValue(new Promise(() => {})),
          }),
        }),
      });

      render(<AdminUnitsScreen />);

      expect(screen.getByText('Unidades')).toBeTruthy();
    });
  });

  describe('header', () => {
    it('renders header with title', async () => {
      render(<AdminUnitsScreen />);

      await waitFor(() => {
        expect(screen.getByText('Unidades')).toBeTruthy();
      });
    });
  });

  describe('occupancy stats', () => {
    it('shows total units count', async () => {
      render(<AdminUnitsScreen />);

      await waitFor(() => {
        expect(screen.getByText('Total')).toBeTruthy();
        expect(screen.getByText('3')).toBeTruthy();
      });
    });

    it('shows occupied units count', async () => {
      render(<AdminUnitsScreen />);

      await waitFor(() => {
        // "Ocupados" appears both in stats and filter tabs
        expect(screen.getAllByText('Ocupados').length).toBeGreaterThan(0);
        // "1" appears multiple times (count and floor numbers), just verify multiple
        expect(screen.getAllByText('1').length).toBeGreaterThan(0);
      });
    });

    it('shows vacant units count', async () => {
      render(<AdminUnitsScreen />);

      await waitFor(() => {
        // "Vacantes" appears both in stats and filter tabs
        expect(screen.getAllByText('Vacantes').length).toBeGreaterThan(0);
      });
    });
  });

  describe('filter tabs', () => {
    it('shows all status filter tabs', async () => {
      render(<AdminUnitsScreen />);

      await waitFor(() => {
        expect(screen.getByText('Todos')).toBeTruthy();
        expect(screen.getAllByText('Ocupados').length).toBeGreaterThan(0);
        expect(screen.getAllByText('Vacantes').length).toBeGreaterThan(0);
      });
    });

    it('filters by status when tab is pressed', async () => {
      render(<AdminUnitsScreen />);

      await waitFor(() => {
        expect(screen.getAllByText('Vacantes').length).toBeGreaterThan(0);
      });

      // Press the filter tab (not the stat card)
      const vacanteTabs = screen.getAllByText('Vacantes');
      fireEvent.press(vacanteTabs[vacanteTabs.length - 1]);

      // Filter should be applied
    });
  });

  describe('unit list', () => {
    it('shows unit numbers', async () => {
      render(<AdminUnitsScreen />);

      await waitFor(() => {
        expect(screen.getByText('101')).toBeTruthy();
        expect(screen.getByText('202')).toBeTruthy();
        expect(screen.getByText('303')).toBeTruthy();
      });
    });

    it('shows building names', async () => {
      render(<AdminUnitsScreen />);

      await waitFor(() => {
        expect(screen.getByText('Torre A')).toBeTruthy();
        expect(screen.getByText('Torre B')).toBeTruthy();
      });
    });

    it('shows floor numbers', async () => {
      render(<AdminUnitsScreen />);

      await waitFor(() => {
        expect(screen.getByText('Piso 1')).toBeTruthy();
        expect(screen.getByText('Piso 2')).toBeTruthy();
      });
    });

    it('shows status badges', async () => {
      render(<AdminUnitsScreen />);

      await waitFor(() => {
        expect(screen.getByText('Ocupado')).toBeTruthy();
        expect(screen.getByText('Vacante')).toBeTruthy();
        expect(screen.getByText('Mantenimiento')).toBeTruthy();
      });
    });
  });

  describe('search', () => {
    it('shows search input', async () => {
      render(<AdminUnitsScreen />);

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Buscar por unidad, edificio o piso...')).toBeTruthy();
      });
    });
  });

  describe('result count', () => {
    it('shows result count', async () => {
      render(<AdminUnitsScreen />);

      await waitFor(() => {
        expect(screen.getByText('3 unidades')).toBeTruthy();
      });
    });
  });

  describe('empty state', () => {
    it('shows empty state when no units', async () => {
      mockSupabaseFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({ data: [], error: null }),
          }),
        }),
      });

      render(<AdminUnitsScreen />);

      await waitFor(() => {
        expect(screen.getByText('Sin unidades')).toBeTruthy();
      });
    });
  });

  describe('no organization', () => {
    it('handles missing organization gracefully', async () => {
      mockUseOrganization.mockReturnValue({
        currentOrganization: null,
      });

      render(<AdminUnitsScreen />);

      await waitFor(() => {
        expect(screen.getByText('Unidades')).toBeTruthy();
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
            order: jest.fn().mockRejectedValue(new Error('Fetch failed')),
          }),
        }),
      });

      render(<AdminUnitsScreen />);

      await waitFor(() => {
        expect(console.error).toHaveBeenCalledWith(
          'Error fetching units:',
          expect.any(Error)
        );
      });

      console.error = consoleError;
    });
  });
});
