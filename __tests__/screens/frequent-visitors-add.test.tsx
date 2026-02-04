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
  User: () => null,
  Phone: () => null,
  Mail: () => null,
  FileText: () => null,
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
import AddFrequentVisitorScreen from '@/app/(app)/frequent-visitors/add';

describe('AddFrequentVisitorScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockUseOrganization.mockReturnValue({
      currentMembership: { unit_id: 'unit-123' },
    });

    mockSupabaseFrom.mockReturnValue({
      insert: jest.fn().mockResolvedValue({ error: null }),
    });
  });

  describe('header', () => {
    it('renders header with title', () => {
      render(<AddFrequentVisitorScreen />);

      expect(screen.getByText('Nuevo visitante')).toBeTruthy();
    });
  });

  describe('form fields', () => {
    it('shows section title', () => {
      render(<AddFrequentVisitorScreen />);

      expect(screen.getByText('Información del visitante')).toBeTruthy();
    });

    it('shows name input', () => {
      render(<AddFrequentVisitorScreen />);

      expect(screen.getByText('Nombre completo')).toBeTruthy();
      expect(screen.getByPlaceholderText('Juan Pérez')).toBeTruthy();
    });

    it('shows phone input', () => {
      render(<AddFrequentVisitorScreen />);

      expect(screen.getByText('Teléfono (opcional)')).toBeTruthy();
      expect(screen.getByPlaceholderText('+52 123 456 7890')).toBeTruthy();
    });

    it('shows email input', () => {
      render(<AddFrequentVisitorScreen />);

      expect(screen.getByText('Email (opcional)')).toBeTruthy();
      expect(screen.getByPlaceholderText('juan@email.com')).toBeTruthy();
    });

    it('shows notes input', () => {
      render(<AddFrequentVisitorScreen />);

      expect(screen.getByText('Notas (opcional)')).toBeTruthy();
      expect(screen.getByPlaceholderText('Ej: Familiar, proveedor de servicios...')).toBeTruthy();
    });
  });

  describe('submit button', () => {
    it('shows submit button', () => {
      render(<AddFrequentVisitorScreen />);

      expect(screen.getByText('Guardar visitante')).toBeTruthy();
    });

    it('button is disabled when name is too short', () => {
      render(<AddFrequentVisitorScreen />);

      fireEvent.changeText(screen.getByPlaceholderText('Juan Pérez'), 'J');

      const button = screen.getByText('Guardar visitante');
      expect(button).toBeTruthy();
    });
  });

  describe('form submission', () => {
    it('creates visitor on valid submit', async () => {
      const alertSpy = jest.spyOn(Alert, 'alert');

      render(<AddFrequentVisitorScreen />);

      fireEvent.changeText(screen.getByPlaceholderText('Juan Pérez'), 'Juan Pérez');
      fireEvent.changeText(screen.getByPlaceholderText('+52 123 456 7890'), '5551234567');

      fireEvent.press(screen.getByText('Guardar visitante'));

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith(
          'Éxito',
          'Visitante guardado correctamente',
          expect.any(Array)
        );
      });
    });

    it('shows error when no unit assigned', async () => {
      const alertSpy = jest.spyOn(Alert, 'alert');

      mockUseOrganization.mockReturnValue({
        currentMembership: { unit_id: null },
      });

      render(<AddFrequentVisitorScreen />);

      fireEvent.changeText(screen.getByPlaceholderText('Juan Pérez'), 'Juan Pérez');

      fireEvent.press(screen.getByText('Guardar visitante'));

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

      render(<AddFrequentVisitorScreen />);

      fireEvent.changeText(screen.getByPlaceholderText('Juan Pérez'), 'Juan Pérez');

      fireEvent.press(screen.getByText('Guardar visitante'));

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith('Error', 'No se pudo guardar el visitante');
      });

      console.error = consoleError;
    });
  });
});
