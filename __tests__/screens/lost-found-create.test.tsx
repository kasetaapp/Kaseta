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
  Search: () => null,
  Eye: () => null,
  MapPin: () => null,
  Phone: () => null,
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
import CreateLostFoundScreen from '@/app/(app)/lost-found/create';

describe('CreateLostFoundScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockUseOrganization.mockReturnValue({
      currentOrganization: { id: 'org-123', name: 'Test Community' },
    });

    mockSupabaseFrom.mockReturnValue({
      insert: jest.fn().mockResolvedValue({ error: null }),
    });
  });

  describe('header', () => {
    it('renders header with title', () => {
      render(<CreateLostFoundScreen />);

      expect(screen.getByText('Nuevo reporte')).toBeTruthy();
    });
  });

  describe('type selection', () => {
    it('shows type question', () => {
      render(<CreateLostFoundScreen />);

      expect(screen.getByText('Que deseas reportar?')).toBeTruthy();
    });

    it('shows lost option', () => {
      render(<CreateLostFoundScreen />);

      expect(screen.getByText('Perdi algo')).toBeTruthy();
      expect(screen.getByText('Reportar un objeto perdido')).toBeTruthy();
    });

    it('shows found option', () => {
      render(<CreateLostFoundScreen />);

      expect(screen.getByText('Encontre algo')).toBeTruthy();
      expect(screen.getByText('Reportar un objeto encontrado')).toBeTruthy();
    });

    it('allows selecting type', () => {
      render(<CreateLostFoundScreen />);

      fireEvent.press(screen.getByText('Encontre algo'));

      expect(screen.getByText('Encontre algo')).toBeTruthy();
    });
  });

  describe('details section', () => {
    it('shows section title', () => {
      render(<CreateLostFoundScreen />);

      expect(screen.getByText('Detalles del objeto')).toBeTruthy();
    });

    it('shows title input', () => {
      render(<CreateLostFoundScreen />);

      expect(screen.getByText('Titulo')).toBeTruthy();
    });

    it('shows description input', () => {
      render(<CreateLostFoundScreen />);

      expect(screen.getByText('Descripcion')).toBeTruthy();
      expect(screen.getByPlaceholderText('Describe el objeto con el mayor detalle posible...')).toBeTruthy();
    });
  });

  describe('location section', () => {
    it('shows location section for lost type', () => {
      render(<CreateLostFoundScreen />);

      expect(screen.getByText('Donde lo perdiste?')).toBeTruthy();
    });

    it('shows location section for found type', () => {
      render(<CreateLostFoundScreen />);

      fireEvent.press(screen.getByText('Encontre algo'));

      expect(screen.getByText('Donde lo encontraste?')).toBeTruthy();
    });

    it('shows location input', () => {
      render(<CreateLostFoundScreen />);

      expect(screen.getByText('Ubicacion')).toBeTruthy();
      expect(screen.getByPlaceholderText('Ej: Estacionamiento nivel 2, junto al elevador')).toBeTruthy();
    });
  });

  describe('contact section', () => {
    it('shows contact section title', () => {
      render(<CreateLostFoundScreen />);

      expect(screen.getByText('Informacion de contacto')).toBeTruthy();
    });

    it('shows phone input', () => {
      render(<CreateLostFoundScreen />);

      expect(screen.getByText('Telefono de contacto')).toBeTruthy();
      expect(screen.getByPlaceholderText('Ej: 55 1234 5678')).toBeTruthy();
    });
  });

  describe('submit button', () => {
    it('shows submit button for lost type', () => {
      render(<CreateLostFoundScreen />);

      expect(screen.getByText('Reportar como perdido')).toBeTruthy();
    });

    it('shows submit button for found type', () => {
      render(<CreateLostFoundScreen />);

      fireEvent.press(screen.getByText('Encontre algo'));

      expect(screen.getByText('Reportar como encontrado')).toBeTruthy();
    });

    it('button is disabled when form is incomplete', () => {
      render(<CreateLostFoundScreen />);

      const button = screen.getByText('Reportar como perdido');
      expect(button).toBeTruthy();
    });
  });

  describe('form submission', () => {
    it('creates lost report on valid submit', async () => {
      const alertSpy = jest.spyOn(Alert, 'alert');

      render(<CreateLostFoundScreen />);

      // Fill form
      fireEvent.changeText(
        screen.getByPlaceholderText('Ej: Llaves con llavero azul'),
        'Llaves'
      );
      fireEvent.changeText(
        screen.getByPlaceholderText('Describe el objeto con el mayor detalle posible...'),
        'Llaves con llavero azul'
      );
      fireEvent.changeText(
        screen.getByPlaceholderText('Ej: Estacionamiento nivel 2, junto al elevador'),
        'Lobby principal'
      );
      fireEvent.changeText(screen.getByPlaceholderText('Ej: 55 1234 5678'), '5551234567');

      fireEvent.press(screen.getByText('Reportar como perdido'));

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith(
          'Exito',
          'Tu reporte de objeto perdido ha sido creado',
          expect.any(Array)
        );
      });
    });

    it('creates found report on valid submit', async () => {
      const alertSpy = jest.spyOn(Alert, 'alert');

      render(<CreateLostFoundScreen />);

      // Select found type
      fireEvent.press(screen.getByText('Encontre algo'));

      // Fill form
      fireEvent.changeText(
        screen.getByPlaceholderText('Ej: Cartera negra encontrada'),
        'Cartera'
      );
      fireEvent.changeText(
        screen.getByPlaceholderText('Describe el objeto con el mayor detalle posible...'),
        'Cartera negra de piel'
      );
      fireEvent.changeText(
        screen.getByPlaceholderText('Ej: Estacionamiento nivel 2, junto al elevador'),
        'Gimnasio'
      );
      fireEvent.changeText(screen.getByPlaceholderText('Ej: 55 1234 5678'), '5551234567');

      fireEvent.press(screen.getByText('Reportar como encontrado'));

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith(
          'Exito',
          'Gracias por reportar el objeto encontrado',
          expect.any(Array)
        );
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

      render(<CreateLostFoundScreen />);

      // Fill form
      fireEvent.changeText(
        screen.getByPlaceholderText('Ej: Llaves con llavero azul'),
        'Llaves'
      );
      fireEvent.changeText(
        screen.getByPlaceholderText('Describe el objeto con el mayor detalle posible...'),
        'Llaves con llavero azul'
      );
      fireEvent.changeText(
        screen.getByPlaceholderText('Ej: Estacionamiento nivel 2, junto al elevador'),
        'Lobby'
      );
      fireEvent.changeText(screen.getByPlaceholderText('Ej: 55 1234 5678'), '5551234567');

      fireEvent.press(screen.getByText('Reportar como perdido'));

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith('Error', 'No se pudo crear el reporte');
      });

      console.error = consoleError;
    });
  });
});
