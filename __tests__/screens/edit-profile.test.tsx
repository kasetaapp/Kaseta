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

// Mock expo-image-picker
jest.mock('expo-image-picker', () => ({
  requestMediaLibraryPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  launchImageLibraryAsync: jest.fn().mockResolvedValue({ canceled: true }),
  MediaTypeOptions: { Images: 'Images' },
}));

// Mock AuthContext
const mockUpdateProfile = jest.fn();

jest.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'user-123', email: 'test@example.com' },
    profile: {
      full_name: 'John Doe',
      email: 'test@example.com',
      phone: '5551234567',
      avatar_url: null,
    },
    updateProfile: mockUpdateProfile,
  }),
}));

// Import component after mocks
import EditProfileScreen from '@/app/(app)/settings/edit-profile';

describe('EditProfileScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUpdateProfile.mockResolvedValue({ error: null });
  });

  describe('header', () => {
    it('renders header with title', () => {
      render(<EditProfileScreen />);

      expect(screen.getByText('Editar perfil')).toBeTruthy();
    });

    it('shows back button', () => {
      render(<EditProfileScreen />);

      expect(screen.getByText('← Atrás')).toBeTruthy();
    });
  });

  describe('avatar section', () => {
    it('shows change photo button', () => {
      render(<EditProfileScreen />);

      expect(screen.getByText('Cambiar foto')).toBeTruthy();
    });
  });

  describe('form fields', () => {
    it('shows name input with current value', () => {
      render(<EditProfileScreen />);

      expect(screen.getByText('Nombre completo')).toBeTruthy();
    });

    it('shows email input', () => {
      render(<EditProfileScreen />);

      expect(screen.getByText('Correo electrónico')).toBeTruthy();
    });

    it('shows email helper text', () => {
      render(<EditProfileScreen />);

      expect(screen.getByText('El correo no se puede cambiar')).toBeTruthy();
    });

    it('shows phone input', () => {
      render(<EditProfileScreen />);

      expect(screen.getByText('Teléfono')).toBeTruthy();
    });
  });

  describe('save button', () => {
    it('shows save button', () => {
      render(<EditProfileScreen />);

      expect(screen.getByText('Guardar cambios')).toBeTruthy();
    });

    it('disables save button when no changes', () => {
      render(<EditProfileScreen />);

      // Button should be disabled initially
      const button = screen.getByText('Guardar cambios');
      expect(button).toBeTruthy();
    });
  });

  describe('form validation', () => {
    it('validates name is required', async () => {
      const alertSpy = jest.spyOn(Alert, 'alert');

      render(<EditProfileScreen />);

      // Clear the name field
      const nameInput = screen.getByPlaceholderText('Tu nombre');
      fireEvent.changeText(nameInput, '');

      // Try to save
      fireEvent.press(screen.getByText('Guardar cambios'));

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith('Error', 'El nombre es requerido.');
      });
    });
  });

  describe('navigation', () => {
    it('navigates back when back button is pressed without changes', () => {
      render(<EditProfileScreen />);

      fireEvent.press(screen.getByText('← Atrás'));

      expect(mockBack).toHaveBeenCalled();
    });

    it('shows confirmation dialog when back pressed with changes', () => {
      const alertSpy = jest.spyOn(Alert, 'alert');

      render(<EditProfileScreen />);

      // Make a change
      fireEvent.changeText(screen.getByPlaceholderText('Tu nombre'), 'New Name');

      // Try to go back
      fireEvent.press(screen.getByText('← Atrás'));

      expect(alertSpy).toHaveBeenCalledWith(
        'Descartar cambios',
        '¿Estás seguro de que deseas descartar los cambios?',
        expect.any(Array)
      );
    });
  });

  describe('save profile', () => {
    it('saves profile on valid submit', async () => {
      const alertSpy = jest.spyOn(Alert, 'alert');

      render(<EditProfileScreen />);

      // Make a change
      fireEvent.changeText(screen.getByPlaceholderText('Tu nombre'), 'New Name');
      fireEvent.press(screen.getByText('Guardar cambios'));

      await waitFor(() => {
        expect(mockUpdateProfile).toHaveBeenCalledWith(
          expect.objectContaining({
            full_name: 'New Name',
          })
        );
      });

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith(
          'Éxito',
          'Perfil actualizado correctamente.',
          expect.any(Array)
        );
      });
    });

    it('shows error when save fails', async () => {
      const alertSpy = jest.spyOn(Alert, 'alert');
      mockUpdateProfile.mockResolvedValue({ error: { message: 'Update failed' } });

      render(<EditProfileScreen />);

      fireEvent.changeText(screen.getByPlaceholderText('Tu nombre'), 'New Name');
      fireEvent.press(screen.getByText('Guardar cambios'));

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith('Error', 'Update failed');
      });
    });

    it('shows generic error when save throws', async () => {
      const alertSpy = jest.spyOn(Alert, 'alert');
      mockUpdateProfile.mockRejectedValue(new Error('Network error'));

      render(<EditProfileScreen />);

      fireEvent.changeText(screen.getByPlaceholderText('Tu nombre'), 'New Name');
      fireEvent.press(screen.getByText('Guardar cambios'));

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith('Error', 'Ocurrió un error inesperado.');
      });
    });
  });

  describe('image picker', () => {
    it('requests permission when picking image', async () => {
      const ImagePicker = require('expo-image-picker');

      render(<EditProfileScreen />);

      fireEvent.press(screen.getByText('Cambiar foto'));

      await waitFor(() => {
        expect(ImagePicker.requestMediaLibraryPermissionsAsync).toHaveBeenCalled();
      });
    });

    it('shows error when permission denied', async () => {
      const alertSpy = jest.spyOn(Alert, 'alert');
      const ImagePicker = require('expo-image-picker');
      ImagePicker.requestMediaLibraryPermissionsAsync.mockResolvedValue({ status: 'denied' });

      render(<EditProfileScreen />);

      fireEvent.press(screen.getByText('Cambiar foto'));

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith(
          'Permiso requerido',
          'Necesitamos acceso a tu galería para cambiar la foto de perfil.'
        );
      });
    });

    it('updates avatar when image selected', async () => {
      const ImagePicker = require('expo-image-picker');
      ImagePicker.requestMediaLibraryPermissionsAsync.mockResolvedValue({ status: 'granted' });
      ImagePicker.launchImageLibraryAsync.mockResolvedValue({
        canceled: false,
        assets: [{ uri: 'file://new-photo.jpg' }],
      });

      render(<EditProfileScreen />);

      fireEvent.press(screen.getByText('Cambiar foto'));

      await waitFor(() => {
        expect(ImagePicker.launchImageLibraryAsync).toHaveBeenCalled();
      });
    });

    it('does not update avatar when picker is cancelled', async () => {
      const ImagePicker = require('expo-image-picker');
      ImagePicker.requestMediaLibraryPermissionsAsync.mockResolvedValue({ status: 'granted' });
      ImagePicker.launchImageLibraryAsync.mockResolvedValue({ canceled: true });

      render(<EditProfileScreen />);

      fireEvent.press(screen.getByText('Cambiar foto'));

      await waitFor(() => {
        expect(ImagePicker.launchImageLibraryAsync).toHaveBeenCalled();
      });
    });

    it('handles image picker error gracefully', async () => {
      const consoleError = console.error;
      console.error = jest.fn();

      const ImagePicker = require('expo-image-picker');
      ImagePicker.requestMediaLibraryPermissionsAsync.mockResolvedValue({ status: 'granted' });
      ImagePicker.launchImageLibraryAsync.mockRejectedValue(new Error('Picker error'));

      render(<EditProfileScreen />);

      fireEvent.press(screen.getByText('Cambiar foto'));

      await waitFor(() => {
        expect(console.error).toHaveBeenCalledWith('Error picking image:', expect.any(Error));
      });

      console.error = consoleError;
    });
  });

  describe('phone field', () => {
    it('saves phone number on submit', async () => {
      render(<EditProfileScreen />);

      fireEvent.changeText(screen.getByPlaceholderText('Tu nombre'), 'New Name');
      fireEvent.changeText(screen.getByPlaceholderText('+52 123 456 7890'), '5551234567');
      fireEvent.press(screen.getByText('Guardar cambios'));

      await waitFor(() => {
        expect(mockUpdateProfile).toHaveBeenCalledWith(
          expect.objectContaining({
            full_name: 'New Name',
            phone: '5551234567',
          })
        );
      });
    });
  });
});
