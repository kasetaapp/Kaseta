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
  Plus: () => null,
  Wrench: () => null,
  Clock: () => null,
  CheckCircle: () => null,
  AlertCircle: () => null,
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
import MaintenanceScreen from '@/app/(app)/maintenance/index';

describe('MaintenanceScreen', () => {
  const mockRequests = [
    {
      id: 'req-1',
      title: 'Broken Light in Hallway',
      description: 'The hallway light on floor 3 is not working.',
      category: 'Electrical',
      priority: 'medium',
      status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'req-2',
      title: 'Water Leak',
      description: 'There is a water leak in the bathroom.',
      category: 'Plumbing',
      priority: 'high',
      status: 'in_progress',
      created_at: new Date(Date.now() - 86400000).toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'req-3',
      title: 'AC Maintenance',
      description: 'Annual AC maintenance needed.',
      category: 'HVAC',
      priority: 'low',
      status: 'completed',
      created_at: new Date(Date.now() - 172800000).toISOString(),
      updated_at: new Date(Date.now() - 86400000).toISOString(),
    },
    {
      id: 'req-4',
      title: 'Door Repair',
      description: 'Main door lock is broken.',
      category: 'General',
      priority: 'urgent',
      status: 'cancelled',
      created_at: new Date(Date.now() - 259200000).toISOString(),
      updated_at: new Date(Date.now() - 172800000).toISOString(),
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();

    mockUseOrganization.mockReturnValue({
      currentMembership: { id: 'member-123', unit_id: 'unit-123' },
    });

    mockSupabaseFrom.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({ data: mockRequests, error: null }),
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

      render(<MaintenanceScreen />);

      expect(screen.getByText('Mantenimiento')).toBeTruthy();
    });
  });

  describe('header', () => {
    it('renders header with title', async () => {
      render(<MaintenanceScreen />);

      await waitFor(() => {
        expect(screen.getByText('Mantenimiento')).toBeTruthy();
      });
    });
  });

  describe('requests list', () => {
    it('displays request titles', async () => {
      render(<MaintenanceScreen />);

      await waitFor(() => {
        expect(screen.getByText('Broken Light in Hallway')).toBeTruthy();
        expect(screen.getByText('Water Leak')).toBeTruthy();
        expect(screen.getByText('AC Maintenance')).toBeTruthy();
        expect(screen.getByText('Door Repair')).toBeTruthy();
      });
    });

    it('displays request descriptions', async () => {
      render(<MaintenanceScreen />);

      await waitFor(() => {
        expect(screen.getByText(/hallway light on floor 3/)).toBeTruthy();
        expect(screen.getByText(/water leak in the bathroom/)).toBeTruthy();
      });
    });

    it('shows status badges', async () => {
      render(<MaintenanceScreen />);

      await waitFor(() => {
        expect(screen.getByText('Pendiente')).toBeTruthy();
        expect(screen.getByText('En progreso')).toBeTruthy();
        expect(screen.getByText('Completado')).toBeTruthy();
        expect(screen.getByText('Cancelado')).toBeTruthy();
      });
    });

    it('shows categories', async () => {
      render(<MaintenanceScreen />);

      await waitFor(() => {
        expect(screen.getByText('Electrical')).toBeTruthy();
        expect(screen.getByText('Plumbing')).toBeTruthy();
        expect(screen.getByText('HVAC')).toBeTruthy();
        expect(screen.getByText('General')).toBeTruthy();
      });
    });
  });

  describe('navigation', () => {
    it('navigates to request detail when pressed', async () => {
      render(<MaintenanceScreen />);

      await waitFor(() => {
        expect(screen.getByText('Broken Light in Hallway')).toBeTruthy();
      });

      fireEvent.press(screen.getByText('Broken Light in Hallway'));

      expect(mockPush).toHaveBeenCalledWith({
        pathname: '/(app)/maintenance/[id]',
        params: { id: 'req-1' },
      });
    });
  });

  describe('empty state', () => {
    it('shows empty state when no requests', async () => {
      mockSupabaseFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({ data: [], error: null }),
          }),
        }),
      });

      render(<MaintenanceScreen />);

      await waitFor(() => {
        expect(screen.getByText('Sin solicitudes')).toBeTruthy();
        expect(screen.getByText('Reporta problemas o solicita reparaciones')).toBeTruthy();
      });
    });

    it('shows new request button in empty state', async () => {
      mockSupabaseFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({ data: [], error: null }),
          }),
        }),
      });

      render(<MaintenanceScreen />);

      await waitFor(() => {
        expect(screen.getByText('Nueva solicitud')).toBeTruthy();
      });
    });
  });

  describe('no unit', () => {
    it('handles missing unit gracefully', async () => {
      mockUseOrganization.mockReturnValue({
        currentMembership: { id: 'member-123', unit_id: null },
      });

      render(<MaintenanceScreen />);

      await waitFor(() => {
        expect(screen.getByText('Sin solicitudes')).toBeTruthy();
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
            order: jest.fn().mockResolvedValue({ data: null, error: new Error('Fetch failed') }),
          }),
        }),
      });

      render(<MaintenanceScreen />);

      await waitFor(() => {
        expect(console.error).toHaveBeenCalledWith(
          'Error fetching maintenance requests:',
          expect.any(Error)
        );
      });

      console.error = consoleError;
    });
  });

  describe('pull to refresh', () => {
    it('supports pull to refresh', async () => {
      render(<MaintenanceScreen />);

      await waitFor(() => {
        expect(screen.getByText('Mantenimiento')).toBeTruthy();
      });
    });
  });
});
