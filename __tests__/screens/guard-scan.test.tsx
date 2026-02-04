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
  X: () => null,
  Flashlight: () => null,
  FlashlightOff: () => null,
  CheckCircle: () => null,
  XCircle: () => null,
}));

// Mock expo-camera
const mockUseCameraPermissions = jest.fn();
let mockOnBarcodeScanned: ((data: { data: string }) => void) | null = null;

jest.mock('expo-camera', () => ({
  CameraView: ({ children, onBarcodeScanned }: { children?: React.ReactNode; onBarcodeScanned?: (data: { data: string }) => void }) => {
    const View = require('react-native').View;
    mockOnBarcodeScanned = onBarcodeScanned || null;
    return <View testID="camera-view">{children}</View>;
  },
  useCameraPermissions: () => mockUseCameraPermissions(),
}));

// Mock expo-haptics
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium' },
  NotificationFeedbackType: { Success: 'success' },
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

// Mock AuthContext
jest.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'user-123' },
  }),
}));

// Import component after mocks
import GuardScanScreen from '@/app/(app)/guard/scan';

describe('GuardScanScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockUseOrganization.mockReturnValue({
      currentOrganization: { id: 'org-123', name: 'Test Community' },
    });

    mockUseCameraPermissions.mockReturnValue([
      { granted: true },
      jest.fn(),
    ]);
  });

  describe('permission not loaded', () => {
    it('shows loading message when permission is null', () => {
      mockUseCameraPermissions.mockReturnValue([null, jest.fn()]);

      render(<GuardScanScreen />);

      expect(screen.getByText('Cargando cámara...')).toBeTruthy();
    });
  });

  describe('permission not granted', () => {
    it('shows permission request screen', () => {
      mockUseCameraPermissions.mockReturnValue([
        { granted: false },
        jest.fn(),
      ]);

      render(<GuardScanScreen />);

      expect(screen.getByText('Permiso de cámara requerido')).toBeTruthy();
      expect(screen.getByText('Necesitamos acceso a la cámara para escanear códigos QR')).toBeTruthy();
      expect(screen.getByText('Permitir cámara')).toBeTruthy();
    });

    it('requests permission when button is pressed', () => {
      const mockRequestPermission = jest.fn();
      mockUseCameraPermissions.mockReturnValue([
        { granted: false },
        mockRequestPermission,
      ]);

      render(<GuardScanScreen />);

      fireEvent.press(screen.getByText('Permitir cámara'));

      expect(mockRequestPermission).toHaveBeenCalled();
    });
  });

  describe('camera view', () => {
    it('renders scan screen with title', () => {
      render(<GuardScanScreen />);

      expect(screen.getByText('Escanear QR')).toBeTruthy();
    });

    it('shows scan instruction', () => {
      render(<GuardScanScreen />);

      expect(screen.getByText('Apunta al código QR de la invitación')).toBeTruthy();
    });

    it('renders camera view', () => {
      render(<GuardScanScreen />);

      expect(screen.getByTestId('camera-view')).toBeTruthy();
    });
  });

  describe('barcode scanning - success', () => {
    const mockInvitation = {
      id: 'inv-123',
      visitor_name: 'Juan Pérez',
      visitor_phone: '5551234567',
      vehicle_plate: 'ABC123',
      status: 'active',
      type: 'single',
      valid_until: new Date(Date.now() + 86400000).toISOString(),
      unit_id: 'unit-123',
      unit: { unit_number: '101', building: 'A' },
    };

    it('shows success message on valid invitation', async () => {
      const mockInsert = jest.fn().mockResolvedValue({ error: null });
      mockSupabaseFrom.mockImplementation((table: string) => {
        if (table === 'invitations') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({ data: mockInvitation, error: null }),
              }),
            }),
          };
        }
        if (table === 'access_logs') {
          return { insert: mockInsert };
        }
        return {};
      });

      render(<GuardScanScreen />);

      // Simulate barcode scan
      if (mockOnBarcodeScanned) {
        mockOnBarcodeScanned({ data: 'inv-123' });
      }

      await waitFor(() => {
        expect(screen.getByText('Acceso autorizado')).toBeTruthy();
      });
    });

    it('shows visitor name on success', async () => {
      const mockInsert = jest.fn().mockResolvedValue({ error: null });
      mockSupabaseFrom.mockImplementation((table: string) => {
        if (table === 'invitations') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({ data: mockInvitation, error: null }),
              }),
            }),
          };
        }
        if (table === 'access_logs') {
          return { insert: mockInsert };
        }
        return {};
      });

      render(<GuardScanScreen />);

      if (mockOnBarcodeScanned) {
        mockOnBarcodeScanned({ data: 'inv-123' });
      }

      await waitFor(() => {
        expect(screen.getByText('Juan Pérez')).toBeTruthy();
      });
    });

    it('shows unit number on success', async () => {
      const mockInsert = jest.fn().mockResolvedValue({ error: null });
      mockSupabaseFrom.mockImplementation((table: string) => {
        if (table === 'invitations') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({ data: mockInvitation, error: null }),
              }),
            }),
          };
        }
        if (table === 'access_logs') {
          return { insert: mockInsert };
        }
        return {};
      });

      render(<GuardScanScreen />);

      if (mockOnBarcodeScanned) {
        mockOnBarcodeScanned({ data: 'inv-123' });
      }

      await waitFor(() => {
        expect(screen.getByText('Unidad A - 101')).toBeTruthy();
      });
    });

    it('creates access log on successful scan', async () => {
      const mockInsert = jest.fn().mockResolvedValue({ error: null });
      mockSupabaseFrom.mockImplementation((table: string) => {
        if (table === 'invitations') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({ data: mockInvitation, error: null }),
              }),
            }),
          };
        }
        if (table === 'access_logs') {
          return { insert: mockInsert };
        }
        return {};
      });

      render(<GuardScanScreen />);

      if (mockOnBarcodeScanned) {
        mockOnBarcodeScanned({ data: 'inv-123' });
      }

      await waitFor(() => {
        expect(mockInsert).toHaveBeenCalledWith(
          expect.objectContaining({
            visitor_name: 'Juan Pérez',
            access_type: 'invitation',
            entry_method: 'qr',
            direction: 'entry',
          })
        );
      });
    });

    it('shows scan another button on success', async () => {
      const mockInsert = jest.fn().mockResolvedValue({ error: null });
      mockSupabaseFrom.mockImplementation((table: string) => {
        if (table === 'invitations') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({ data: mockInvitation, error: null }),
              }),
            }),
          };
        }
        if (table === 'access_logs') {
          return { insert: mockInsert };
        }
        return {};
      });

      render(<GuardScanScreen />);

      if (mockOnBarcodeScanned) {
        mockOnBarcodeScanned({ data: 'inv-123' });
      }

      await waitFor(() => {
        expect(screen.getByText('Escanear otro')).toBeTruthy();
      });
    });

    it('shows close button on success', async () => {
      const mockInsert = jest.fn().mockResolvedValue({ error: null });
      mockSupabaseFrom.mockImplementation((table: string) => {
        if (table === 'invitations') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({ data: mockInvitation, error: null }),
              }),
            }),
          };
        }
        if (table === 'access_logs') {
          return { insert: mockInsert };
        }
        return {};
      });

      render(<GuardScanScreen />);

      if (mockOnBarcodeScanned) {
        mockOnBarcodeScanned({ data: 'inv-123' });
      }

      await waitFor(() => {
        expect(screen.getByText('Cerrar')).toBeTruthy();
      });
    });
  });

  describe('barcode scanning - failures', () => {
    it('shows error for expired invitation', async () => {
      const expiredInvitation = {
        id: 'inv-123',
        visitor_name: 'Juan Pérez',
        status: 'expired',
        type: 'single',
      };

      mockSupabaseFrom.mockImplementation((table: string) => {
        if (table === 'invitations') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({ data: expiredInvitation, error: null }),
              }),
            }),
          };
        }
        return {};
      });

      render(<GuardScanScreen />);

      if (mockOnBarcodeScanned) {
        mockOnBarcodeScanned({ data: 'inv-123' });
      }

      await waitFor(() => {
        expect(screen.getByText('Invitación expirada')).toBeTruthy();
      });
    });

    it('shows error for cancelled invitation', async () => {
      const cancelledInvitation = {
        id: 'inv-123',
        visitor_name: 'Juan Pérez',
        status: 'cancelled',
        type: 'single',
      };

      mockSupabaseFrom.mockImplementation((table: string) => {
        if (table === 'invitations') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({ data: cancelledInvitation, error: null }),
              }),
            }),
          };
        }
        return {};
      });

      render(<GuardScanScreen />);

      if (mockOnBarcodeScanned) {
        mockOnBarcodeScanned({ data: 'inv-123' });
      }

      await waitFor(() => {
        expect(screen.getByText('Invitación cancelada')).toBeTruthy();
      });
    });

    it('shows error for already used single invitation', async () => {
      const usedInvitation = {
        id: 'inv-123',
        visitor_name: 'Juan Pérez',
        status: 'used',
        type: 'single',
      };

      mockSupabaseFrom.mockImplementation((table: string) => {
        if (table === 'invitations') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({ data: usedInvitation, error: null }),
              }),
            }),
          };
        }
        return {};
      });

      render(<GuardScanScreen />);

      if (mockOnBarcodeScanned) {
        mockOnBarcodeScanned({ data: 'inv-123' });
      }

      await waitFor(() => {
        expect(screen.getByText('Invitación ya utilizada')).toBeTruthy();
      });
    });

    it('shows error for time-expired invitation', async () => {
      const timeExpiredInvitation = {
        id: 'inv-123',
        visitor_name: 'Juan Pérez',
        status: 'active',
        type: 'single',
        valid_until: new Date(Date.now() - 86400000).toISOString(),
      };

      mockSupabaseFrom.mockImplementation((table: string) => {
        if (table === 'invitations') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({ data: timeExpiredInvitation, error: null }),
              }),
            }),
          };
        }
        return {};
      });

      render(<GuardScanScreen />);

      if (mockOnBarcodeScanned) {
        mockOnBarcodeScanned({ data: 'inv-123' });
      }

      await waitFor(() => {
        expect(screen.getByText('Invitación vencida')).toBeTruthy();
      });
    });

    it('shows error for not found invitation', async () => {
      mockSupabaseFrom.mockImplementation((table: string) => {
        if (table === 'invitations') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({ data: null, error: new Error('Not found') }),
              }),
            }),
          };
        }
        return {};
      });

      render(<GuardScanScreen />);

      if (mockOnBarcodeScanned) {
        mockOnBarcodeScanned({ data: 'inv-123' });
      }

      await waitFor(() => {
        expect(screen.getByText('Invitación no encontrada')).toBeTruthy();
      });
    });
  });

  describe('short code scanning', () => {
    it('handles 6-character short codes', async () => {
      const mockInvitation = {
        id: 'inv-456',
        visitor_name: 'Maria García',
        status: 'active',
        type: 'single',
        valid_until: new Date(Date.now() + 86400000).toISOString(),
        unit: { unit_number: '202' },
      };

      const mockInsert = jest.fn().mockResolvedValue({ error: null });
      mockSupabaseFrom.mockImplementation((table: string) => {
        if (table === 'invitations') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockImplementation((field: string, value: string) => {
                if (field === 'short_code') {
                  return {
                    single: jest.fn().mockResolvedValue({ data: { id: 'inv-456' }, error: null }),
                  };
                }
                return {
                  single: jest.fn().mockResolvedValue({ data: mockInvitation, error: null }),
                };
              }),
            }),
          };
        }
        if (table === 'access_logs') {
          return { insert: mockInsert };
        }
        return {};
      });

      render(<GuardScanScreen />);

      if (mockOnBarcodeScanned) {
        mockOnBarcodeScanned({ data: 'ABC123' });
      }

      await waitFor(() => {
        expect(screen.getByText('Acceso autorizado')).toBeTruthy();
      });
    });

    it('shows error for invalid short code', async () => {
      mockSupabaseFrom.mockImplementation((table: string) => {
        if (table === 'invitations') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({ data: null, error: new Error('Not found') }),
              }),
            }),
          };
        }
        return {};
      });

      render(<GuardScanScreen />);

      if (mockOnBarcodeScanned) {
        mockOnBarcodeScanned({ data: 'XXXXXX' });
      }

      await waitFor(() => {
        expect(screen.getByText('Código no encontrado')).toBeTruthy();
      });
    });
  });

  describe('error handling', () => {
    it('handles scan error gracefully', async () => {
      const consoleError = console.error;
      console.error = jest.fn();

      mockSupabaseFrom.mockImplementation(() => ({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockRejectedValue(new Error('Network error')),
          }),
        }),
      }));

      render(<GuardScanScreen />);

      if (mockOnBarcodeScanned) {
        mockOnBarcodeScanned({ data: 'inv-123' });
      }

      await waitFor(() => {
        expect(screen.getByText('Error al procesar')).toBeTruthy();
      });

      console.error = consoleError;
    });
  });

  describe('reset functionality', () => {
    it('can scan again after reset', async () => {
      const mockInvitation = {
        id: 'inv-123',
        visitor_name: 'Juan Pérez',
        status: 'active',
        type: 'single',
        valid_until: new Date(Date.now() + 86400000).toISOString(),
        unit: { unit_number: '101' },
      };

      const mockInsert = jest.fn().mockResolvedValue({ error: null });
      mockSupabaseFrom.mockImplementation((table: string) => {
        if (table === 'invitations') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({ data: mockInvitation, error: null }),
              }),
            }),
          };
        }
        if (table === 'access_logs') {
          return { insert: mockInsert };
        }
        return {};
      });

      render(<GuardScanScreen />);

      if (mockOnBarcodeScanned) {
        mockOnBarcodeScanned({ data: 'inv-123' });
      }

      await waitFor(() => {
        expect(screen.getByText('Escanear otro')).toBeTruthy();
      });

      fireEvent.press(screen.getByText('Escanear otro'));

      await waitFor(() => {
        expect(screen.getByText('Apunta al código QR de la invitación')).toBeTruthy();
      });
    });
  });
});
