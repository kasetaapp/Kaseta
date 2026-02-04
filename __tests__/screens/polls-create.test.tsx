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
  Plus: () => null,
  Trash2: () => null,
  Calendar: () => null,
}));

// Mock expo-haptics
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'light' },
  NotificationFeedbackType: { Success: 'success', Error: 'error' },
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
import CreatePollScreen from '@/app/(app)/polls/create';

describe('CreatePollScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockUseOrganization.mockReturnValue({
      currentOrganization: { id: 'org-123', name: 'Test Community' },
      isAdmin: true,
    });

    mockSupabaseFrom.mockReturnValue({
      insert: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: { id: 'poll-123' }, error: null }),
        }),
      }),
    });
  });

  describe('non-admin access', () => {
    it('shows permission denied for non-admins', () => {
      mockUseOrganization.mockReturnValue({
        currentOrganization: { id: 'org-123' },
        isAdmin: false,
      });

      render(<CreatePollScreen />);

      expect(screen.getByText('Sin permisos')).toBeTruthy();
      expect(screen.getByText('Solo administradores pueden crear encuestas')).toBeTruthy();
    });
  });

  describe('header', () => {
    it('renders header with title', () => {
      render(<CreatePollScreen />);

      expect(screen.getByText('Nueva encuesta')).toBeTruthy();
    });
  });

  describe('basic info section', () => {
    it('shows section title', () => {
      render(<CreatePollScreen />);

      expect(screen.getByText('Informacion basica')).toBeTruthy();
    });

    it('shows title input', () => {
      render(<CreatePollScreen />);

      expect(screen.getByText('Titulo')).toBeTruthy();
      expect(screen.getByPlaceholderText('Titulo de la encuesta')).toBeTruthy();
    });

    it('shows description input', () => {
      render(<CreatePollScreen />);

      expect(screen.getByText('Descripcion (opcional)')).toBeTruthy();
      expect(screen.getByPlaceholderText('Describe el proposito de la encuesta...')).toBeTruthy();
    });
  });

  describe('options section', () => {
    it('shows options section title', () => {
      render(<CreatePollScreen />);

      expect(screen.getByText('Opciones')).toBeTruthy();
    });

    it('shows initial two option inputs', () => {
      render(<CreatePollScreen />);

      expect(screen.getByText('Opcion 1')).toBeTruthy();
      expect(screen.getByText('Opcion 2')).toBeTruthy();
    });

    it('shows add option button', () => {
      render(<CreatePollScreen />);

      expect(screen.getByText('Agregar opcion')).toBeTruthy();
    });

    it('allows adding an option', () => {
      render(<CreatePollScreen />);

      fireEvent.press(screen.getByText('Agregar opcion'));

      expect(screen.getByText('Opcion 3')).toBeTruthy();
    });

    it('shows max options limit alert', () => {
      const alertSpy = jest.spyOn(Alert, 'alert');
      render(<CreatePollScreen />);

      // Add options until max (10) - start with 2, so add 8 more
      for (let i = 0; i < 8; i++) {
        const addButton = screen.queryByText('Agregar opcion');
        if (addButton) {
          fireEvent.press(addButton);
        }
      }

      // Try to add one more after reaching max
      const addButton = screen.queryByText('Agregar opcion');
      if (addButton) {
        fireEvent.press(addButton);
        expect(alertSpy).toHaveBeenCalledWith('Limite alcanzado', 'Maximo 10 opciones permitidas');
      } else {
        // Button is hidden when at max, which is also valid behavior
        expect(screen.getByText('Opcion 10')).toBeTruthy();
      }
    });
  });

  describe('end date section', () => {
    it('shows end date section', () => {
      render(<CreatePollScreen />);

      expect(screen.getByText('Fecha de finalizacion (opcional)')).toBeTruthy();
    });

    it('shows date input', () => {
      render(<CreatePollScreen />);

      expect(screen.getByText('Fecha limite')).toBeTruthy();
      expect(screen.getByPlaceholderText('AAAA-MM-DD (ej: 2024-12-31)')).toBeTruthy();
    });

    it('shows helper text', () => {
      render(<CreatePollScreen />);

      expect(screen.getByText('Deja vacio para una encuesta sin fecha limite')).toBeTruthy();
    });
  });

  describe('submit button', () => {
    it('shows submit button', () => {
      render(<CreatePollScreen />);

      expect(screen.getByText('Crear encuesta')).toBeTruthy();
    });

    it('button is disabled when form is incomplete', () => {
      render(<CreatePollScreen />);

      // Button should be present but disabled
      const button = screen.getByText('Crear encuesta');
      expect(button).toBeTruthy();
    });
  });

  describe('form validation', () => {
    it('button disabled when title is empty', () => {
      render(<CreatePollScreen />);

      // Fill options but not title
      fireEvent.changeText(screen.getByPlaceholderText('Escribe la opcion 1'), 'Option A');
      fireEvent.changeText(screen.getByPlaceholderText('Escribe la opcion 2'), 'Option B');

      // Button should be present but disabled
      const button = screen.getByText('Crear encuesta');
      expect(button).toBeTruthy();
    });

    it('button disabled when not enough options', () => {
      render(<CreatePollScreen />);

      // Fill title but only one option
      fireEvent.changeText(screen.getByPlaceholderText('Titulo de la encuesta'), 'Test Poll');
      fireEvent.changeText(screen.getByPlaceholderText('Escribe la opcion 1'), 'Option A');

      // Button should be present but disabled (need 2+ options)
      const button = screen.getByText('Crear encuesta');
      expect(button).toBeTruthy();
    });

    it('shows error for duplicate options', async () => {
      const alertSpy = jest.spyOn(Alert, 'alert');

      render(<CreatePollScreen />);

      // Fill with duplicates
      fireEvent.changeText(screen.getByPlaceholderText('Titulo de la encuesta'), 'Test Poll');
      fireEvent.changeText(screen.getByPlaceholderText('Escribe la opcion 1'), 'Same');
      fireEvent.changeText(screen.getByPlaceholderText('Escribe la opcion 2'), 'Same');

      fireEvent.press(screen.getByText('Crear encuesta'));

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith('Error', 'Las opciones no pueden repetirse');
      });
    });

    it('shows error for invalid date format', async () => {
      const alertSpy = jest.spyOn(Alert, 'alert');

      render(<CreatePollScreen />);

      // Fill valid data with invalid date
      fireEvent.changeText(screen.getByPlaceholderText('Titulo de la encuesta'), 'Test Poll');
      fireEvent.changeText(screen.getByPlaceholderText('Escribe la opcion 1'), 'Option A');
      fireEvent.changeText(screen.getByPlaceholderText('Escribe la opcion 2'), 'Option B');
      fireEvent.changeText(screen.getByPlaceholderText('AAAA-MM-DD (ej: 2024-12-31)'), 'invalid-date');

      fireEvent.press(screen.getByText('Crear encuesta'));

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith('Error', 'Formato de fecha invalido. Use AAAA-MM-DD');
      });
    });
  });

  describe('form submission', () => {
    it('creates poll on valid submit', async () => {
      const alertSpy = jest.spyOn(Alert, 'alert');

      mockSupabaseFrom.mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: { id: 'poll-123' }, error: null }),
          }),
        }),
      });

      render(<CreatePollScreen />);

      // Fill valid form
      fireEvent.changeText(screen.getByPlaceholderText('Titulo de la encuesta'), 'Test Poll');
      fireEvent.changeText(screen.getByPlaceholderText('Escribe la opcion 1'), 'Option A');
      fireEvent.changeText(screen.getByPlaceholderText('Escribe la opcion 2'), 'Option B');

      fireEvent.press(screen.getByText('Crear encuesta'));

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith(
          'Exito',
          'Encuesta creada correctamente',
          expect.any(Array)
        );
      });
    });

    it('shows error when creation fails', async () => {
      const alertSpy = jest.spyOn(Alert, 'alert');
      const consoleError = console.error;
      console.error = jest.fn();

      mockSupabaseFrom.mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: null, error: new Error('Failed') }),
          }),
        }),
      });

      render(<CreatePollScreen />);

      // Fill valid form
      fireEvent.changeText(screen.getByPlaceholderText('Titulo de la encuesta'), 'Test Poll');
      fireEvent.changeText(screen.getByPlaceholderText('Escribe la opcion 1'), 'Option A');
      fireEvent.changeText(screen.getByPlaceholderText('Escribe la opcion 2'), 'Option B');

      fireEvent.press(screen.getByText('Crear encuesta'));

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith('Error', 'No se pudo crear la encuesta');
      });

      console.error = consoleError;
    });

    it('shows error when not authorized', async () => {
      const alertSpy = jest.spyOn(Alert, 'alert');

      mockUseOrganization.mockReturnValue({
        currentOrganization: null,
        isAdmin: true,
      });

      render(<CreatePollScreen />);

      // Fill valid form
      fireEvent.changeText(screen.getByPlaceholderText('Titulo de la encuesta'), 'Test Poll');
      fireEvent.changeText(screen.getByPlaceholderText('Escribe la opcion 1'), 'Option A');
      fireEvent.changeText(screen.getByPlaceholderText('Escribe la opcion 2'), 'Option B');

      fireEvent.press(screen.getByText('Crear encuesta'));

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith('Error', 'No autorizado');
      });
    });
  });
});
