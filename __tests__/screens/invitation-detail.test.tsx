import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert, Share } from 'react-native';

// Mock expo-router
const mockBack = jest.fn();

jest.mock('expo-router', () => ({
  router: {
    back: (...args: any[]) => mockBack(...args),
  },
  useLocalSearchParams: () => ({ id: 'inv-123' }),
}));

// Mock safe area context
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: { children: React.ReactNode }) => children,
  useSafeAreaInsets: () => ({ top: 44, bottom: 34, left: 0, right: 0 }),
}));

// Mock lucide-react-native
jest.mock('lucide-react-native', () => ({
  ChevronLeft: () => null,
  Share2: () => null,
  Copy: () => null,
  Trash2: () => null,
  Calendar: () => null,
  Clock: () => null,
  User: () => null,
  Phone: () => null,
  Mail: () => null,
  FileText: () => null,
}));

// Mock QRCode
jest.mock('react-native-qrcode-svg', () => {
  const { View } = require('react-native');
  return {
    __esModule: true,
    default: () => <View testID="qr-code" />,
  };
});

// Mock Clipboard
jest.mock('expo-clipboard', () => ({
  setStringAsync: jest.fn().mockResolvedValue(undefined),
}));

// Mock useInvitation hook
const mockCancel = jest.fn();
const mockUseInvitation = jest.fn();

jest.mock('@/hooks/useInvitations', () => ({
  useInvitation: (id: string) => mockUseInvitation(id),
}));

// Import component after mocks
import InvitationDetailScreen from '@/app/(app)/invitation/[id]';

