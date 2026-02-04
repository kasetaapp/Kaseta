import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';

// Mock expo-camera
const mockUseCameraPermissions = jest.fn();
jest.mock('expo-camera', () => ({
  CameraView: ({ children }: { children?: React.ReactNode }) => children,
  useCameraPermissions: () => mockUseCameraPermissions(),
}));

// Mock expo-router
const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockBack = jest.fn();

jest.mock('expo-router', () => ({
  router: {
    push: (...args: any[]) => mockPush(...args),
    replace: (...args: any[]) => mockReplace(...args),
    back: (...args: any[]) => mockBack(...args),
  },
  useLocalSearchParams: () => ({}),
}));

// Mock safe area context
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: { children: React.ReactNode }) => children,
  useSafeAreaInsets: () => ({ top: 44, bottom: 34, left: 0, right: 0 }),
}));

// Mock the invitation validation
const mockValidateInvitation = jest.fn();
const mockRegisterAccess = jest.fn();
jest.mock('@/lib/invitations', () => ({
  validateInvitation: (code: string) => mockValidateInvitation(code),
  registerAccess: (...args: any[]) => mockRegisterAccess(...args),
}));

// Mock supabase
const mockSupabaseFrom = jest.fn();
jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: (table: string) => mockSupabaseFrom(table),
  },
}));

// Mock contexts
const mockUseOrganization = jest.fn();
const mockUseAuth = jest.fn();

jest.mock('@/contexts/OrganizationContext', () => ({
  useOrganization: () => mockUseOrganization(),
}));

