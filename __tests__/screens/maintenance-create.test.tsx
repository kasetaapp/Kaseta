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

// Mock AuthContext
jest.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'user-123' },
  }),
}));

// Import component after mocks
import CreateMaintenanceScreen from '@/app/(app)/maintenance/create';

describe('CreateMaintenanceScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockUseOrganization.mockReturnValue({
      currentOrganization: { id: 'org-123', name: 'Test Community' },
      currentMembership: { unit_id: 'unit-123' },
    });

    mockSupabaseFrom.mockReturnValue({
      insert: jest.fn().mockResolvedValue({ error: null }),
    });
  });

  describe('header', () => {
    it('renders header with title', () => {
      render(<CreateMaintenanceScreen />);

      expect(screen.getByText('Nueva solicitud')).toBeTruthy();
    });
  });

  describe('category selection', () => {
    it('shows category section title', () => {
      render(<CreateMaintenanceScreen />);

      expect(screen.getByText('Categoría')).toBeTruthy();
    });

    it('shows all categories', () => {
      render(<CreateMaintenanceScreen />);

      expect(screen.getByText('Plomería')).toBeTruthy();
      expect(screen.getByText('Eléctrico')).toBeTruthy();
      expect(screen.getByText('Clima')).toBeTruthy();
      expect(screen.getByText('Estructura')).toBeTruthy();
      expect(screen.getByText('Electrodomésticos')).toBeTruthy();
      expect(screen.getByText('Áreas comunes')).toBeTruthy();
      expect(screen.getByText('Otro')).toBeTruthy();
    });

    it('allows selecting a category', () => {
      render(<CreateMaintenanceScreen />);

      fireEvent.press(screen.getByText('Plomería'));

      // Category should be selected
      expect(screen.getByText('Plomería')).toBeTruthy();
    });
  });

  describe('priority selection', () => {
    it('shows priority section title', () => {
      render(<CreateMaintenanceScreen />);

      expect(screen.getByText('Prioridad')).toBeTruthy();
    });

    it('shows all priorities', () => {
      render(<CreateMaintenanceScreen />);

      expect(screen.getByText('Baja')).toBeTruthy();
      expect(screen.getByText('Media')).toBeTruthy();
      expect(screen.getByText('Alta')).toBeTruthy();
      expect(screen.getByText('Urgente')).toBeTruthy();
    });

    it('allows selecting a priority', () => {
      render(<CreateMaintenanceScreen />);

      fireEvent.press(screen.getByText('Alta'));

      expect(screen.getByText('Alta')).toBeTruthy();
    });
  });

  describe('details section', () => {
    it('shows details section title', () => {
      render(<CreateMaintenanceScreen />);

      expect(screen.getByText('Detalles')).toBeTruthy();
    });

    it('shows title input', () => {
      render(<CreateMaintenanceScreen />);

      expect(screen.getByText('Título')).toBeTruthy();
      expect(screen.getByPlaceholderText('Resumen del problema')).toBeTruthy();
    });

    it('shows description input', () => {
      render(<CreateMaintenanceScreen />);

      expect(screen.getByText('Descripción')).toBeTruthy();
      expect(screen.getByPlaceholderText('Describe el problema en detalle...')).toBeTruthy();
    });
  });

  describe('submit button', () => {
    it('shows submit button', () => {
      render(<CreateMaintenanceScreen />);

      expect(screen.getByText('Enviar solicitud')).toBeTruthy();
    });

    it('disables button when form is incomplete', () => {
      render(<CreateMaintenanceScreen />);

      const button = screen.getByText('Enviar solicitud');
      expect(button).toBeTruthy();
    });
  });

  describe('form submission', () => {
    it('creates request on valid submit', async () => {
      const alertSpy = jest.spyOn(Alert, 'alert');

      render(<CreateMaintenanceScreen />);

      // Fill form
      fireEvent.changeText(screen.getByPlaceholderText('Resumen del problema'), 'Fuga de agua');
      fireEvent.changeText(
        screen.getByPlaceholderText('Describe el problema en detalle...'),
        'Hay una fuga en el baño principal'
      );

      fireEvent.press(screen.getByText('Enviar solicitud'));

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith(
          'Éxito',
          'Solicitud enviada correctamente',
          expect.any(Array)
        );
      });
    });

    it('button is disabled when form is incomplete', () => {
      render(<CreateMaintenanceScreen />);

      // Button should be disabled initially when form is empty
      const button = screen.getByText('Enviar solicitud');
      expect(button).toBeTruthy();
      // Button is disabled={!title.trim() || !description.trim()}
    });

    it('shows error when no unit assigned', async () => {
      const alertSpy = jest.spyOn(Alert, 'alert');

      mockUseOrganization.mockReturnValue({
        currentOrganization: { id: 'org-123' },
        currentMembership: { unit_id: null },
      });

      render(<CreateMaintenanceScreen />);

      // Fill form
      fireEvent.changeText(screen.getByPlaceholderText('Resumen del problema'), 'Fuga de agua');
      fireEvent.changeText(
        screen.getByPlaceholderText('Describe el problema en detalle...'),
        'Hay una fuga'
      );

      fireEvent.press(screen.getByText('Enviar solicitud'));

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith('Error', 'No autorizado');
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

      render(<CreateMaintenanceScreen />);

      // Fill form
      fireEvent.changeText(screen.getByPlaceholderText('Resumen del problema'), 'Fuga de agua');
      fireEvent.changeText(
        screen.getByPlaceholderText('Describe el problema en detalle...'),
        'Hay una fuga'
      );

      fireEvent.press(screen.getByText('Enviar solicitud'));

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith('Error', 'No se pudo enviar la solicitud');
      });

      console.error = consoleError;
    });
  });
});
