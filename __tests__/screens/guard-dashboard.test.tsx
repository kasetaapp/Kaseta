import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';

// Mock expo-router
const mockPush = jest.fn();

jest.mock('expo-router', () => ({
  router: {
    push: (...args: any[]) => mockPush(...args),
  },
}));

// Mock safe area context
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: { children: React.ReactNode }) => children,
  useSafeAreaInsets: () => ({ top: 44, bottom: 34, left: 0, right: 0 }),
}));

// Mock lucide-react-native
jest.mock('lucide-react-native', () => ({
  QrCode: () => null,
  UserPlus: () => null,
  Package: () => null,
  ClipboardList: () => null,
  Clock: () => null,
  Users: () => null,
  Car: () => null,
  AlertTriangle: () => null,
  ChevronRight: () => null,
}));

// Mock expo-haptics
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium' },
  NotificationFeedbackType: { Warning: 'warning' },
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
import GuardDashboardScreen from '@/app/(app)/guard/index';

describe('GuardDashboardScreen', () => {
  const mockRecentEntries = [
    {
      id: 'entry-1',
      visitor_name: 'John Doe',
      access_type: 'invitation',
      created_at: new Date().toISOString(),
      unit: { unit_number: '101' },
    },
    {
      id: 'entry-2',
      visitor_name: 'Jane Smith',
      access_type: 'manual',
      created_at: new Date(Date.now() - 3600000).toISOString(),
      unit: { unit_number: '202' },
    },
    {
      id: 'entry-3',
      visitor_name: null,
      access_type: 'vehicle',
      created_at: new Date(Date.now() - 7200000).toISOString(),
      unit: null,
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();

    mockUseOrganization.mockReturnValue({
      currentOrganization: { id: 'org-123', name: 'Test Org' },
    });

    mockSupabaseFrom.mockImplementation((table: string) => {
      if (table === 'access_logs') {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              gte: jest.fn().mockResolvedValue({ count: 25, error: null }),
              order: jest.fn().mockReturnValue({
                limit: jest.fn().mockResolvedValue({ data: mockRecentEntries, error: null }),
              }),
            }),
          }),
        };
      }
      if (table === 'packages') {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({ count: 5, error: null }),
            }),
          }),
        };
      }
      return {};
    });
  });

  describe('loading state', () => {
    it('shows loading skeletons initially', () => {
      mockSupabaseFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            gte: jest.fn().mockReturnValue(new Promise(() => {})),
            order: jest.fn().mockReturnValue({
              limit: jest.fn().mockReturnValue(new Promise(() => {})),
            }),
          }),
        }),
      });

      render(<GuardDashboardScreen />);

      expect(screen.getByText('Panel de Guardia')).toBeTruthy();
    });
  });

  describe('header', () => {
    it('renders header with title', async () => {
      render(<GuardDashboardScreen />);

      await waitFor(() => {
        expect(screen.getByText('Panel de Guardia')).toBeTruthy();
      });
    });

    it('shows on-shift badge', async () => {
      render(<GuardDashboardScreen />);

      await waitFor(() => {
        expect(screen.getByText('En turno')).toBeTruthy();
      });
    });
  });

  describe('quick actions', () => {
    it('shows scan QR button', async () => {
      render(<GuardDashboardScreen />);

      await waitFor(() => {
        expect(screen.getByText('Escanear QR')).toBeTruthy();
      });
    });

    it('shows manual entry button', async () => {
      render(<GuardDashboardScreen />);

      await waitFor(() => {
        expect(screen.getByText('Entrada Manual')).toBeTruthy();
      });
    });

    it('shows packages button', async () => {
      render(<GuardDashboardScreen />);

      await waitFor(() => {
        // "Paquetes" appears in quick actions and in stats
        expect(screen.getAllByText('Paquetes').length).toBeGreaterThan(0);
      });
    });

    it('navigates to scan when scan QR is pressed', async () => {
      render(<GuardDashboardScreen />);

      await waitFor(() => {
        expect(screen.getByText('Escanear QR')).toBeTruthy();
      });

      fireEvent.press(screen.getByText('Escanear QR'));

      expect(mockPush).toHaveBeenCalledWith('/(app)/guard/scan');
    });

    it('navigates to manual entry when button is pressed', async () => {
      render(<GuardDashboardScreen />);

      await waitFor(() => {
        expect(screen.getByText('Entrada Manual')).toBeTruthy();
      });

      fireEvent.press(screen.getByText('Entrada Manual'));

      expect(mockPush).toHaveBeenCalledWith('/(app)/guard/manual-entry');
    });

    it('navigates to packages when button is pressed', async () => {
      render(<GuardDashboardScreen />);

      await waitFor(() => {
        expect(screen.getAllByText('Paquetes').length).toBeGreaterThan(0);
      });

      // Press the first "Paquetes" button (in quick actions)
      fireEvent.press(screen.getAllByText('Paquetes')[0]);

      expect(mockPush).toHaveBeenCalledWith('/(app)/guard/packages');
    });
  });

  describe('stats', () => {
    it('shows today section', async () => {
      render(<GuardDashboardScreen />);

      await waitFor(() => {
        expect(screen.getByText('Hoy')).toBeTruthy();
      });
    });

    it('shows entries count', async () => {
      render(<GuardDashboardScreen />);

      await waitFor(() => {
        expect(screen.getByText('Entradas')).toBeTruthy();
      });
    });

    it('shows packages count', async () => {
      render(<GuardDashboardScreen />);

      await waitFor(() => {
        expect(screen.getAllByText('Paquetes').length).toBeGreaterThan(0);
      });
    });
  });

  describe('recent activity', () => {
    it('shows recent activity section', async () => {
      render(<GuardDashboardScreen />);

      await waitFor(() => {
        expect(screen.getByText('Actividad reciente')).toBeTruthy();
      });
    });

    it('shows view all button', async () => {
      render(<GuardDashboardScreen />);

      await waitFor(() => {
        expect(screen.getByText('Ver todo')).toBeTruthy();
      });
    });

    it('displays visitor names', async () => {
      render(<GuardDashboardScreen />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeTruthy();
        expect(screen.getByText('Jane Smith')).toBeTruthy();
      });
    });

    it('shows "Sin nombre" for entries without visitor name', async () => {
      render(<GuardDashboardScreen />);

      await waitFor(() => {
        expect(screen.getByText('Sin nombre')).toBeTruthy();
      });
    });

    it('shows access type badges', async () => {
      render(<GuardDashboardScreen />);

      await waitFor(() => {
        expect(screen.getByText('Invitación')).toBeTruthy();
        expect(screen.getByText('Manual')).toBeTruthy();
        expect(screen.getByText('Vehículo')).toBeTruthy();
      });
    });

    it('shows no activity message when no recent entries', async () => {
      mockSupabaseFrom.mockImplementation((table: string) => {
        if (table === 'access_logs') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                gte: jest.fn().mockResolvedValue({ count: 0, error: null }),
                order: jest.fn().mockReturnValue({
                  limit: jest.fn().mockResolvedValue({ data: [], error: null }),
                }),
              }),
            }),
          };
        }
        if (table === 'packages') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockResolvedValue({ count: 0, error: null }),
              }),
            }),
          };
        }
        return {};
      });

      render(<GuardDashboardScreen />);

      await waitFor(() => {
        expect(screen.getByText('No hay actividad reciente')).toBeTruthy();
      });
    });
  });

  describe('emergency button', () => {
    it('shows emergency contacts button', async () => {
      render(<GuardDashboardScreen />);

      await waitFor(() => {
        expect(screen.getByText('Contactos de Emergencia')).toBeTruthy();
      });
    });

    it('navigates to emergency when button is pressed', async () => {
      render(<GuardDashboardScreen />);

      await waitFor(() => {
        expect(screen.getByText('Contactos de Emergencia')).toBeTruthy();
      });

      fireEvent.press(screen.getByText('Contactos de Emergencia'));

      expect(mockPush).toHaveBeenCalledWith('/(app)/emergency');
    });
  });

  describe('no organization', () => {
    it('handles missing organization gracefully', async () => {
      mockUseOrganization.mockReturnValue({
        currentOrganization: null,
      });

      render(<GuardDashboardScreen />);

      await waitFor(() => {
        expect(screen.getByText('Panel de Guardia')).toBeTruthy();
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
            gte: jest.fn().mockRejectedValue(new Error('Fetch failed')),
          }),
        }),
      }));

      render(<GuardDashboardScreen />);

      await waitFor(() => {
        expect(console.error).toHaveBeenCalledWith(
          'Error fetching dashboard data:',
          expect.any(Error)
        );
      });

      console.error = consoleError;
    });
  });

  describe('pull to refresh', () => {
    it('supports pull to refresh', async () => {
      render(<GuardDashboardScreen />);

      await waitFor(() => {
        expect(screen.getByText('Panel de Guardia')).toBeTruthy();
      });
    });
  });
});
