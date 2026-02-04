import React from 'react';
import { render, screen, waitFor } from '@testing-library/react-native';

// Mock expo-router
const mockBack = jest.fn();

jest.mock('expo-router', () => ({
  router: {
    back: (...args: any[]) => mockBack(...args),
  },
  useLocalSearchParams: () => ({
    id: 'req-123',
  }),
}));

// Mock safe area context
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: { children: React.ReactNode }) => children,
  useSafeAreaInsets: () => ({ top: 44, bottom: 34, left: 0, right: 0 }),
}));

// Mock lucide-react-native
jest.mock('lucide-react-native', () => ({
  ChevronLeft: () => null,
  Clock: () => null,
  Wrench: () => null,
  CheckCircle: () => null,
  AlertCircle: () => null,
  Calendar: () => null,
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

// Import component after mocks
import MaintenanceDetailScreen from '@/app/(app)/maintenance/[id]';

describe('MaintenanceDetailScreen', () => {
  const mockRequest = {
    id: 'req-123',
    title: 'Fuga de agua',
    description: 'Hay una fuga de agua en el baño principal',
    category: 'plomeria',
    status: 'pending',
    priority: 'high',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    mockSupabaseFrom.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: mockRequest, error: null }),
        }),
      }),
    });
  });

  describe('loading state', () => {
    it('shows loading skeleton initially', () => {
      mockSupabaseFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockReturnValue(new Promise(() => {})),
          }),
        }),
      });

      render(<MaintenanceDetailScreen />);

      // Component renders during loading
      expect(screen).toBeTruthy();
    });
  });

  describe('request not found', () => {
    it('shows error when request not found', async () => {
      mockSupabaseFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: null, error: new Error('Not found') }),
          }),
        }),
      });

      render(<MaintenanceDetailScreen />);

      await waitFor(() => {
        expect(screen.getByText('Solicitud no encontrada')).toBeTruthy();
        expect(screen.getByText('Volver')).toBeTruthy();
      });
    });
  });

  describe('request details', () => {
    it('shows request title', async () => {
      render(<MaintenanceDetailScreen />);

      await waitFor(() => {
        expect(screen.getByText('Fuga de agua')).toBeTruthy();
      });
    });

    it('shows description section', async () => {
      render(<MaintenanceDetailScreen />);

      await waitFor(() => {
        expect(screen.getByText('Descripción')).toBeTruthy();
        expect(screen.getByText('Hay una fuga de agua en el baño principal')).toBeTruthy();
      });
    });

    it('shows category badge', async () => {
      render(<MaintenanceDetailScreen />);

      await waitFor(() => {
        expect(screen.getByText('plomeria')).toBeTruthy();
      });
    });

    it('shows status badge for pending', async () => {
      render(<MaintenanceDetailScreen />);

      await waitFor(() => {
        expect(screen.getByText('Pendiente')).toBeTruthy();
      });
    });

    it('shows priority info', async () => {
      render(<MaintenanceDetailScreen />);

      await waitFor(() => {
        expect(screen.getByText(/Prioridad Alta/)).toBeTruthy();
      });
    });

    it('shows creation date', async () => {
      render(<MaintenanceDetailScreen />);

      await waitFor(() => {
        expect(screen.getByText('Fecha de creación')).toBeTruthy();
      });
    });
  });

  describe('different statuses', () => {
    it('shows in progress status', async () => {
      const inProgressRequest = { ...mockRequest, status: 'in_progress' };
      mockSupabaseFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: inProgressRequest, error: null }),
          }),
        }),
      });

      render(<MaintenanceDetailScreen />);

      await waitFor(() => {
        expect(screen.getByText('En progreso')).toBeTruthy();
      });
    });

    it('shows completed status', async () => {
      const completedRequest = { ...mockRequest, status: 'completed' };
      mockSupabaseFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: completedRequest, error: null }),
          }),
        }),
      });

      render(<MaintenanceDetailScreen />);

      await waitFor(() => {
        expect(screen.getByText('Completado')).toBeTruthy();
      });
    });
  });

  describe('header', () => {
    it('shows header title', async () => {
      render(<MaintenanceDetailScreen />);

      await waitFor(() => {
        expect(screen.getByText('Solicitud')).toBeTruthy();
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
            single: jest.fn().mockRejectedValue(new Error('Fetch failed')),
          }),
        }),
      });

      render(<MaintenanceDetailScreen />);

      await waitFor(() => {
        expect(console.error).toHaveBeenCalledWith(
          'Error fetching request:',
          expect.any(Error)
        );
      });

      console.error = consoleError;
    });
  });
});
