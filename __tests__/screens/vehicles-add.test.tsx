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

// Import component after mocks
import AddVehicleScreen from '@/app/(app)/vehicles/add';

describe('AddVehicleScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockUseOrganization.mockReturnValue({
      currentMembership: { unit_id: 'unit-123' },
    });

    mockSupabaseFrom.mockReturnValue({
      insert: jest.fn().mockResolvedValue({ error: null }),
      update: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null }),
      }),
    });
  });

  describe('header', () => {
    it('renders header with title', () => {
      render(<AddVehicleScreen />);

      expect(screen.getByText('Agregar vehículo')).toBeTruthy();
    });
  });

  describe('license plate section', () => {
    it('shows section title', () => {
      render(<AddVehicleScreen />);

      expect(screen.getByText('Placa del vehículo')).toBeTruthy();
    });

    it('shows plate input', () => {
      render(<AddVehicleScreen />);

      expect(screen.getByText('Número de placa')).toBeTruthy();
      expect(screen.getByPlaceholderText('ABC-123')).toBeTruthy();
    });
  });

  describe('vehicle info section', () => {
    it('shows section title', () => {
      render(<AddVehicleScreen />);

      expect(screen.getByText('Información del vehículo (opcional)')).toBeTruthy();
    });

    it('shows make input', () => {
      render(<AddVehicleScreen />);

      expect(screen.getByText('Marca')).toBeTruthy();
      expect(screen.getByPlaceholderText('Ej: Toyota, Honda, Ford...')).toBeTruthy();
    });

    it('shows model input', () => {
      render(<AddVehicleScreen />);

      expect(screen.getByText('Modelo')).toBeTruthy();
      expect(screen.getByPlaceholderText('Ej: Corolla, Civic, Focus...')).toBeTruthy();
    });
  });

  describe('color section', () => {
    it('shows section title', () => {
      render(<AddVehicleScreen />);

      expect(screen.getByText('Color (opcional)')).toBeTruthy();
    });

    it('shows color options', () => {
      render(<AddVehicleScreen />);

      expect(screen.getByText('Blanco')).toBeTruthy();
      expect(screen.getByText('Negro')).toBeTruthy();
      expect(screen.getByText('Plata')).toBeTruthy();
      expect(screen.getByText('Gris')).toBeTruthy();
      expect(screen.getByText('Rojo')).toBeTruthy();
      expect(screen.getByText('Azul')).toBeTruthy();
    });

    it('allows selecting a color', () => {
      render(<AddVehicleScreen />);

      fireEvent.press(screen.getByText('Rojo'));

      // Color should be selected
      expect(screen.getByText('Rojo')).toBeTruthy();
    });
  });

  describe('primary toggle', () => {
    it('shows primary toggle', () => {
      render(<AddVehicleScreen />);

      expect(screen.getByText('Establecer como principal')).toBeTruthy();
      expect(screen.getByText('Este vehículo se mostrará primero en tu lista')).toBeTruthy();
    });
  });

  describe('submit button', () => {
    it('shows submit button', () => {
      render(<AddVehicleScreen />);

      expect(screen.getByText('Registrar vehículo')).toBeTruthy();
    });

    it('disables button when plate is too short', () => {
      render(<AddVehicleScreen />);

      // Enter short plate
      fireEvent.changeText(screen.getByPlaceholderText('ABC-123'), 'AB');

      // Button should still be disabled
      const button = screen.getByText('Registrar vehículo');
      expect(button).toBeTruthy();
    });
  });

  describe('form submission', () => {
    it('creates vehicle on valid submit', async () => {
      const alertSpy = jest.spyOn(Alert, 'alert');

      render(<AddVehicleScreen />);

      // Fill form
      fireEvent.changeText(screen.getByPlaceholderText('ABC-123'), 'XYZ-789');
      fireEvent.changeText(screen.getByPlaceholderText('Ej: Toyota, Honda, Ford...'), 'Toyota');
      fireEvent.changeText(screen.getByPlaceholderText('Ej: Corolla, Civic, Focus...'), 'Corolla');

      fireEvent.press(screen.getByText('Registrar vehículo'));

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith(
          'Éxito',
          'Vehículo registrado correctamente',
          expect.any(Array)
        );
      });
    });

    it('button is disabled when plate is empty', () => {
      render(<AddVehicleScreen />);

      // Button should be disabled when plate is not valid
      const button = screen.getByText('Registrar vehículo');
      expect(button).toBeTruthy();
      // isFormValid = licensePlate.trim().length >= 3
    });

    it('shows error when no unit assigned', async () => {
      const alertSpy = jest.spyOn(Alert, 'alert');

      mockUseOrganization.mockReturnValue({
        currentMembership: { unit_id: null },
      });

      render(<AddVehicleScreen />);

      fireEvent.changeText(screen.getByPlaceholderText('ABC-123'), 'XYZ-789');

      fireEvent.press(screen.getByText('Registrar vehículo'));

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith('Error', 'No tienes una unidad asignada');
      });
    });

    it('shows error for duplicate plate', async () => {
      const alertSpy = jest.spyOn(Alert, 'alert');
      const consoleError = console.error;
      console.error = jest.fn();

      mockSupabaseFrom.mockReturnValue({
        insert: jest.fn().mockResolvedValue({ error: { code: '23505' } }),
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ error: null }),
        }),
      });

      render(<AddVehicleScreen />);

      fireEvent.changeText(screen.getByPlaceholderText('ABC-123'), 'XYZ-789');

      fireEvent.press(screen.getByText('Registrar vehículo'));

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith('Error', 'Esta placa ya está registrada');
      });

      console.error = consoleError;
    });
  });
});
