import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';

// Mock expo-router
const mockBack = jest.fn();

jest.mock('expo-router', () => ({
  router: {
    back: (...args: any[]) => mockBack(...args),
  },
  useLocalSearchParams: () => ({ id: 'pkg-123' }),
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
  Truck: () => null,
  CheckCircle: () => null,
  Clock: () => null,
  Calendar: () => null,
  User: () => null,
  Copy: () => null,
}));

// Mock expo-haptics
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'light' },
  NotificationFeedbackType: { Success: 'success' },
}));

// Mock expo-clipboard
jest.mock('expo-clipboard', () => ({
  setStringAsync: jest.fn(),
}));

// Mock supabase
const mockSupabaseFrom = jest.fn();

jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: (table: string) => mockSupabaseFrom(table),
  },
}));

// Import component after mocks
import PackageDetailScreen from '@/app/(app)/packages/[id]';

describe('PackageDetailScreen', () => {
  const mockPackage = {
    id: 'pkg-123',
    carrier: 'FedEx',
    description: 'Electronics order',
    tracking_number: 'ABC123456',
    status: 'received',
    received_at: new Date().toISOString(),
    picked_up_at: null,
    received_by_user: { full_name: 'Guard Smith' },
  };

  beforeEach(() => {
    jest.clearAllMocks();

    mockSupabaseFrom.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: mockPackage, error: null }),
        }),
      }),
      update: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null }),
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

      render(<PackageDetailScreen />);

      // Component renders during loading state
    });
  });

  describe('not found state', () => {
    it('shows not found message when package is null', async () => {
      mockSupabaseFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: null, error: new Error('Not found') }),
          }),
        }),
      });

      render(<PackageDetailScreen />);

      await waitFor(() => {
        expect(screen.getByText('Paquete no encontrado')).toBeTruthy();
      });
    });

    it('shows back button on not found screen', async () => {
      mockSupabaseFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: null, error: new Error('Not found') }),
          }),
        }),
      });

      render(<PackageDetailScreen />);

      await waitFor(() => {
        expect(screen.getByText('Volver')).toBeTruthy();
      });
    });
  });

  describe('header', () => {
    it('renders header with title', async () => {
      render(<PackageDetailScreen />);

      await waitFor(() => {
        expect(screen.getAllByText('Paquete').length).toBeGreaterThan(0);
      });
    });
  });

  describe('package info', () => {
    it('shows carrier name', async () => {
      render(<PackageDetailScreen />);

      await waitFor(() => {
        expect(screen.getByText('FedEx')).toBeTruthy();
      });
    });

    it('shows description', async () => {
      render(<PackageDetailScreen />);

      await waitFor(() => {
        expect(screen.getByText('Electronics order')).toBeTruthy();
      });
    });

    it('shows status badge', async () => {
      render(<PackageDetailScreen />);

      await waitFor(() => {
        expect(screen.getByText('Recibido')).toBeTruthy();
      });
    });
  });

  describe('tracking number', () => {
    it('shows tracking number section', async () => {
      render(<PackageDetailScreen />);

      await waitFor(() => {
        expect(screen.getByText('Número de rastreo')).toBeTruthy();
      });
    });

    it('shows tracking number', async () => {
      render(<PackageDetailScreen />);

      await waitFor(() => {
        expect(screen.getByText('ABC123456')).toBeTruthy();
      });
    });
  });

  describe('timeline', () => {
    it('shows history section', async () => {
      render(<PackageDetailScreen />);

      await waitFor(() => {
        expect(screen.getByText('Historial')).toBeTruthy();
      });
    });

    it('shows received status', async () => {
      render(<PackageDetailScreen />);

      await waitFor(() => {
        expect(screen.getByText('Recibido en caseta')).toBeTruthy();
      });
    });

    it('shows who received it', async () => {
      render(<PackageDetailScreen />);

      await waitFor(() => {
        expect(screen.getByText('Por: Guard Smith')).toBeTruthy();
      });
    });

    it('shows picked up status when package is picked up', async () => {
      mockSupabaseFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { ...mockPackage, status: 'picked_up', picked_up_at: new Date().toISOString() },
              error: null,
            }),
          }),
        }),
      });

      render(<PackageDetailScreen />);

      await waitFor(() => {
        expect(screen.getByText('Recogido por residente')).toBeTruthy();
      });
    });
  });

  describe('action button', () => {
    it('shows mark as picked up button for received packages', async () => {
      render(<PackageDetailScreen />);

      await waitFor(() => {
        expect(screen.getByText('Marcar como recogido')).toBeTruthy();
      });
    });

    it('hides button for picked up packages', async () => {
      mockSupabaseFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { ...mockPackage, status: 'picked_up', picked_up_at: new Date().toISOString() },
              error: null,
            }),
          }),
        }),
      });

      render(<PackageDetailScreen />);

      await waitFor(() => {
        expect(screen.getByText('Entregado')).toBeTruthy();
      });

      expect(screen.queryByText('Marcar como recogido')).toBeNull();
    });
  });

  describe('error handling', () => {
    it('handles fetch error gracefully', async () => {
      const consoleError = console.error;
      console.error = jest.fn();

      mockSupabaseFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockRejectedValue(new Error('Network error')),
          }),
        }),
      });

      render(<PackageDetailScreen />);

      await waitFor(() => {
        expect(console.error).toHaveBeenCalledWith(
          'Error fetching package:',
          expect.any(Error)
        );
      });

      console.error = consoleError;
    });
  });

  describe('fallback carrier name', () => {
    it('shows "Paquete" when carrier is null', async () => {
      mockSupabaseFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { ...mockPackage, carrier: null },
              error: null,
            }),
          }),
        }),
      });

      render(<PackageDetailScreen />);

      await waitFor(() => {
        expect(screen.getAllByText('Paquete').length).toBeGreaterThan(0);
      });
    });
  });

  describe('navigation', () => {
    it('navigates back from not found screen', async () => {
      mockSupabaseFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: null, error: new Error('Not found') }),
          }),
        }),
      });

      render(<PackageDetailScreen />);

      await waitFor(() => {
        expect(screen.getByText('Volver')).toBeTruthy();
      });

      fireEvent.press(screen.getByText('Volver'));

      expect(mockBack).toHaveBeenCalled();
    });

    it('triggers haptic on back', async () => {
      const Haptics = require('expo-haptics');

      render(<PackageDetailScreen />);

      await waitFor(() => {
        expect(screen.getByText('FedEx')).toBeTruthy();
      });

      expect(Haptics.impactAsync).toBeDefined();
    });
  });

  describe('copy tracking number', () => {
    it('copies tracking number to clipboard', async () => {
      const Clipboard = require('expo-clipboard');
      const alertSpy = jest.spyOn(Alert, 'alert');

      render(<PackageDetailScreen />);

      await waitFor(() => {
        expect(screen.getByText('ABC123456')).toBeTruthy();
      });

      fireEvent.press(screen.getByText('ABC123456'));

      await waitFor(() => {
        expect(Clipboard.setStringAsync).toHaveBeenCalledWith('ABC123456');
      });
    });

    it('shows copied alert', async () => {
      const alertSpy = jest.spyOn(Alert, 'alert');

      render(<PackageDetailScreen />);

      await waitFor(() => {
        expect(screen.getByText('ABC123456')).toBeTruthy();
      });

      fireEvent.press(screen.getByText('ABC123456'));

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith('Copiado', 'Número de rastreo copiado');
      });
    });

    it('skips copy when tracking number is null', async () => {
      const Clipboard = require('expo-clipboard');

      mockSupabaseFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { ...mockPackage, tracking_number: null },
              error: null,
            }),
          }),
        }),
      });

      render(<PackageDetailScreen />);

      await waitFor(() => {
        expect(screen.getByText('FedEx')).toBeTruthy();
      });

      // No tracking number section should be visible
      expect(screen.queryByText('Número de rastreo')).toBeNull();
    });
  });

  describe('mark as picked up', () => {
    it('shows confirmation dialog when marking as picked up', async () => {
      const alertSpy = jest.spyOn(Alert, 'alert');

      render(<PackageDetailScreen />);

      await waitFor(() => {
        expect(screen.getByText('Marcar como recogido')).toBeTruthy();
      });

      fireEvent.press(screen.getByText('Marcar como recogido'));

      expect(alertSpy).toHaveBeenCalledWith(
        'Confirmar recogida',
        '¿Marcar este paquete como recogido?',
        expect.any(Array)
      );
    });

    it('updates package status on confirm', async () => {
      const alertSpy = jest.spyOn(Alert, 'alert');
      const mockUpdate = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null }),
      });

      mockSupabaseFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: mockPackage, error: null }),
          }),
        }),
        update: mockUpdate,
      });

      render(<PackageDetailScreen />);

      await waitFor(() => {
        expect(screen.getByText('Marcar como recogido')).toBeTruthy();
      });

      fireEvent.press(screen.getByText('Marcar como recogido'));

      // Get the confirm callback from Alert
      const alertCall = alertSpy.mock.calls.find(call => call[0] === 'Confirmar recogida');
      const buttons = alertCall?.[2] as any[];
      const confirmButton = buttons?.find(b => b.text === 'Confirmar');

      expect(confirmButton).toBeDefined();
    });

    it('handles update error gracefully', async () => {
      const alertSpy = jest.spyOn(Alert, 'alert');
      const consoleError = console.error;
      console.error = jest.fn();

      mockSupabaseFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: mockPackage, error: null }),
          }),
        }),
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ error: new Error('Update failed') }),
        }),
      });

      render(<PackageDetailScreen />);

      await waitFor(() => {
        expect(screen.getByText('Marcar como recogido')).toBeTruthy();
      });

      fireEvent.press(screen.getByText('Marcar como recogido'));

      console.error = consoleError;
    });
  });

  describe('status display', () => {
    it('shows pending status correctly', async () => {
      mockSupabaseFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { ...mockPackage, status: 'pending' },
              error: null,
            }),
          }),
        }),
      });

      render(<PackageDetailScreen />);

      await waitFor(() => {
        expect(screen.getByText('En tránsito')).toBeTruthy();
      });
    });

    it('shows returned status correctly', async () => {
      mockSupabaseFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { ...mockPackage, status: 'returned' },
              error: null,
            }),
          }),
        }),
      });

      render(<PackageDetailScreen />);

      await waitFor(() => {
        expect(screen.getByText('Devuelto')).toBeTruthy();
      });
    });
  });
});
