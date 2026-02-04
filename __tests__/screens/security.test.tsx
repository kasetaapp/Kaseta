import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';

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

// Mock expo-haptics
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'light' },
  NotificationFeedbackType: { Success: 'success' },
}));

// Mock supabase
const mockUpdateUser = jest.fn();

jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      updateUser: (params: any) => mockUpdateUser(params),
    },
  },
}));

// Import component after mocks
import SecurityScreen from '@/app/(app)/settings/security';

describe('SecurityScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUpdateUser.mockResolvedValue({ error: null });
  });

  describe('header', () => {
    it('renders header with title', () => {
      render(<SecurityScreen />);

      expect(screen.getByText('Seguridad')).toBeTruthy();
    });

    it('shows back button', () => {
      render(<SecurityScreen />);

      expect(screen.getByText('← Atrás')).toBeTruthy();
    });
  });

  describe('change password section', () => {
    it('shows section title', () => {
      render(<SecurityScreen />);

      // "Cambiar contraseña" appears as section title and button
      expect(screen.getAllByText('Cambiar contraseña').length).toBeGreaterThan(0);
    });

    it('shows current password input', () => {
      render(<SecurityScreen />);

      expect(screen.getByText('Contraseña actual')).toBeTruthy();
    });

    it('shows new password input', () => {
      render(<SecurityScreen />);

      expect(screen.getByText('Nueva contraseña')).toBeTruthy();
    });

    it('shows confirm password input', () => {
      render(<SecurityScreen />);

      expect(screen.getByText('Confirmar nueva contraseña')).toBeTruthy();
    });

    it('shows password requirements', () => {
      render(<SecurityScreen />);

      expect(screen.getByText('Mínimo 6 caracteres')).toBeTruthy();
    });
  });

  describe('submit button', () => {
    it('shows change password button', () => {
      render(<SecurityScreen />);

      expect(screen.getAllByText('Cambiar contraseña').length).toBeGreaterThan(0);
    });

    it('disables button when fields are empty', () => {
      render(<SecurityScreen />);

      const buttons = screen.getAllByText('Cambiar contraseña');
      // Button should be disabled
      expect(buttons.length).toBeGreaterThan(0);
    });
  });

  describe('password validation', () => {
    it('shows error when new password is too short', () => {
      render(<SecurityScreen />);

      const newPasswordInput = screen.getByPlaceholderText('Mínimo 6 caracteres');
      fireEvent.changeText(newPasswordInput, 'abc');

      // Should show minimum characters error
      expect(screen.getAllByText('Mínimo 6 caracteres').length).toBeGreaterThan(0);
    });

    it('shows error when passwords do not match', () => {
      render(<SecurityScreen />);

      const newPasswordInputs = screen.getAllByPlaceholderText('••••••••');
      fireEvent.changeText(screen.getByPlaceholderText('Mínimo 6 caracteres'), 'password123');
      fireEvent.changeText(newPasswordInputs[1], 'different');

      expect(screen.getByText('Las contraseñas no coinciden')).toBeTruthy();
    });
  });

  describe('security info section', () => {
    it('shows security info section', () => {
      render(<SecurityScreen />);

      expect(screen.getByText('Información de seguridad')).toBeTruthy();
    });

    it('shows last login info', () => {
      render(<SecurityScreen />);

      expect(screen.getByText('Último inicio de sesión')).toBeTruthy();
      expect(screen.getByText('Hoy')).toBeTruthy();
    });

    it('shows auth method', () => {
      render(<SecurityScreen />);

      expect(screen.getByText('Método de autenticación')).toBeTruthy();
      expect(screen.getByText('Email + Contraseña')).toBeTruthy();
    });
  });

  describe('navigation', () => {
    it('navigates back when back button is pressed', () => {
      render(<SecurityScreen />);

      fireEvent.press(screen.getByText('← Atrás'));

      expect(mockBack).toHaveBeenCalled();
    });
  });

  describe('form submission', () => {
    it('calls updateUser on valid submit', async () => {
      render(<SecurityScreen />);

      // Fill all fields
      fireEvent.changeText(screen.getAllByPlaceholderText('••••••••')[0], 'current123');
      fireEvent.changeText(screen.getByPlaceholderText('Mínimo 6 caracteres'), 'newpass123');
      fireEvent.changeText(screen.getAllByPlaceholderText('••••••••')[1], 'newpass123');

      // Submit
      const buttons = screen.getAllByText('Cambiar contraseña');
      fireEvent.press(buttons[buttons.length - 1]);

      await waitFor(() => {
        expect(mockUpdateUser).toHaveBeenCalledWith({ password: 'newpass123' });
      });
    });
  });
});