describe('InvitationDetailScreen', () => {
  const mockInvitation = {
    id: 'inv-123',
    visitor_name: 'John Doe',
    visitor_phone: '5551234567',
    visitor_email: 'john@example.com',
    access_type: 'single',
    status: 'active',
    short_code: 'ABC123',
    qr_code: 'https://kaseta.app/i/ABC123',
    valid_from: new Date().toISOString(),
    valid_until: new Date(Date.now() + 86400000).toISOString(),
    current_uses: 0,
    max_uses: 1,
    notes: 'Test notes',
    created_at: new Date().toISOString(),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    mockUseInvitation.mockReturnValue({
      invitation: mockInvitation,
      isLoading: false,
      cancel: mockCancel,
    });

    mockCancel.mockResolvedValue(true);
  });

  describe('loading state', () => {
    it('shows loading state', () => {
      mockUseInvitation.mockReturnValue({
        invitation: null,
        isLoading: true,
        cancel: mockCancel,
      });

      render(<InvitationDetailScreen />);

      // Should show skeleton
    });
  });

  describe('not found state', () => {
    it('shows not found message when invitation is null', () => {
      mockUseInvitation.mockReturnValue({
        invitation: null,
        isLoading: false,
        cancel: mockCancel,
      });

      render(<InvitationDetailScreen />);

      expect(screen.getByText('Invitación no encontrada')).toBeTruthy();
      expect(screen.getByText('La invitación que buscas no existe o fue eliminada')).toBeTruthy();
    });

    it('shows back button on not found screen', () => {
      mockUseInvitation.mockReturnValue({
        invitation: null,
        isLoading: false,
        cancel: mockCancel,
      });

      render(<InvitationDetailScreen />);

      expect(screen.getByText('Volver')).toBeTruthy();
    });
  });

  describe('header', () => {
    it('renders header with title', () => {
      render(<InvitationDetailScreen />);

      expect(screen.getByText('Invitación')).toBeTruthy();
    });
  });

  describe('status badge', () => {
    it('shows active status', () => {
      render(<InvitationDetailScreen />);

      expect(screen.getByText('Activa')).toBeTruthy();
    });

    it('shows used status', () => {
      mockUseInvitation.mockReturnValue({
        invitation: { ...mockInvitation, status: 'used' },
        isLoading: false,
        cancel: mockCancel,
      });

      render(<InvitationDetailScreen />);

      expect(screen.getByText('Usada')).toBeTruthy();
    });

    it('shows expired status', () => {
      mockUseInvitation.mockReturnValue({
        invitation: { ...mockInvitation, status: 'expired' },
        isLoading: false,
        cancel: mockCancel,
      });

      render(<InvitationDetailScreen />);

      expect(screen.getByText('Expirada')).toBeTruthy();
    });

    it('shows cancelled status', () => {
      mockUseInvitation.mockReturnValue({
        invitation: { ...mockInvitation, status: 'cancelled' },
        isLoading: false,
        cancel: mockCancel,
      });

      render(<InvitationDetailScreen />);

      expect(screen.getByText('Cancelada')).toBeTruthy();
    });
  });

  describe('QR code', () => {
    it('renders QR code for active invitation', () => {
      render(<InvitationDetailScreen />);

      expect(screen.getByTestId('qr-code')).toBeTruthy();
    });

    it('hides QR code for inactive invitation', () => {
      mockUseInvitation.mockReturnValue({
        invitation: { ...mockInvitation, status: 'used' },
        isLoading: false,
        cancel: mockCancel,
      });

      render(<InvitationDetailScreen />);

      expect(screen.queryByTestId('qr-code')).toBeNull();
      expect(screen.getByText('Esta invitación ya no es válida')).toBeTruthy();
    });
  });

  describe('short code', () => {
    it('displays short code', () => {
      render(<InvitationDetailScreen />);

      expect(screen.getByText('ABC123')).toBeTruthy();
    });

    it('shows copy hint', () => {
      render(<InvitationDetailScreen />);

      expect(screen.getByText('Toca para copiar el código')).toBeTruthy();
    });

    it('copies code to clipboard when pressed', async () => {
      const Clipboard = require('expo-clipboard');
      const alertSpy = jest.spyOn(Alert, 'alert');

      render(<InvitationDetailScreen />);

      fireEvent.press(screen.getByText('ABC123'));

      await waitFor(() => {
        expect(Clipboard.setStringAsync).toHaveBeenCalledWith('ABC123');
        expect(alertSpy).toHaveBeenCalledWith('Copiado', 'Código copiado al portapapeles');
      });
    });
  });

  describe('visitor information', () => {
    it('displays visitor section', () => {
      render(<InvitationDetailScreen />);

      expect(screen.getByText('Visitante')).toBeTruthy();
    });

    it('displays visitor name', () => {
      render(<InvitationDetailScreen />);

      expect(screen.getByText('John Doe')).toBeTruthy();
    });

    it('displays visitor phone', () => {
      render(<InvitationDetailScreen />);

      expect(screen.getByText('5551234567')).toBeTruthy();
    });

    it('displays visitor email', () => {
      render(<InvitationDetailScreen />);

      expect(screen.getByText('john@example.com')).toBeTruthy();
    });

    it('hides phone when not provided', () => {
      mockUseInvitation.mockReturnValue({
        invitation: { ...mockInvitation, visitor_phone: null },
        isLoading: false,
        cancel: mockCancel,
      });

      render(<InvitationDetailScreen />);

      expect(screen.queryByText('5551234567')).toBeNull();
    });
  });

  describe('details section', () => {
    it('displays details section', () => {
      render(<InvitationDetailScreen />);

      expect(screen.getByText('Detalles')).toBeTruthy();
    });

    it('displays access type', () => {
      render(<InvitationDetailScreen />);

      expect(screen.getByText('Tipo de acceso')).toBeTruthy();
      expect(screen.getByText('Uso único')).toBeTruthy();
    });

    it('displays valid from date', () => {
      render(<InvitationDetailScreen />);

      expect(screen.getByText('Válida desde')).toBeTruthy();
    });

    it('displays valid until date', () => {
      render(<InvitationDetailScreen />);

      expect(screen.getByText('Válida hasta')).toBeTruthy();
    });

    it('displays notes', () => {
      render(<InvitationDetailScreen />);

      expect(screen.getByText('Test notes')).toBeTruthy();
    });

    it('displays uses for multiple access type', () => {
      mockUseInvitation.mockReturnValue({
        invitation: { ...mockInvitation, access_type: 'multiple', max_uses: 5, current_uses: 2 },
        isLoading: false,
        cancel: mockCancel,
      });

      render(<InvitationDetailScreen />);

      expect(screen.getByText('2 / 5')).toBeTruthy();
    });
  });

  describe('access type labels', () => {
    it.each([
      ['single', 'Uso único'],
      ['multiple', 'Múltiples usos'],
      ['permanent', 'Permanente'],
      ['temporary', 'Temporal'],
    ])('shows correct label for %s', (type, expectedLabel) => {
      mockUseInvitation.mockReturnValue({
        invitation: { ...mockInvitation, access_type: type },
        isLoading: false,
        cancel: mockCancel,
      });

      render(<InvitationDetailScreen />);

      expect(screen.getByText(expectedLabel)).toBeTruthy();
    });
  });

  describe('share functionality', () => {
    it('shows share button for active invitation', () => {
      render(<InvitationDetailScreen />);

      expect(screen.getByText('Compartir invitación')).toBeTruthy();
    });

    it('shares invitation when share button is pressed', async () => {
      const shareSpy = jest.spyOn(Share, 'share').mockResolvedValue({ action: 'sharedAction' });

      render(<InvitationDetailScreen />);

      fireEvent.press(screen.getByText('Compartir invitación'));

      await waitFor(() => {
        expect(shareSpy).toHaveBeenCalledWith(expect.objectContaining({
          title: 'Invitación de acceso',
        }));
      });
    });

    it('hides share button for inactive invitation', () => {
      mockUseInvitation.mockReturnValue({
        invitation: { ...mockInvitation, status: 'used' },
        isLoading: false,
        cancel: mockCancel,
      });

      render(<InvitationDetailScreen />);

      expect(screen.queryByText('Compartir invitación')).toBeNull();
    });
  });

  describe('cancel functionality', () => {
    it('shows cancel button for active invitation', () => {
      render(<InvitationDetailScreen />);

      expect(screen.getByText('Cancelar invitación')).toBeTruthy();
    });

    it('shows confirmation dialog when cancel is pressed', () => {
      const alertSpy = jest.spyOn(Alert, 'alert');

      render(<InvitationDetailScreen />);

      fireEvent.press(screen.getByText('Cancelar invitación'));

      expect(alertSpy).toHaveBeenCalledWith(
        'Cancelar invitación',
        '¿Estás seguro de que deseas cancelar esta invitación? Esta acción no se puede deshacer.',
        expect.any(Array)
      );
    });

    it('cancels invitation when confirmed', async () => {
      const alertSpy = jest.spyOn(Alert, 'alert');

      render(<InvitationDetailScreen />);

      fireEvent.press(screen.getByText('Cancelar invitación'));

      // Get confirm button from alert
      const alertCall = alertSpy.mock.calls[0];
      const buttons = alertCall[2] as Array<{ text: string; onPress?: () => void }>;
      const confirmButton = buttons.find(b => b.text === 'Sí, cancelar');

      await confirmButton?.onPress?.();

      expect(mockCancel).toHaveBeenCalled();
    });

    it('navigates back after successful cancel', async () => {
      const alertSpy = jest.spyOn(Alert, 'alert');

      render(<InvitationDetailScreen />);

      fireEvent.press(screen.getByText('Cancelar invitación'));

      const alertCall = alertSpy.mock.calls[0];
      const buttons = alertCall[2] as Array<{ text: string; onPress?: () => void }>;
      const confirmButton = buttons.find(b => b.text === 'Sí, cancelar');

      await confirmButton?.onPress?.();

      await waitFor(() => {
        expect(mockBack).toHaveBeenCalled();
      });
    });

    it('hides cancel button for inactive invitation', () => {
      mockUseInvitation.mockReturnValue({
        invitation: { ...mockInvitation, status: 'used' },
        isLoading: false,
        cancel: mockCancel,
      });

      render(<InvitationDetailScreen />);

      expect(screen.queryByText('Cancelar invitación')).toBeNull();
    });
  });

  describe('inactive invitation states', () => {
    it('shows checkmark for used invitation', () => {
      mockUseInvitation.mockReturnValue({
        invitation: { ...mockInvitation, status: 'used' },
        isLoading: false,
        cancel: mockCancel,
      });

      render(<InvitationDetailScreen />);

      expect(screen.getByText('✅')).toBeTruthy();
    });

    it('shows X for expired invitation', () => {
      mockUseInvitation.mockReturnValue({
        invitation: { ...mockInvitation, status: 'expired' },
        isLoading: false,
        cancel: mockCancel,
      });

      render(<InvitationDetailScreen />);

      expect(screen.getByText('❌')).toBeTruthy();
    });

    it('shows X for cancelled invitation', () => {
      mockUseInvitation.mockReturnValue({
        invitation: { ...mockInvitation, status: 'cancelled' },
        isLoading: false,
        cancel: mockCancel,
      });

      render(<InvitationDetailScreen />);

      expect(screen.getByText('❌')).toBeTruthy();
    });
  });
});
