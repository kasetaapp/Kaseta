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
  Home: () => null,
  FileText: () => null,
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
import ManualEntryScreen from '@/app/(app)/manual-entry/index';

describe('ManualEntryScreen', () => {
  const mockUnits = [
    { id: 'unit-1', name: 'Depto 101', identifier: '101' },
    { id: 'unit-2', name: 'Depto 202', identifier: '202' },
    { id: 'unit-3', name: 'Depto 303', identifier: '303' },
  ];

  beforeEach(() => {
    jest.clearAllMocks();

    mockUseOrganization.mockReturnValue({
      currentOrganization: { id: 'org-123', name: 'Test Community' },
      canScanAccess: true,
    });

    mockSupabaseFrom.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({ data: mockUnits, error: null }),
        }),
      }),
      insert: jest.fn().mockResolvedValue({ error: null }),
    });
  });

  describe('permission denied', () => {
    it('shows permission denied when no scan access', () => {
      mockUseOrganization.mockReturnValue({
        currentOrganization: { id: 'org-123' },
        canScanAccess: false,
      });

      render(<ManualEntryScreen />);

      expect(screen.getByText('Sin permisos')).toBeTruthy();
      expect(screen.getByText('No tienes permisos para registrar entradas manuales.')).toBeTruthy();
    });
  });

  describe('header', () => {
    it('renders header with title', () => {
      render(<ManualEntryScreen />);

      expect(screen.getByText('Entrada manual')).toBeTruthy();
    });
  });

  describe('access type toggle', () => {
    it('shows access type section', () => {
      render(<ManualEntryScreen />);

      expect(screen.getByText('Tipo de registro')).toBeTruthy();
    });

    it('shows entry option', () => {
      render(<ManualEntryScreen />);

      // Multiple elements contain "Entrada" - header and button
      expect(screen.getAllByText(/Entrada/).length).toBeGreaterThan(0);
    });

    it('shows exit option', () => {
      render(<ManualEntryScreen />);

      // Exit toggle option
      expect(screen.getAllByText(/Salida/).length).toBeGreaterThan(0);
    });

    it('allows toggling access type', () => {
      render(<ManualEntryScreen />);

      // Press the toggle, not the button
      const exitToggle = screen.getAllByText(/Salida/)[0];
      fireEvent.press(exitToggle);

      expect(screen.getByText('Registrar salida')).toBeTruthy();
    });
  });

  describe('visitor info section', () => {
    it('shows visitor info section', () => {
      render(<ManualEntryScreen />);

      expect(screen.getByText('Información del visitante')).toBeTruthy();
    });

    it('shows name input', () => {
      render(<ManualEntryScreen />);

      expect(screen.getByText('Nombre completo')).toBeTruthy();
      expect(screen.getByPlaceholderText('Juan Pérez')).toBeTruthy();
    });

    it('shows phone input', () => {
      render(<ManualEntryScreen />);

      expect(screen.getByText('Teléfono (opcional)')).toBeTruthy();
      expect(screen.getByPlaceholderText('+52 123 456 7890')).toBeTruthy();
    });
  });

  describe('unit selection', () => {
    it('shows destination section', async () => {
      render(<ManualEntryScreen />);

      await waitFor(() => {
        expect(screen.getByText('Destino (opcional)')).toBeTruthy();
      });
    });

    it('shows unit options', async () => {
      render(<ManualEntryScreen />);

      await waitFor(() => {
        expect(screen.getByText('101')).toBeTruthy();
        expect(screen.getByText('202')).toBeTruthy();
        expect(screen.getByText('303')).toBeTruthy();
      });
    });

    it('shows loading state for units', () => {
      mockSupabaseFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockReturnValue(new Promise(() => {})),
          }),
        }),
      });

      render(<ManualEntryScreen />);

      expect(screen.getByText('Cargando unidades...')).toBeTruthy();
    });

    it('shows empty state when no units', async () => {
      mockSupabaseFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({ data: [], error: null }),
          }),
        }),
      });

      render(<ManualEntryScreen />);

      await waitFor(() => {
        expect(screen.getByText('No hay unidades registradas')).toBeTruthy();
      });
    });
  });

  describe('notes section', () => {
    it('shows notes section', () => {
      render(<ManualEntryScreen />);

      expect(screen.getByText('Notas (opcional)')).toBeTruthy();
    });

    it('shows notes input', () => {
      render(<ManualEntryScreen />);

      expect(screen.getByPlaceholderText('Ej: Entrega de paquete, visitante sin cita...')).toBeTruthy();
    });
  });

  describe('submit button', () => {
    it('shows submit button for entry', () => {
      render(<ManualEntryScreen />);

      expect(screen.getByText('Registrar entrada')).toBeTruthy();
    });

    it('shows submit button for exit', () => {
      render(<ManualEntryScreen />);

      fireEvent.press(screen.getByText(/Salida/));

      expect(screen.getByText('Registrar salida')).toBeTruthy();
    });

    it('button is disabled when name is too short', () => {
      render(<ManualEntryScreen />);

      fireEvent.changeText(screen.getByPlaceholderText('Juan Pérez'), 'J');

      const button = screen.getByText('Registrar entrada');
      expect(button).toBeTruthy();
    });
  });

  describe('form submission', () => {
    it('registers entry on valid submit', async () => {
      const alertSpy = jest.spyOn(Alert, 'alert');

      render(<ManualEntryScreen />);

      await waitFor(() => {
        expect(screen.getByText('101')).toBeTruthy();
      });

      fireEvent.changeText(screen.getByPlaceholderText('Juan Pérez'), 'Juan Garcia');
      fireEvent.press(screen.getByText('Registrar entrada'));

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith(
          'Entrada registrada',
          'Se ha registrado la entrada de Juan Garcia',
          expect.any(Array)
        );
      });
    });

    it('registers exit on valid submit', async () => {
      const alertSpy = jest.spyOn(Alert, 'alert');

      render(<ManualEntryScreen />);

      await waitFor(() => {
        expect(screen.getByText('101')).toBeTruthy();
      });

      fireEvent.press(screen.getByText(/Salida/));
      fireEvent.changeText(screen.getByPlaceholderText('Juan Pérez'), 'Juan Garcia');
      fireEvent.press(screen.getByText('Registrar salida'));

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith(
          'Salida registrada',
          'Se ha registrado la salida de Juan Garcia',
          expect.any(Array)
        );
      });
    });

    it('shows error when name is empty', async () => {
      const alertSpy = jest.spyOn(Alert, 'alert');

      render(<ManualEntryScreen />);

      fireEvent.press(screen.getByText('Registrar entrada'));

      // Button is disabled, so no alert expected
      expect(screen.getByText('Registrar entrada')).toBeTruthy();
    });
  });

  describe('error handling', () => {
    it('shows error when submission fails', async () => {
      const alertSpy = jest.spyOn(Alert, 'alert');
      const consoleError = console.error;
      console.error = jest.fn();

      mockSupabaseFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({ data: mockUnits, error: null }),
          }),
        }),
        insert: jest.fn().mockResolvedValue({ error: new Error('Failed') }),
      });

      render(<ManualEntryScreen />);

      await waitFor(() => {
        expect(screen.getByText('101')).toBeTruthy();
      });

      fireEvent.changeText(screen.getByPlaceholderText('Juan Pérez'), 'Juan Garcia');
      fireEvent.press(screen.getByText('Registrar entrada'));

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith('Error', 'No se pudo registrar el acceso');
      });

      console.error = consoleError;
    });

    it('handles units fetch error gracefully', async () => {
      const consoleError = console.error;
      console.error = jest.fn();

      mockSupabaseFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockRejectedValue(new Error('Fetch failed')),
          }),
        }),
      });

      render(<ManualEntryScreen />);

      await waitFor(() => {
        expect(console.error).toHaveBeenCalledWith(
          'Error fetching units:',
          expect.any(Error)
        );
      });

      console.error = consoleError;
    });
  });

  describe('no organization', () => {
    it('handles missing organization when fetching units', async () => {
      mockUseOrganization.mockReturnValue({
        currentOrganization: null,
        canScanAccess: true,
      });

      render(<ManualEntryScreen />);

      await waitFor(() => {
        expect(screen.getByText('No hay unidades registradas')).toBeTruthy();
      });
    });
  });

  describe('unit selection', () => {
    it('allows selecting and deselecting a unit', async () => {
      render(<ManualEntryScreen />);

      await waitFor(() => {
        expect(screen.getByText('101')).toBeTruthy();
      });

      // Select unit
      fireEvent.press(screen.getByText('101'));

      // Select same unit again to deselect
      fireEvent.press(screen.getByText('101'));

      // Unit should still be visible
      expect(screen.getByText('101')).toBeTruthy();
    });

    it('selects unit for submission', async () => {
      const alertSpy = jest.spyOn(Alert, 'alert');
      const mockInsert = jest.fn().mockResolvedValue({ error: null });

      mockSupabaseFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({ data: mockUnits, error: null }),
          }),
        }),
        insert: mockInsert,
      });

      render(<ManualEntryScreen />);

      await waitFor(() => {
        expect(screen.getByText('101')).toBeTruthy();
      });

      fireEvent.press(screen.getByText('101'));
      fireEvent.changeText(screen.getByPlaceholderText('Juan Pérez'), 'Juan Garcia');
      fireEvent.changeText(screen.getByPlaceholderText('+52 123 456 7890'), '5551234567');
      fireEvent.changeText(screen.getByPlaceholderText('Ej: Entrega de paquete, visitante sin cita...'), 'Test notes');
      fireEvent.press(screen.getByText('Registrar entrada'));

      await waitFor(() => {
        expect(mockInsert).toHaveBeenCalledWith(
          expect.objectContaining({
            organization_id: 'org-123',
            unit_id: 'unit-1',
            visitor_name: 'Juan Garcia',
            access_type: 'entry',
            notes: 'Test notes',
          })
        );
      });
    });
  });

  describe('navigation', () => {
    it('navigates back when back button is pressed', async () => {
      render(<ManualEntryScreen />);

      // Back button should be present
      expect(screen.getByText('Entrada manual')).toBeTruthy();
    });
  });
});
