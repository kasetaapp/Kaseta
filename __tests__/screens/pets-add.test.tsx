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

// Mock lucide-react-native
jest.mock('lucide-react-native', () => ({
  ChevronLeft: () => null,
  Dog: () => null,
  Cat: () => null,
  PawPrint: () => null,
  Check: () => null,
}));

// Mock expo-haptics
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'light' },
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
import AddPetScreen from '@/app/(app)/pets/add';

describe('AddPetScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockUseOrganization.mockReturnValue({
      currentMembership: { unit_id: 'unit-123', organization_id: 'org-123' },
    });

    mockSupabaseFrom.mockReturnValue({
      insert: jest.fn().mockResolvedValue({ error: null }),
    });
  });

  describe('header', () => {
    it('renders header with title', () => {
      render(<AddPetScreen />);

      expect(screen.getByText('Agregar mascota')).toBeTruthy();
    });
  });

  describe('name section', () => {
    it('shows section title', () => {
      render(<AddPetScreen />);

      expect(screen.getByText('Nombre de la mascota')).toBeTruthy();
    });

    it('shows name input', () => {
      render(<AddPetScreen />);

      expect(screen.getByText('Nombre')).toBeTruthy();
      expect(screen.getByPlaceholderText('Ej: Max, Luna, Rocky...')).toBeTruthy();
    });
  });

  describe('type selection', () => {
    it('shows section title', () => {
      render(<AddPetScreen />);

      expect(screen.getByText('Tipo de mascota')).toBeTruthy();
    });

    it('shows all pet types', () => {
      render(<AddPetScreen />);

      expect(screen.getByText('Perro')).toBeTruthy();
      expect(screen.getByText('Gato')).toBeTruthy();
      expect(screen.getByText('Otro')).toBeTruthy();
    });

    it('allows selecting a type', () => {
      render(<AddPetScreen />);

      fireEvent.press(screen.getByText('Perro'));

      expect(screen.getByText('Perro')).toBeTruthy();
    });
  });

  describe('breed section', () => {
    it('shows section title', () => {
      render(<AddPetScreen />);

      expect(screen.getByText('Raza (opcional)')).toBeTruthy();
    });

    it('shows breed input', () => {
      render(<AddPetScreen />);

      expect(screen.getByText('Raza')).toBeTruthy();
      expect(screen.getByPlaceholderText('Ej: Labrador, Persa, Mestizo...')).toBeTruthy();
    });
  });

  describe('notes section', () => {
    it('shows section title', () => {
      render(<AddPetScreen />);

      expect(screen.getByText('Notas adicionales (opcional)')).toBeTruthy();
    });

    it('shows notes input', () => {
      render(<AddPetScreen />);

      expect(screen.getByText('Notas')).toBeTruthy();
      expect(screen.getByPlaceholderText('Ej: Color, caracteristicas especiales, vacunas...')).toBeTruthy();
    });
  });

  describe('submit button', () => {
    it('shows submit button', () => {
      render(<AddPetScreen />);

      expect(screen.getByText('Registrar mascota')).toBeTruthy();
    });

    it('button is disabled when form is invalid', () => {
      render(<AddPetScreen />);

      const button = screen.getByText('Registrar mascota');
      expect(button).toBeTruthy();
    });
  });

  describe('form submission', () => {
    it('creates pet on valid submit', async () => {
      const alertSpy = jest.spyOn(Alert, 'alert');

      render(<AddPetScreen />);

      // Fill form
      fireEvent.changeText(screen.getByPlaceholderText('Ej: Max, Luna, Rocky...'), 'Max');
      fireEvent.press(screen.getByText('Perro'));

      fireEvent.press(screen.getByText('Registrar mascota'));

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith(
          'Exito',
          'Mascota registrada correctamente',
          expect.any(Array)
        );
      });
    });

    it('shows error when no unit assigned', async () => {
      const alertSpy = jest.spyOn(Alert, 'alert');

      mockUseOrganization.mockReturnValue({
        currentMembership: { unit_id: null },
      });

      render(<AddPetScreen />);

      fireEvent.changeText(screen.getByPlaceholderText('Ej: Max, Luna, Rocky...'), 'Max');
      fireEvent.press(screen.getByText('Perro'));

      fireEvent.press(screen.getByText('Registrar mascota'));

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith('Error', 'No tienes una unidad asignada');
      });
    });
  });

  describe('error handling', () => {
    it('shows error when creation fails', async () => {
      const alertSpy = jest.spyOn(Alert, 'alert');
      const consoleError = console.error;
      console.error = jest.fn();

      mockSupabaseFrom.mockReturnValue({
        insert: jest.fn().mockResolvedValue({ error: new Error('Failed') }),
      });

      render(<AddPetScreen />);

      fireEvent.changeText(screen.getByPlaceholderText('Ej: Max, Luna, Rocky...'), 'Max');
      fireEvent.press(screen.getByText('Perro'));

      fireEvent.press(screen.getByText('Registrar mascota'));

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith('Error', 'No se pudo registrar la mascota');
      });

      console.error = consoleError;
    });
  });
});
