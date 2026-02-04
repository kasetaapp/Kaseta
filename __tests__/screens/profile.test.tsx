import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';

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
}));

// Mock safe area context
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: { children: React.ReactNode }) => children,
  useSafeAreaInsets: () => ({ top: 44, bottom: 34, left: 0, right: 0 }),
}));

// Mock OrganizationSwitcher
jest.mock('@/components/features/OrganizationSwitcher', () => {
  const { forwardRef } = require('react');
  return {
    OrganizationSwitcher: forwardRef((_props: any, _ref: any) => null),
    OrganizationSwitcherRef: {},
  };
});

// Mock contexts
const mockUseAuth = jest.fn();
const mockUseOrganization = jest.fn();

jest.mock('@/contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

jest.mock('@/contexts/OrganizationContext', () => ({
  useOrganization: () => mockUseOrganization(),
}));

// Import component after mocks
import ProfileScreen from '@/app/(app)/(tabs)/profile';

describe('ProfileScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockUseAuth.mockReturnValue({
      user: { id: 'user-123', email: 'test@example.com' },
      profile: { full_name: 'John Doe', email: 'test@example.com', phone: '+1234567890' },
      signOut: jest.fn().mockResolvedValue(undefined),
      isLoading: false,
    });

    mockUseOrganization.mockReturnValue({
      currentOrganization: { id: 'org-123', name: 'Test Organization' },
      currentUnit: { id: 'unit-123', name: 'Unit 101' },
      currentRole: 'resident',
      isAdmin: false,
      memberships: [{ id: 'membership-1' }],
    });
  });

  describe('loading state', () => {
    it('shows skeleton loading state', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        profile: null,
        signOut: jest.fn(),
        isLoading: true,
      });

      render(<ProfileScreen />);

      // Should show skeleton, not actual content
      expect(screen.queryByText('Perfil')).toBeNull();
    });
  });

  describe('profile display', () => {
    it('renders profile header', () => {
      render(<ProfileScreen />);

      expect(screen.getByText('Perfil')).toBeTruthy();
    });

    it('displays user name', () => {
      render(<ProfileScreen />);

      expect(screen.getByText('John Doe')).toBeTruthy();
    });

    it('displays user email', () => {
      render(<ProfileScreen />);

      expect(screen.getByText('test@example.com')).toBeTruthy();
    });

    it('displays user phone', () => {
      render(<ProfileScreen />);

      expect(screen.getByText('+1234567890')).toBeTruthy();
    });

    it('displays role badge', () => {
      render(<ProfileScreen />);

      expect(screen.getByText('Residente')).toBeTruthy();
    });

    it('shows edit button', () => {
      render(<ProfileScreen />);

      expect(screen.getByText('Editar')).toBeTruthy();
    });
  });

  describe('role labels', () => {
    it.each([
      ['resident', 'Residente'],
      ['admin', 'Administrador'],
      ['guard', 'Guardia'],
      ['super_admin', 'Super Admin'],
    ])('shows correct label for %s role', (role, expectedLabel) => {
      mockUseOrganization.mockReturnValue({
        currentOrganization: { id: 'org-123', name: 'Test Organization' },
        currentUnit: { id: 'unit-123', name: 'Unit 101' },
        currentRole: role,
        isAdmin: false,
        memberships: [{ id: 'membership-1' }],
      });

      render(<ProfileScreen />);

      expect(screen.getByText(expectedLabel)).toBeTruthy();
    });
  });

  describe('organization display', () => {
    it('displays current organization', () => {
      render(<ProfileScreen />);

      expect(screen.getByText('Test Organization')).toBeTruthy();
      expect(screen.getByText('Organización actual')).toBeTruthy();
    });

    it('displays current unit', () => {
      render(<ProfileScreen />);

      expect(screen.getByText('Unit 101')).toBeTruthy();
    });

    it('shows change button when multiple memberships exist', () => {
      mockUseOrganization.mockReturnValue({
        currentOrganization: { id: 'org-123', name: 'Test Organization' },
        currentUnit: { id: 'unit-123', name: 'Unit 101' },
        currentRole: 'resident',
        isAdmin: false,
        memberships: [{ id: 'membership-1' }, { id: 'membership-2' }],
      });

      render(<ProfileScreen />);

      expect(screen.getByText('Cambiar')).toBeTruthy();
    });

    it('does not show change button with single membership', () => {
      render(<ProfileScreen />);

      expect(screen.queryByText('Cambiar')).toBeNull();
    });

    it('shows join organization option when no organization', () => {
      mockUseOrganization.mockReturnValue({
        currentOrganization: null,
        currentUnit: null,
        currentRole: null,
        isAdmin: false,
        memberships: [],
      });

      render(<ProfileScreen />);

      expect(screen.getByText('Unirse a una organización')).toBeTruthy();
      expect(screen.getByText('Únete con un código de invitación')).toBeTruthy();
    });
  });

  describe('admin section', () => {
    it('shows admin panel when user is admin', () => {
      mockUseOrganization.mockReturnValue({
        currentOrganization: { id: 'org-123', name: 'Test Organization' },
        currentUnit: { id: 'unit-123', name: 'Unit 101' },
        currentRole: 'admin',
        isAdmin: true,
        memberships: [{ id: 'membership-1' }],
      });

      render(<ProfileScreen />);

      expect(screen.getByText('Administración')).toBeTruthy();
      expect(screen.getByText('Panel de administrador')).toBeTruthy();
    });

    it('does not show admin panel for non-admin users', () => {
      render(<ProfileScreen />);

      expect(screen.queryByText('Administración')).toBeNull();
      expect(screen.queryByText('Panel de administrador')).toBeNull();
    });

    it('navigates to admin dashboard when pressed', () => {
      mockUseOrganization.mockReturnValue({
        currentOrganization: { id: 'org-123', name: 'Test Organization' },
        currentUnit: null,
        currentRole: 'admin',
        isAdmin: true,
        memberships: [{ id: 'membership-1' }],
      });

      render(<ProfileScreen />);

      fireEvent.press(screen.getByText('Panel de administrador'));

      expect(mockPush).toHaveBeenCalledWith('/(app)/admin');
    });
  });

  describe('account menu', () => {
    it('renders account section', () => {
      render(<ProfileScreen />);

      expect(screen.getByText('Cuenta')).toBeTruthy();
    });

    it('shows personal information option', () => {
      render(<ProfileScreen />);

      expect(screen.getByText('Información personal')).toBeTruthy();
    });

    it('shows vehicles option', () => {
      render(<ProfileScreen />);

      expect(screen.getByText('Mis vehículos')).toBeTruthy();
    });

    it('shows security option', () => {
      render(<ProfileScreen />);

      expect(screen.getByText('Seguridad')).toBeTruthy();
    });

    it('shows notifications option', () => {
      render(<ProfileScreen />);

      expect(screen.getByText('Notificaciones')).toBeTruthy();
    });

    it('navigates to edit profile when info button is pressed', () => {
      render(<ProfileScreen />);

      fireEvent.press(screen.getByText('Información personal'));

      expect(mockPush).toHaveBeenCalledWith('/(app)/settings/edit-profile');
    });

    it('navigates to vehicles when pressed', () => {
      render(<ProfileScreen />);

      fireEvent.press(screen.getByText('Mis vehículos'));

      expect(mockPush).toHaveBeenCalledWith('/(app)/vehicles');
    });

    it('navigates to security when pressed', () => {
      render(<ProfileScreen />);

      fireEvent.press(screen.getByText('Seguridad'));

      expect(mockPush).toHaveBeenCalledWith('/(app)/settings/security');
    });

    it('navigates to notifications when pressed', () => {
      render(<ProfileScreen />);

      fireEvent.press(screen.getByText('Notificaciones'));

      expect(mockPush).toHaveBeenCalledWith('/(app)/settings/notifications');
    });
  });

  describe('preferences menu', () => {
    it('renders preferences section', () => {
      render(<ProfileScreen />);

      expect(screen.getByText('Preferencias')).toBeTruthy();
    });

    it('shows appearance option with current value', () => {
      render(<ProfileScreen />);

      expect(screen.getByText('Apariencia')).toBeTruthy();
    });

    it('shows language option', () => {
      render(<ProfileScreen />);

      expect(screen.getByText('Idioma')).toBeTruthy();
      expect(screen.getByText('Español')).toBeTruthy();
    });
  });

  describe('support menu', () => {
    it('renders support section', () => {
      render(<ProfileScreen />);

      expect(screen.getByText('Soporte')).toBeTruthy();
    });

    it('shows help center option', () => {
      render(<ProfileScreen />);

      expect(screen.getByText('Centro de ayuda')).toBeTruthy();
    });

    it('shows terms of service option', () => {
      render(<ProfileScreen />);

      expect(screen.getByText('Términos de servicio')).toBeTruthy();
    });

    it('shows privacy policy option', () => {
      render(<ProfileScreen />);

      expect(screen.getByText('Política de privacidad')).toBeTruthy();
    });
  });

  describe('logout', () => {
    it('shows logout option', () => {
      render(<ProfileScreen />);

      expect(screen.getByText('Cerrar sesión')).toBeTruthy();
    });

    it('shows confirmation dialog when logout is pressed', () => {
      const alertSpy = jest.spyOn(Alert, 'alert');

      render(<ProfileScreen />);

      fireEvent.press(screen.getByText('Cerrar sesión'));

      expect(alertSpy).toHaveBeenCalledWith(
        'Cerrar sesión',
        '¿Estás seguro de que deseas cerrar sesión?',
        expect.arrayContaining([
          expect.objectContaining({ text: 'Cancelar' }),
          expect.objectContaining({ text: 'Cerrar sesión' }),
        ])
      );
    });

    it('calls signOut and navigates to login on confirmation', async () => {
      const mockSignOut = jest.fn().mockResolvedValue(undefined);
      mockUseAuth.mockReturnValue({
        user: { id: 'user-123', email: 'test@example.com' },
        profile: { full_name: 'John Doe', email: 'test@example.com' },
        signOut: mockSignOut,
        isLoading: false,
      });

      const alertSpy = jest.spyOn(Alert, 'alert');

      render(<ProfileScreen />);

      fireEvent.press(screen.getByText('Cerrar sesión'));

      // Get the confirm callback and call it
      const alertCall = alertSpy.mock.calls[0];
      const buttons = alertCall[2] as Array<{ text: string; onPress?: () => void }>;
      const confirmButton = buttons.find(b => b.text === 'Cerrar sesión');

      await confirmButton?.onPress?.();

      expect(mockSignOut).toHaveBeenCalled();
      expect(mockReplace).toHaveBeenCalledWith('/(auth)/login');
    });
  });

  describe('footer', () => {
    it('shows app version', () => {
      render(<ProfileScreen />);

      expect(screen.getByText('KASETA v1.0.0')).toBeTruthy();
    });
  });

  describe('navigation actions', () => {
    it('navigates to edit profile when edit button is pressed', () => {
      render(<ProfileScreen />);

      fireEvent.press(screen.getByText('Editar'));

      expect(mockPush).toHaveBeenCalledWith('/(app)/settings/edit-profile');
    });

    it('navigates to join organization when option is pressed', () => {
      mockUseOrganization.mockReturnValue({
        currentOrganization: null,
        currentUnit: null,
        currentRole: null,
        isAdmin: false,
        memberships: [],
      });

      render(<ProfileScreen />);

      fireEvent.press(screen.getByText('Unirse a una organización'));

      expect(mockPush).toHaveBeenCalledWith('/(app)/organization/join');
    });
  });

  describe('fallback values', () => {
    it('uses user metadata when profile is not available', () => {
      mockUseAuth.mockReturnValue({
        user: {
          id: 'user-123',
          email: 'metadata@example.com',
          user_metadata: { full_name: 'Metadata Name' }
        },
        profile: null,
        signOut: jest.fn(),
        isLoading: false,
      });

      render(<ProfileScreen />);

      expect(screen.getByText('Metadata Name')).toBeTruthy();
    });

    it('shows "Usuario" when no name is available', () => {
      mockUseAuth.mockReturnValue({
        user: { id: 'user-123' },
        profile: null,
        signOut: jest.fn(),
        isLoading: false,
      });

      render(<ProfileScreen />);

      expect(screen.getByText('Usuario')).toBeTruthy();
    });

    it('shows "Sin rol" when no role is available', () => {
      mockUseOrganization.mockReturnValue({
        currentOrganization: { id: 'org-123', name: 'Test Org' },
        currentUnit: null,
        currentRole: null,
        isAdmin: false,
        memberships: [],
      });

      render(<ProfileScreen />);

      expect(screen.getByText('Sin rol')).toBeTruthy();
    });
  });
});
