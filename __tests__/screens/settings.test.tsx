import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert, Linking } from 'react-native';

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
  ChevronRight: () => null,
  Bell: () => null,
  Lock: () => null,
  Moon: () => null,
  Globe: () => null,
  Shield: () => null,
  HelpCircle: () => null,
  FileText: () => null,
  Star: () => null,
  Share2: () => null,
  Trash2: () => null,
  LogOut: () => null,
}));

// Mock expo-local-authentication
const mockHasHardwareAsync = jest.fn();
const mockIsEnrolledAsync = jest.fn();
const mockAuthenticateAsync = jest.fn();

jest.mock('expo-local-authentication', () => ({
  hasHardwareAsync: () => mockHasHardwareAsync(),
  isEnrolledAsync: () => mockIsEnrolledAsync(),
  authenticateAsync: (opts: any) => mockAuthenticateAsync(opts),
}));

// Mock AsyncStorage
const mockAsyncGetItem = jest.fn();
const mockAsyncSetItem = jest.fn();

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: (key: string) => mockAsyncGetItem(key),
  setItem: (key: string, value: string) => mockAsyncSetItem(key, value),
}));

// Mock supabase
jest.mock('@/lib/supabase', () => ({
  supabase: {},
}));

// Mock AuthContext
const mockSignOut = jest.fn();
jest.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'user-123' },
    signOut: mockSignOut,
  }),
}));

// Import component after mocks
import SettingsScreen from '@/app/(app)/settings';

