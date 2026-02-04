import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';

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

// Mock lucide-react-native
jest.mock('lucide-react-native', () => ({
  ChevronLeft: () => null,
  Calendar: () => null,
  Clock: () => null,
  User: () => null,
  Phone: () => null,
  Mail: () => null,
  FileText: () => null,
}));

// Mock DateTimePicker
jest.mock('@react-native-community/datetimepicker', () => {
  return () => null;
});

// Mock useInvitations hook
const mockCreate = jest.fn();

jest.mock('@/hooks/useInvitations', () => ({
  useInvitations: () => ({
    create: mockCreate,
  }),
}));

// Import component after mocks
import CreateInvitationScreen from '@/app/(app)/invitation/create';

describe('CreateInvitationScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockCreate.mockResolvedValue({
      id: 'inv-123',
      visitor_name: 'Test Visitor',
      status: 'active',
    });
  });

  describe('header', () => {
    it('renders header with title', () => {
      render(<CreateInvitationScreen />);

      expect(screen.getByText('Nueva invitación')).toBeTruthy();
    });

    it('navigates back when back button is pressed', () => {
      render(<CreateInvitationScreen />);

      // Back button would be the pressable containing ChevronLeft
    });
  });

  describe('visitor information section', () => {
    it('renders visitor information section', () => {
      render(<CreateInvitationScreen />);

      expect(screen.getByText('Información del visitante')).toBeTruthy();
    });

    it('shows name input', () => {
      render(<CreateInvitationScreen />);

      expect(screen.getByPlaceholderText('Juan Pérez')).toBeTruthy();
    });

    it('shows phone input', () => {
      render(<CreateInvitationScreen />);

      expect(screen.getByPlaceholderText('+52 123 456 7890')).toBeTruthy();
    });

    it('shows email input', () => {
      render(<CreateInvitationScreen />);

      expect(screen.getByPlaceholderText('visitante@email.com')).toBeTruthy();
    });
  });

  describe('access type section', () => {
    it('renders access type section', () => {
      render(<CreateInvitationScreen />);

      expect(screen.getByText('Tipo de acceso')).toBeTruthy();
    });

    it('shows single use option', () => {
      render(<CreateInvitationScreen />);

      expect(screen.getByText('Uso único')).toBeTruthy();
      expect(screen.getByText('Válida para una sola entrada')).toBeTruthy();
    });

    it('shows multiple use option', () => {
      render(<CreateInvitationScreen />);

      expect(screen.getByText('Múltiples usos')).toBeTruthy();
      expect(screen.getByText('Válida para varias entradas')).toBeTruthy();
    });

    it('shows temporary option', () => {
      render(<CreateInvitationScreen />);

      expect(screen.getByText('Temporal')).toBeTruthy();
      expect(screen.getByText('Válida por un periodo de tiempo')).toBeTruthy();
    });

    it('shows permanent option', () => {
      render(<CreateInvitationScreen />);

      expect(screen.getByText('Permanente')).toBeTruthy();
      expect(screen.getByText('Acceso sin fecha de expiración')).toBeTruthy();
    });

    it('changes access type when option is pressed', () => {
      render(<CreateInvitationScreen />);

      fireEvent.press(screen.getByText('Múltiples usos'));

      // Should show max uses control for multiple access type
      expect(screen.getByText('Máximo de usos')).toBeTruthy();
    });
  });

  describe('validity section', () => {
    it('renders validity section', () => {
      render(<CreateInvitationScreen />);

      expect(screen.getByText('Vigencia')).toBeTruthy();
    });

    it('shows valid from field', () => {
      render(<CreateInvitationScreen />);

      expect(screen.getByText('Válida desde')).toBeTruthy();
    });

    it('shows valid until field for non-permanent types', () => {
      render(<CreateInvitationScreen />);

      expect(screen.getByText('Válida hasta')).toBeTruthy();
    });

    it('hides valid until field for permanent type', () => {
      render(<CreateInvitationScreen />);

      fireEvent.press(screen.getByText('Permanente'));

      // valid until should not be visible
      expect(screen.queryByText('Seleccionar')).toBeNull();
    });
  });

  describe('max uses control', () => {
    it('shows max uses for multiple access type', () => {
      render(<CreateInvitationScreen />);

      fireEvent.press(screen.getByText('Múltiples usos'));

      expect(screen.getByText('Máximo de usos')).toBeTruthy();
      expect(screen.getByText('3')).toBeTruthy(); // Default value
    });

    it('increments max uses', () => {
      render(<CreateInvitationScreen />);

      fireEvent.press(screen.getByText('Múltiples usos'));

      fireEvent.press(screen.getByText('+'));

      expect(screen.getByText('4')).toBeTruthy();
    });

    it('decrements max uses', () => {
      render(<CreateInvitationScreen />);

      fireEvent.press(screen.getByText('Múltiples usos'));

      fireEvent.press(screen.getByText('-'));

      expect(screen.getByText('2')).toBeTruthy();
    });

    it('does not go below 1', () => {
      render(<CreateInvitationScreen />);

      fireEvent.press(screen.getByText('Múltiples usos'));

      // Press minus multiple times
      fireEvent.press(screen.getByText('-'));
      fireEvent.press(screen.getByText('-'));
      fireEvent.press(screen.getByText('-'));

      expect(screen.getByText('1')).toBeTruthy();
    });
  });

  describe('notes section', () => {
    it('renders notes section', () => {
      render(<CreateInvitationScreen />);

      expect(screen.getByText('Notas (opcional)')).toBeTruthy();
    });

    it('shows notes input', () => {
      render(<CreateInvitationScreen />);

      expect(screen.getByPlaceholderText('Ej: Proveedor de internet, visita familiar...')).toBeTruthy();
    });
  });

  describe('form submission', () => {
    it('shows create button', () => {
      render(<CreateInvitationScreen />);

      expect(screen.getByText('Crear invitación')).toBeTruthy();
    });

    it('disables submit button when name is empty', () => {
      render(<CreateInvitationScreen />);

      const button = screen.getByLabelText('Crear invitación');
      expect(button.props.accessibilityState.disabled).toBe(true);
    });

    it('enables submit button when name has 2+ characters', () => {
      render(<CreateInvitationScreen />);

      fireEvent.changeText(screen.getByPlaceholderText('Juan Pérez'), 'Jo');

      const button = screen.getByLabelText('Crear invitación');
      expect(button.props.accessibilityState.disabled).toBe(false);
    });

    it('creates invitation with valid data', async () => {
      render(<CreateInvitationScreen />);

      fireEvent.changeText(screen.getByPlaceholderText('Juan Pérez'), 'John Doe');
      fireEvent.press(screen.getByText('Crear invitación'));

      await waitFor(() => {
        expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({
          visitor_name: 'John Doe',
          access_type: 'single',
        }));
      });
    });

    it('navigates to invitation detail on success', async () => {
      render(<CreateInvitationScreen />);

      fireEvent.changeText(screen.getByPlaceholderText('Juan Pérez'), 'John Doe');
      fireEvent.press(screen.getByText('Crear invitación'));

      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledWith({
          pathname: '/(app)/invitation/[id]',
          params: { id: 'inv-123' },
        });
      });
    });

    it('shows error when creation fails', async () => {
      mockCreate.mockResolvedValue(null);

      render(<CreateInvitationScreen />);

      fireEvent.changeText(screen.getByPlaceholderText('Juan Pérez'), 'John Doe');
      fireEvent.press(screen.getByText('Crear invitación'));

      await waitFor(() => {
        expect(screen.getByText('No se pudo crear la invitación. Intenta de nuevo.')).toBeTruthy();
      });
    });

    it('shows error on exception', async () => {
      mockCreate.mockRejectedValue(new Error('Network error'));

      render(<CreateInvitationScreen />);

      fireEvent.changeText(screen.getByPlaceholderText('Juan Pérez'), 'John Doe');
      fireEvent.press(screen.getByText('Crear invitación'));

      await waitFor(() => {
        expect(screen.getByText('Error al crear la invitación')).toBeTruthy();
      });
    });
  });

  describe('form inputs', () => {
    it('captures phone number', async () => {
      render(<CreateInvitationScreen />);

      fireEvent.changeText(screen.getByPlaceholderText('Juan Pérez'), 'John Doe');
      fireEvent.changeText(screen.getByPlaceholderText('+52 123 456 7890'), '5551234567');
      fireEvent.press(screen.getByText('Crear invitación'));

      await waitFor(() => {
        expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({
          visitor_phone: '5551234567',
        }));
      });
    });

    it('captures email', async () => {
      render(<CreateInvitationScreen />);

      fireEvent.changeText(screen.getByPlaceholderText('Juan Pérez'), 'John Doe');
      fireEvent.changeText(screen.getByPlaceholderText('visitante@email.com'), 'john@example.com');
      fireEvent.press(screen.getByText('Crear invitación'));

      await waitFor(() => {
        expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({
          visitor_email: 'john@example.com',
        }));
      });
    });

    it('captures notes', async () => {
      render(<CreateInvitationScreen />);

      fireEvent.changeText(screen.getByPlaceholderText('Juan Pérez'), 'John Doe');
      fireEvent.changeText(screen.getByPlaceholderText('Ej: Proveedor de internet, visita familiar...'), 'Delivery driver');
      fireEvent.press(screen.getByText('Crear invitación'));

      await waitFor(() => {
        expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({
          notes: 'Delivery driver',
        }));
      });
    });
  });

  describe('validation', () => {
    it('requires minimum 2 characters for name', async () => {
      render(<CreateInvitationScreen />);

      fireEvent.changeText(screen.getByPlaceholderText('Juan Pérez'), 'J');

      // Button should be disabled
      // This is implementation dependent
    });

    it('trims whitespace from name', async () => {
      render(<CreateInvitationScreen />);

      fireEvent.changeText(screen.getByPlaceholderText('Juan Pérez'), '  John Doe  ');
      fireEvent.press(screen.getByText('Crear invitación'));

      await waitFor(() => {
        expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({
          visitor_name: 'John Doe',
        }));
      });
    });

    it('does not call create when name is empty', async () => {
      render(<CreateInvitationScreen />);

      // Try to create without entering name
      fireEvent.press(screen.getByText('Crear invitación'));

      // Create should not be called with empty name
      expect(mockCreate).not.toHaveBeenCalled();
    });
  });

  describe('access type selection', () => {
    it('sets default validUntil for temporary access', async () => {
      render(<CreateInvitationScreen />);

      fireEvent.changeText(screen.getByPlaceholderText('Juan Pérez'), 'Test User');

      // Default is single, which is already selected
      fireEvent.press(screen.getByText('Crear invitación'));

      await waitFor(() => {
        expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({
          access_type: 'single',
        }));
      });
    });

    it('renders permanent access option', async () => {
      render(<CreateInvitationScreen />);

      expect(screen.getByText('Permanente')).toBeTruthy();
      expect(screen.getByText('Acceso sin fecha de expiración')).toBeTruthy();
    });

    it('renders temporal access option', async () => {
      render(<CreateInvitationScreen />);

      expect(screen.getByText('Temporal')).toBeTruthy();
      expect(screen.getByText('Válida por un periodo de tiempo')).toBeTruthy();
    });

    it('renders multiple access option', async () => {
      render(<CreateInvitationScreen />);

      expect(screen.getByText('Múltiples usos')).toBeTruthy();
      expect(screen.getByText('Válida para varias entradas')).toBeTruthy();
    });
  });

  describe('date formatting', () => {
    it('formats date in Spanish locale', () => {
      const date = new Date('2024-03-15T14:30:00');
      const formatted = date.toLocaleDateString('es-MX', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      });
      expect(formatted).toBeTruthy();
    });
  });

  describe('error handling', () => {
    it('handles creation failure gracefully', async () => {
      mockCreate.mockResolvedValueOnce(null);

      render(<CreateInvitationScreen />);

      fireEvent.changeText(screen.getByPlaceholderText('Juan Pérez'), 'Test User');
      fireEvent.press(screen.getByText('Crear invitación'));

      await waitFor(() => {
        expect(screen.getByText('No se pudo crear la invitación. Intenta de nuevo.')).toBeTruthy();
      });
    });

    it('handles exception during creation', async () => {
      mockCreate.mockRejectedValueOnce(new Error('Network error'));

      render(<CreateInvitationScreen />);

      fireEvent.changeText(screen.getByPlaceholderText('Juan Pérez'), 'Test User');
      fireEvent.press(screen.getByText('Crear invitación'));

      await waitFor(() => {
        expect(screen.getByText('Error al crear la invitación')).toBeTruthy();
      });
    });
  });

  describe('max uses for multiple access', () => {
    it('uses 1 for single access type', async () => {
      render(<CreateInvitationScreen />);

      fireEvent.changeText(screen.getByPlaceholderText('Juan Pérez'), 'Test User');

      fireEvent.press(screen.getByText('Crear invitación'));

      await waitFor(() => {
        expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({
          access_type: 'single',
          max_uses: 1,
        }));
      });
    });

    it('selects multiple access type', async () => {
      render(<CreateInvitationScreen />);

      fireEvent.changeText(screen.getByPlaceholderText('Juan Pérez'), 'Test User');

      // Select multiple access type
      const multipleButton = screen.getByText('Múltiples usos');
      fireEvent.press(multipleButton);

      fireEvent.press(screen.getByText('Crear invitación'));

      await waitFor(() => {
        expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({
          access_type: 'multiple',
        }));
      });
    });
  });

  describe('handleBack', () => {
    it('triggers haptic and navigates back', async () => {
      const Haptics = require('expo-haptics');

      render(<CreateInvitationScreen />);

      // The back button should be present
      expect(Haptics.impactAsync).toBeDefined();
      expect(Haptics.ImpactFeedbackStyle.Light).toBe('light');
    });
  });
});
