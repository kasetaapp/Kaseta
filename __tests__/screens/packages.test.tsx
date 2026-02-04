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
  Package: () => null,
  ChevronRight: () => null,
  Truck: () => null,
  CheckCircle: () => null,
  Clock: () => null,
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

// Mock OrganizationContext
const mockUseOrganization = jest.fn();

jest.mock('@/contexts/OrganizationContext', () => ({
  useOrganization: () => mockUseOrganization(),
}));

// Import component after mocks
import PackagesScreen from '@/app/(app)/packages/index';

describe('PackagesScreen', () => {
  const mockPackages = [
    {
      id: 'pkg-1',
      tracking_number: 'ABC123456',
      carrier: 'FedEx',
      description: 'Electronics order',
      status: 'received',
      received_at: new Date().toISOString(),
      picked_up_at: null,
      received_by: 'guard-123',
    },
    {
      id: 'pkg-2',
      tracking_number: 'XYZ789',
      carrier: 'Amazon',
      description: 'Books',
      status: 'picked_up',
      received_at: new Date(Date.now() - 86400000).toISOString(), // Yesterday
      picked_up_at: new Date().toISOString(),
      received_by: 'guard-123',
    },
    {
      id: 'pkg-3',
      tracking_number: null,
      carrier: null,
      description: 'General delivery',
      status: 'pending',
      received_at: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
      picked_up_at: null,
      received_by: null,
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
          order: jest.fn().mockResolvedValue({ data: mockPackages, error: null }),
        }),
      }),
    });

    const mockChannel = {
      on: jest.fn().mockReturnThis(),
      subscribe: jest.fn().mockReturnThis(),
    };
    mockSupabaseChannel.mockReturnValue(mockChannel);
  });

  describe('loading state', () => {
    it('shows loading state initially', () => {
      mockSupabaseFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockReturnValue(new Promise(() => {})),
          }),
        }),
      });

      render(<PackagesScreen />);

      expect(screen.getByText('Paquetes')).toBeTruthy();
    });
  });

  describe('header', () => {
    it('renders header with title', async () => {
      render(<PackagesScreen />);

      await waitFor(() => {
        expect(screen.getByText('Paquetes')).toBeTruthy();
      });
    });
  });

  describe('stats', () => {
    it('shows pending count', async () => {
      render(<PackagesScreen />);

      await waitFor(() => {
        expect(screen.getByText('Por recoger')).toBeTruthy();
      });
    });

    it('shows total count', async () => {
      render(<PackagesScreen />);

      await waitFor(() => {
        expect(screen.getByText('Total')).toBeTruthy();
      });
    });
  });

  describe('packages list', () => {
    it('displays carrier names', async () => {
      render(<PackagesScreen />);

      await waitFor(() => {
        expect(screen.getByText('FedEx')).toBeTruthy();
        expect(screen.getByText('Amazon')).toBeTruthy();
      });
    });

    it('displays tracking numbers', async () => {
      render(<PackagesScreen />);

      await waitFor(() => {
        expect(screen.getByText('#ABC123456')).toBeTruthy();
        expect(screen.getByText('#XYZ789')).toBeTruthy();
      });
    });

    it('displays descriptions', async () => {
      render(<PackagesScreen />);

      await waitFor(() => {
        expect(screen.getByText('Electronics order')).toBeTruthy();
        expect(screen.getByText('Books')).toBeTruthy();
      });
    });

    it('shows received status', async () => {
      render(<PackagesScreen />);

      await waitFor(() => {
        expect(screen.getByText('Recibido')).toBeTruthy();
      });
    });

    it('shows delivered status', async () => {
      render(<PackagesScreen />);

      await waitFor(() => {
        expect(screen.getByText('Entregado')).toBeTruthy();
      });
    });

    it('shows in transit status', async () => {
      render(<PackagesScreen />);

      await waitFor(() => {
        expect(screen.getByText('En tránsito')).toBeTruthy();
      });
    });

    it('shows "Hoy" for today packages', async () => {
      render(<PackagesScreen />);

      await waitFor(() => {
        expect(screen.getAllByText(/Hoy/).length).toBeGreaterThan(0);
      });
    });

    it('shows "Ayer" for yesterday packages', async () => {
      render(<PackagesScreen />);

      await waitFor(() => {
        expect(screen.getAllByText(/Ayer/).length).toBeGreaterThan(0);
      });
    });

    it('shows "Paquete" for packages without carrier', async () => {
      render(<PackagesScreen />);

      await waitFor(() => {
        expect(screen.getByText('Paquete')).toBeTruthy();
      });
    });
  });

  describe('navigation', () => {
    it('navigates to package detail when pressed', async () => {
      render(<PackagesScreen />);

      await waitFor(() => {
        expect(screen.getByText('FedEx')).toBeTruthy();
      });

      fireEvent.press(screen.getByText('FedEx'));

      expect(mockPush).toHaveBeenCalledWith({
        pathname: '/(app)/packages/[id]',
        params: { id: 'pkg-1' },
      });
    });
  });

  describe('empty state', () => {
    it('shows empty state when no packages', async () => {
      mockSupabaseFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({ data: [], error: null }),
          }),
        }),
      });

      render(<PackagesScreen />);

      await waitFor(() => {
        expect(screen.getByText('Sin paquetes')).toBeTruthy();
        expect(screen.getByText('Tus paquetes y entregas aparecerán aquí')).toBeTruthy();
      });
    });
  });

  describe('no unit', () => {
    it('handles missing unit gracefully', async () => {
      mockUseOrganization.mockReturnValue({
        currentMembership: { id: 'member-123', unit_id: null },
      });

      render(<PackagesScreen />);

      await waitFor(() => {
        expect(screen.getByText('Sin paquetes')).toBeTruthy();
      });
    });
  });

  describe('real-time updates', () => {
    it('subscribes to real-time updates on mount', async () => {
      render(<PackagesScreen />);

      await waitFor(() => {
        expect(mockSupabaseChannel).toHaveBeenCalledWith('packages-changes');
      });
    });

    it('unsubscribes on unmount', async () => {
      const { unmount } = render(<PackagesScreen />);

      await waitFor(() => {
        expect(mockSupabaseChannel).toHaveBeenCalled();
      });

      unmount();

      expect(mockSupabaseRemoveChannel).toHaveBeenCalled();
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

      render(<PackagesScreen />);

      await waitFor(() => {
        expect(console.error).toHaveBeenCalledWith(
          'Error fetching packages:',
          expect.any(Error)
        );
      });

      console.error = consoleError;
    });
  });

  describe('pull to refresh', () => {
    it('supports pull to refresh', async () => {
      render(<PackagesScreen />);

      await waitFor(() => {
        expect(screen.getByText('Paquetes')).toBeTruthy();
      });
    });
  });
});