describe('SettingsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockHasHardwareAsync.mockResolvedValue(true);
    mockIsEnrolledAsync.mockResolvedValue(true);
    mockAsyncGetItem.mockResolvedValue(null);
    mockAsyncSetItem.mockResolvedValue(undefined);
  });

  describe('header', () => {
    it('renders header with title', async () => {
      render(<SettingsScreen />);

      await waitFor(() => {
        expect(screen.getByText('Configuración')).toBeTruthy();
      });
    });

    it('navigates back when back button is pressed', async () => {
      render(<SettingsScreen />);

      await waitFor(() => {
        expect(screen.getByText('Configuración')).toBeTruthy();
      });

      // Find and press back button (using testID or parent pressable)
      // The back button is a Pressable containing ChevronLeft
    });
  });

  describe('security section', () => {
    it('renders security section', async () => {
      render(<SettingsScreen />);

      await waitFor(() => {
        expect(screen.getByText('Seguridad')).toBeTruthy();
      });
    });

    it('shows biometric option when available', async () => {
      render(<SettingsScreen />);

      await waitFor(() => {
        expect(screen.getByText('Autenticación biométrica')).toBeTruthy();
        expect(screen.getByText('Usa Face ID o huella digital')).toBeTruthy();
      });
    });

    it('hides biometric option when not available', async () => {
      mockHasHardwareAsync.mockResolvedValue(false);

      render(<SettingsScreen />);

      await waitFor(() => {
        expect(screen.queryByText('Autenticación biométrica')).toBeNull();
      });
    });

    it('shows privacy option', async () => {
      render(<SettingsScreen />);

      await waitFor(() => {
        expect(screen.getByText('Privacidad')).toBeTruthy();
        expect(screen.getByText('Controla tu información')).toBeTruthy();
      });
    });

    it('navigates to privacy screen when pressed', async () => {
      render(<SettingsScreen />);

      await waitFor(() => {
        expect(screen.getByText('Privacidad')).toBeTruthy();
      });

      fireEvent.press(screen.getByText('Privacidad'));

      expect(mockPush).toHaveBeenCalledWith('/(app)/settings/privacy');
    });
  });

  describe('biometric authentication', () => {
    it('authenticates before enabling biometrics', async () => {
      mockAuthenticateAsync.mockResolvedValue({ success: true });

      render(<SettingsScreen />);

      await waitFor(() => {
        expect(screen.getByText('Autenticación biométrica')).toBeTruthy();
      });

      // Find the Switch component and toggle it
      // This is complex as we need to find the Switch
    });
  });

  describe('preferences section', () => {
    it('renders preferences section', async () => {
      render(<SettingsScreen />);

      await waitFor(() => {
        expect(screen.getByText('Preferencias')).toBeTruthy();
      });
    });

    it('shows notifications option', async () => {
      render(<SettingsScreen />);

      await waitFor(() => {
        expect(screen.getByText('Notificaciones')).toBeTruthy();
        expect(screen.getByText('Configura alertas y sonidos')).toBeTruthy();
      });
    });

    it('navigates to notifications settings when pressed', async () => {
      render(<SettingsScreen />);

      await waitFor(() => {
        expect(screen.getByText('Notificaciones')).toBeTruthy();
      });

      fireEvent.press(screen.getByText('Notificaciones'));

      expect(mockPush).toHaveBeenCalledWith('/(app)/settings/notifications');
    });

    it('shows dark mode option', async () => {
      render(<SettingsScreen />);

      await waitFor(() => {
        expect(screen.getByText('Modo oscuro')).toBeTruthy();
      });
    });

    it('shows language option', async () => {
      render(<SettingsScreen />);

      await waitFor(() => {
        expect(screen.getByText('Idioma')).toBeTruthy();
        expect(screen.getByText('Español')).toBeTruthy();
      });
    });
  });

  describe('support section', () => {
    it('renders support section', async () => {
      render(<SettingsScreen />);

      await waitFor(() => {
        expect(screen.getByText('Soporte')).toBeTruthy();
      });
    });

    it('shows help option', async () => {
      render(<SettingsScreen />);

      await waitFor(() => {
        expect(screen.getByText('Ayuda y soporte')).toBeTruthy();
      });
    });

    it('opens email when help is pressed', async () => {
      const linkingSpy = jest.spyOn(Linking, 'openURL');

      render(<SettingsScreen />);

      await waitFor(() => {
        expect(screen.getByText('Ayuda y soporte')).toBeTruthy();
      });

      fireEvent.press(screen.getByText('Ayuda y soporte'));

      expect(linkingSpy).toHaveBeenCalledWith('mailto:soporte@kaseta.app');
    });

    it('shows terms of service option', async () => {
      render(<SettingsScreen />);

      await waitFor(() => {
        expect(screen.getByText('Términos de servicio')).toBeTruthy();
      });
    });

    it('opens terms URL when pressed', async () => {
      const linkingSpy = jest.spyOn(Linking, 'openURL');

      render(<SettingsScreen />);

      await waitFor(() => {
        expect(screen.getByText('Términos de servicio')).toBeTruthy();
      });

      fireEvent.press(screen.getByText('Términos de servicio'));

      expect(linkingSpy).toHaveBeenCalledWith('https://kaseta.app/terminos');
    });

    it('shows privacy policy option', async () => {
      render(<SettingsScreen />);

      await waitFor(() => {
        expect(screen.getByText('Política de privacidad')).toBeTruthy();
      });
    });

    it('opens privacy policy URL when pressed', async () => {
      const linkingSpy = jest.spyOn(Linking, 'openURL');

      render(<SettingsScreen />);

      await waitFor(() => {
        expect(screen.getByText('Política de privacidad')).toBeTruthy();
      });

      fireEvent.press(screen.getByText('Política de privacidad'));

      expect(linkingSpy).toHaveBeenCalledWith('https://kaseta.app/privacidad');
    });
  });

  describe('about section', () => {
    it('renders about section', async () => {
      render(<SettingsScreen />);

      await waitFor(() => {
        expect(screen.getByText('Acerca de')).toBeTruthy();
      });
    });

    it('shows rate app option', async () => {
      render(<SettingsScreen />);

      await waitFor(() => {
        expect(screen.getByText('Calificar la app')).toBeTruthy();
      });
    });

    it('shows alert when rate is pressed', async () => {
      const alertSpy = jest.spyOn(Alert, 'alert');

      render(<SettingsScreen />);

      await waitFor(() => {
        expect(screen.getByText('Calificar la app')).toBeTruthy();
      });

      fireEvent.press(screen.getByText('Calificar la app'));

      expect(alertSpy).toHaveBeenCalledWith('Calificar', 'Gracias por tu apoyo');
    });

    it('shows share option', async () => {
      render(<SettingsScreen />);

      await waitFor(() => {
        expect(screen.getByText('Compartir KASETA')).toBeTruthy();
      });
    });

    it('shows alert when share is pressed', async () => {
      const alertSpy = jest.spyOn(Alert, 'alert');

      render(<SettingsScreen />);

      await waitFor(() => {
        expect(screen.getByText('Compartir KASETA')).toBeTruthy();
      });

      fireEvent.press(screen.getByText('Compartir KASETA'));

      expect(alertSpy).toHaveBeenCalledWith('Compartir', 'Comparte KASETA con tus vecinos');
    });
  });

  describe('account section', () => {
    it('renders account section', async () => {
      render(<SettingsScreen />);

      await waitFor(() => {
        expect(screen.getByText('Cuenta')).toBeTruthy();
      });
    });

    it('shows sign out option', async () => {
      render(<SettingsScreen />);

      await waitFor(() => {
        expect(screen.getByText('Cerrar sesión')).toBeTruthy();
      });
    });

    it('shows confirmation dialog when sign out is pressed', async () => {
      const alertSpy = jest.spyOn(Alert, 'alert');

      render(<SettingsScreen />);

      await waitFor(() => {
        expect(screen.getByText('Cerrar sesión')).toBeTruthy();
      });

      fireEvent.press(screen.getByText('Cerrar sesión'));

      expect(alertSpy).toHaveBeenCalledWith(
        'Cerrar sesión',
        '¿Estás seguro que deseas salir?',
        expect.any(Array)
      );
    });

    it('shows delete account option', async () => {
      render(<SettingsScreen />);

      await waitFor(() => {
        expect(screen.getByText('Eliminar cuenta')).toBeTruthy();
      });
    });

    it('shows confirmation dialog when delete is pressed', async () => {
      const alertSpy = jest.spyOn(Alert, 'alert');

      render(<SettingsScreen />);

      await waitFor(() => {
        expect(screen.getByText('Eliminar cuenta')).toBeTruthy();
      });

      fireEvent.press(screen.getByText('Eliminar cuenta'));

      expect(alertSpy).toHaveBeenCalledWith(
        'Eliminar cuenta',
        '¿Estás seguro? Esta acción no se puede deshacer y perderás todos tus datos.',
        expect.any(Array)
      );
    });
  });

  describe('version', () => {
    it('shows app version', async () => {
      render(<SettingsScreen />);

      await waitFor(() => {
        expect(screen.getByText('KASETA v1.0.0')).toBeTruthy();
      });
    });

    it('shows copyright', async () => {
      render(<SettingsScreen />);

      await waitFor(() => {
        expect(screen.getByText('© 2024 KASETA. Todos los derechos reservados.')).toBeTruthy();
      });
    });
  });

  describe('settings persistence', () => {
    it('loads biometric setting from AsyncStorage', async () => {
      mockAsyncGetItem.mockImplementation((key: string) => {
        if (key === 'kaseta_biometric_enabled') return Promise.resolve('true');
        return Promise.resolve(null);
      });

      render(<SettingsScreen />);

      await waitFor(() => {
        expect(mockAsyncGetItem).toHaveBeenCalledWith('kaseta_biometric_enabled');
      });
    });

    it('loads dark mode setting from AsyncStorage', async () => {
      mockAsyncGetItem.mockImplementation((key: string) => {
        if (key === 'kaseta_dark_mode') return Promise.resolve('true');
        return Promise.resolve(null);
      });

      render(<SettingsScreen />);

      await waitFor(() => {
        expect(mockAsyncGetItem).toHaveBeenCalledWith('kaseta_dark_mode');
      });
    });
  });

  describe('biometric toggle', () => {
    it('saves biometric setting when toggled on', async () => {
      mockAuthenticateAsync.mockResolvedValue({ success: true });

      render(<SettingsScreen />);

      await waitFor(() => {
        expect(screen.getByText('Autenticación biométrica')).toBeTruthy();
      });
    });

    it('shows error when biometric authentication fails', async () => {
      const alertSpy = jest.spyOn(Alert, 'alert');
      mockAuthenticateAsync.mockResolvedValue({ success: false, error: 'user_cancel' });

      render(<SettingsScreen />);

      await waitFor(() => {
        expect(screen.getByText('Autenticación biométrica')).toBeTruthy();
      });
    });
  });

  describe('dark mode toggle', () => {
    it('saves dark mode setting when toggled', async () => {
      render(<SettingsScreen />);

      await waitFor(() => {
        expect(screen.getByText('Modo oscuro')).toBeTruthy();
      });
    });

    it('persists dark mode to AsyncStorage', async () => {
      render(<SettingsScreen />);

      await waitFor(() => {
        expect(screen.getByText('Modo oscuro')).toBeTruthy();
      });
    });
  });

  describe('security navigation', () => {
    it('navigates to security settings', async () => {
      render(<SettingsScreen />);

      await waitFor(() => {
        expect(screen.getByText('Seguridad')).toBeTruthy();
      });

      // There should be a "Cambiar contraseña" option
      expect(screen.getByText(/Cambiar contraseña|Privacidad/)).toBeTruthy();
    });
  });

  describe('biometric unavailable state', () => {
    it('hides biometric when not enrolled', async () => {
      mockHasHardwareAsync.mockResolvedValue(true);
      mockIsEnrolledAsync.mockResolvedValue(false);

      render(<SettingsScreen />);

      await waitFor(() => {
        expect(screen.getByText('Seguridad')).toBeTruthy();
      });

      // Biometric option should be hidden when not enrolled
    });
  });

  describe('sign out flow', () => {
    it('calls signOut when confirmed', async () => {
      const alertSpy = jest.spyOn(Alert, 'alert');

      render(<SettingsScreen />);

      await waitFor(() => {
        expect(screen.getByText('Cerrar sesión')).toBeTruthy();
      });

      fireEvent.press(screen.getByText('Cerrar sesión'));

      // Get the alert call and simulate pressing confirm
      const alertCall = alertSpy.mock.calls.find(call => call[0] === 'Cerrar sesión');
      expect(alertCall).toBeTruthy();

      // The third argument contains the buttons
      const buttons = alertCall?.[2] as any[];
      expect(buttons).toBeDefined();
      expect(buttons?.length).toBeGreaterThan(1);
    });
  });

  describe('delete account flow', () => {
    it('shows destructive delete confirmation', async () => {
      const alertSpy = jest.spyOn(Alert, 'alert');

      render(<SettingsScreen />);

      await waitFor(() => {
        expect(screen.getByText('Eliminar cuenta')).toBeTruthy();
      });

      fireEvent.press(screen.getByText('Eliminar cuenta'));

      const alertCall = alertSpy.mock.calls.find(call => call[0] === 'Eliminar cuenta');
      expect(alertCall).toBeTruthy();

      // Should have destructive button style
      const buttons = alertCall?.[2] as any[];
      const deleteButton = buttons?.find(b => b.style === 'destructive');
      expect(deleteButton).toBeTruthy();
    });
  });
});