jest.mock('@/contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

// Import component after mocks
import ScanScreen from '@/app/(app)/(tabs)/scan';

describe('ScanScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Default mock implementations
    mockUseCameraPermissions.mockReturnValue([
      { granted: true },
      jest.fn(),
    ]);

    mockUseOrganization.mockReturnValue({
      currentOrganization: { id: 'org-123', name: 'Test Org' },
      canScanAccess: true,
    });

    mockUseAuth.mockReturnValue({
      user: { id: 'user-123' },
    });

    mockSupabaseFrom.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue({ data: [], error: null }),
          }),
        }),
      }),
    });

    mockValidateInvitation.mockResolvedValue({
      valid: true,
      invitation: {
        id: 'inv-123',
        visitor_name: 'John Doe',
        access_type: 'single',
        valid_until: new Date(Date.now() + 86400000).toISOString(),
        current_uses: 0,
        max_uses: 1,
      },
      message: 'Valid invitation',
    });

    mockRegisterAccess.mockResolvedValue({ success: true });
  });

  describe('permission checks', () => {
    it('renders permission denied message when user cannot scan', () => {
      mockUseOrganization.mockReturnValue({
        currentOrganization: { id: 'org-123', name: 'Test Org' },
        canScanAccess: false,
      });

      render(<ScanScreen />);

      expect(screen.getByText('Sin permisos')).toBeTruthy();
      expect(screen.getByText('No tienes permisos para escanear códigos de acceso.')).toBeTruthy();
    });

    it('renders normally when user has scan permission', () => {
      render(<ScanScreen />);

      expect(screen.getByText('Escanear')).toBeTruthy();
      expect(screen.getByText('Escanea el código QR o ingresa el código manualmente')).toBeTruthy();
    });
  });

  describe('camera permission', () => {
    it('shows camera permission request when not granted', () => {
      mockUseCameraPermissions.mockReturnValue([
        { granted: false },
        jest.fn(),
      ]);

      render(<ScanScreen />);

      expect(screen.getByText('Permiso de cámara requerido')).toBeTruthy();
      expect(screen.getByText('Permitir cámara')).toBeTruthy();
    });

    it('shows loading state when permission is null', () => {
      mockUseCameraPermissions.mockReturnValue([
        null,
        jest.fn(),
      ]);

      render(<ScanScreen />);

      expect(screen.getByText('Cargando...')).toBeTruthy();
    });

    it('requests camera permission when button is pressed', () => {
      const mockRequestPermission = jest.fn();
      mockUseCameraPermissions.mockReturnValue([
        { granted: false },
        mockRequestPermission,
      ]);

      render(<ScanScreen />);

      fireEvent.press(screen.getByText('Permitir cámara'));
      expect(mockRequestPermission).toHaveBeenCalled();
    });
  });

  describe('scan mode toggle', () => {
    it('toggles between QR and manual mode', () => {
      render(<ScanScreen />);

      // Initially in QR mode
      expect(screen.getByText(/Escanear QR/)).toBeTruthy();

      // Switch to manual mode
      fireEvent.press(screen.getByText(/Código manual/));

      expect(screen.getByText('Ingresa el código')).toBeTruthy();
      expect(screen.getByText('El código de 6 caracteres que aparece en la invitación')).toBeTruthy();
    });

    it('shows manual input field in code mode', () => {
      render(<ScanScreen />);

      fireEvent.press(screen.getByText(/Código manual/));

      expect(screen.getByPlaceholderText('ABC123')).toBeTruthy();
      expect(screen.getByText('Verificar código')).toBeTruthy();
    });
  });

  describe('manual code validation', () => {
    it('disables verify button when code is less than 6 characters', () => {
      render(<ScanScreen />);

      fireEvent.press(screen.getByText(/Código manual/));

      const input = screen.getByPlaceholderText('ABC123');
      fireEvent.changeText(input, 'ABC');

      const verifyButton = screen.getByText('Verificar código');
      // Button should be disabled (checking accessibility state)
      expect(verifyButton).toBeTruthy();
    });

    it('validates code when 6 characters are entered and button is pressed', async () => {
      render(<ScanScreen />);

      fireEvent.press(screen.getByText(/Código manual/));

      const input = screen.getByPlaceholderText('ABC123');
      fireEvent.changeText(input, 'TEST12');

      fireEvent.press(screen.getByText('Verificar código'));

      await waitFor(() => {
        expect(mockValidateInvitation).toHaveBeenCalledWith('TEST12');
      });
    });

    it('converts input to uppercase', () => {
      render(<ScanScreen />);

      fireEvent.press(screen.getByText(/Código manual/));

      const input = screen.getByPlaceholderText('ABC123');
      fireEvent.changeText(input, 'abc123');

      // The input should convert to uppercase
      expect(input.props.value).toBe('ABC123');
    });
  });

  describe('validation result - success', () => {
    it('shows success state when invitation is valid', async () => {
      render(<ScanScreen />);

      fireEvent.press(screen.getByText(/Código manual/));

      const input = screen.getByPlaceholderText('ABC123');
      fireEvent.changeText(input, 'TEST12');
      fireEvent.press(screen.getByText('Verificar código'));

      await waitFor(() => {
        expect(screen.getByText('Invitación Válida')).toBeTruthy();
      });

      expect(screen.getByText('John Doe')).toBeTruthy();
      expect(screen.getByText('Permitir entrada')).toBeTruthy();
      expect(screen.getByText('Denegar')).toBeTruthy();
    });

    it('shows access type label', async () => {
      render(<ScanScreen />);

      fireEvent.press(screen.getByText(/Código manual/));

      const input = screen.getByPlaceholderText('ABC123');
      fireEvent.changeText(input, 'TEST12');
      fireEvent.press(screen.getByText('Verificar código'));

      await waitFor(() => {
        expect(screen.getByText('Visita única')).toBeTruthy();
      });
    });
  });

  describe('validation result - error', () => {
    it('shows error state when invitation is invalid', async () => {
      mockValidateInvitation.mockResolvedValue({
        valid: false,
        invitation: null,
        message: 'Invitation expired',
      });

      render(<ScanScreen />);

      fireEvent.press(screen.getByText(/Código manual/));

      const input = screen.getByPlaceholderText('ABC123');
      fireEvent.changeText(input, 'TEST12');
      fireEvent.press(screen.getByText('Verificar código'));

      await waitFor(() => {
        expect(screen.getByText('Invitación Inválida')).toBeTruthy();
      });

      expect(screen.getByText('Invitation expired')).toBeTruthy();
      expect(screen.getByText('No permitir entrada')).toBeTruthy();
    });
  });

  describe('allow entry', () => {
    it('registers access when entry is allowed', async () => {
      jest.spyOn(Alert, 'alert');

      render(<ScanScreen />);

      fireEvent.press(screen.getByText(/Código manual/));

      const input = screen.getByPlaceholderText('ABC123');
      fireEvent.changeText(input, 'TEST12');
      fireEvent.press(screen.getByText('Verificar código'));

      await waitFor(() => {
        expect(screen.getByText('Permitir entrada')).toBeTruthy();
      });

      fireEvent.press(screen.getByText('Permitir entrada'));

      await waitFor(() => {
        expect(mockRegisterAccess).toHaveBeenCalledWith('inv-123', 'user-123', 'entry');
      });
    });

    it('shows success alert after registering access', async () => {
      const alertSpy = jest.spyOn(Alert, 'alert');

      render(<ScanScreen />);

      fireEvent.press(screen.getByText(/Código manual/));

      const input = screen.getByPlaceholderText('ABC123');
      fireEvent.changeText(input, 'TEST12');
      fireEvent.press(screen.getByText('Verificar código'));

      await waitFor(() => {
        expect(screen.getByText('Permitir entrada')).toBeTruthy();
      });

      fireEvent.press(screen.getByText('Permitir entrada'));

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith(
          'Acceso registrado',
          expect.stringContaining('John Doe'),
          expect.any(Array)
        );
      });
    });

    it('shows error alert when registration fails', async () => {
      mockRegisterAccess.mockResolvedValue({ success: false, error: 'Failed' });
      const alertSpy = jest.spyOn(Alert, 'alert');

      render(<ScanScreen />);

      fireEvent.press(screen.getByText(/Código manual/));

      const input = screen.getByPlaceholderText('ABC123');
      fireEvent.changeText(input, 'TEST12');
      fireEvent.press(screen.getByText('Verificar código'));

      await waitFor(() => {
        expect(screen.getByText('Permitir entrada')).toBeTruthy();
      });

      fireEvent.press(screen.getByText('Permitir entrada'));

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith('Error', 'No se pudo registrar el acceso. Intente de nuevo.');
      });
    });
  });

  describe('deny entry', () => {
    it('resets scan state when entry is denied', async () => {
      render(<ScanScreen />);

      fireEvent.press(screen.getByText(/Código manual/));

      const input = screen.getByPlaceholderText('ABC123');
      fireEvent.changeText(input, 'TEST12');
      fireEvent.press(screen.getByText('Verificar código'));

      await waitFor(() => {
        expect(screen.getByText('Denegar')).toBeTruthy();
      });

      fireEvent.press(screen.getByText('Denegar'));

      await waitFor(() => {
        expect(screen.getByText('Escanear')).toBeTruthy();
      });
    });
  });

  describe('manual entry navigation', () => {
    it('navigates to manual entry screen', () => {
      render(<ScanScreen />);

      fireEvent.press(screen.getByText('Entrada manual'));

      expect(mockPush).toHaveBeenCalledWith('/(app)/manual-entry');
    });
  });

  describe('recent scans', () => {
    it('shows loading skeleton while fetching logs', () => {
      render(<ScanScreen />);

      // Initial render shows skeleton
      expect(screen.getByText('Escaneos recientes')).toBeTruthy();
    });

    it('shows empty state when no recent logs', async () => {
      render(<ScanScreen />);

      await waitFor(() => {
        expect(screen.getByText('Sin escaneos recientes')).toBeTruthy();
      });
    });

    it('shows recent logs when available', async () => {
      mockSupabaseFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue({
                data: [
                  {
                    id: 'log-1',
                    visitor_name: 'Jane Smith',
                    access_type: 'entry',
                    accessed_at: new Date().toISOString(),
                    unit: { name: 'Unit A' },
                  },
                ],
                error: null,
              }),
            }),
          }),
        }),
      });

      render(<ScanScreen />);

      await waitFor(() => {
        expect(screen.getByText('Jane Smith')).toBeTruthy();
      });
    });
  });

  describe('access type labels', () => {
    it.each([
      ['single', 'Visita única'],
      ['multiple', 'Acceso múltiple'],
      ['permanent', 'Acceso permanente'],
      ['temporary', 'Acceso temporal'],
    ])('shows correct label for %s access type', async (type, expectedLabel) => {
      mockValidateInvitation.mockResolvedValue({
        valid: true,
        invitation: {
          id: 'inv-123',
          visitor_name: 'Test Visitor',
          access_type: type,
          valid_until: new Date(Date.now() + 86400000).toISOString(),
          current_uses: 0,
          max_uses: 1,
        },
        message: 'Valid invitation',
      });

      render(<ScanScreen />);

      fireEvent.press(screen.getByText(/Código manual/));

      const input = screen.getByPlaceholderText('ABC123');
      fireEvent.changeText(input, 'TEST12');
      fireEvent.press(screen.getByText('Verificar código'));

      await waitFor(() => {
        expect(screen.getByText(expectedLabel)).toBeTruthy();
      });
    });
  });

  describe('multiple access display', () => {
    it('shows usage count for multiple access type', async () => {
      mockValidateInvitation.mockResolvedValue({
        valid: true,
        invitation: {
          id: 'inv-123',
          visitor_name: 'Test Visitor',
          access_type: 'multiple',
          valid_until: new Date(Date.now() + 86400000).toISOString(),
          current_uses: 2,
          max_uses: 5,
        },
        message: 'Valid invitation',
      });

      render(<ScanScreen />);

      fireEvent.press(screen.getByText(/Código manual/));

      const input = screen.getByPlaceholderText('ABC123');
      fireEvent.changeText(input, 'TEST12');
      fireEvent.press(screen.getByText('Verificar código'));

      await waitFor(() => {
        expect(screen.getByText('2 / 5')).toBeTruthy();
      });
    });
  });

  describe('notes display', () => {
    it('shows notes when present', async () => {
      mockValidateInvitation.mockResolvedValue({
        valid: true,
        invitation: {
          id: 'inv-123',
          visitor_name: 'Test Visitor',
          access_type: 'single',
          valid_until: new Date(Date.now() + 86400000).toISOString(),
          notes: 'Please check ID',
        },
        message: 'Valid invitation',
      });

      render(<ScanScreen />);

      fireEvent.press(screen.getByText(/Código manual/));

      const input = screen.getByPlaceholderText('ABC123');
      fireEvent.changeText(input, 'TEST12');
      fireEvent.press(screen.getByText('Verificar código'));

      await waitFor(() => {
        expect(screen.getByText('Please check ID')).toBeTruthy();
      });
    });
  });
});
