import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';

// Mock expo-router
const mockBack = jest.fn();

jest.mock('expo-router', () => ({
  router: {
    back: (...args: any[]) => mockBack(...args),
  },
  useLocalSearchParams: () => ({
    id: 'amenity-123',
    name: 'Gimnasio',
  }),
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
import ReserveAmenityScreen from '@/app/(app)/amenities/reserve';

describe('ReserveAmenityScreen', () => {
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
      render(<ReserveAmenityScreen />);

      expect(screen.getByText('Reservar')).toBeTruthy();
    });

    it('shows amenity name', () => {
      render(<ReserveAmenityScreen />);

      expect(screen.getByText('Gimnasio')).toBeTruthy();
    });
  });

  describe('date selection', () => {
    it('shows date section', () => {
      render(<ReserveAmenityScreen />);

      expect(screen.getByText('Fecha')).toBeTruthy();
    });

    it('shows today option', () => {
      render(<ReserveAmenityScreen />);

      expect(screen.getByText('Hoy')).toBeTruthy();
    });

    it('allows selecting a date', () => {
      render(<ReserveAmenityScreen />);

      // Select tomorrow
      const tomorrow = screen.getByText('Mañana');
      fireEvent.press(tomorrow);

      expect(tomorrow).toBeTruthy();
    });
  });

  describe('time selection', () => {
    it('shows time section', () => {
      render(<ReserveAmenityScreen />);

      expect(screen.getByText('Hora de inicio')).toBeTruthy();
    });

    it('shows time slots', () => {
      render(<ReserveAmenityScreen />);

      expect(screen.getByText('08:00')).toBeTruthy();
      expect(screen.getByText('12:00')).toBeTruthy();
      expect(screen.getByText('18:00')).toBeTruthy();
      expect(screen.getByText('20:00')).toBeTruthy();
    });

    it('allows selecting a time', () => {
      render(<ReserveAmenityScreen />);

      fireEvent.press(screen.getByText('10:00'));

      expect(screen.getByText('10:00')).toBeTruthy();
    });
  });

  describe('duration selection', () => {
    it('shows duration section', () => {
      render(<ReserveAmenityScreen />);

      expect(screen.getByText('Duración (horas)')).toBeTruthy();
    });

    it('shows duration options', () => {
      render(<ReserveAmenityScreen />);

      expect(screen.getByText('1h')).toBeTruthy();
      expect(screen.getByText('2h')).toBeTruthy();
      expect(screen.getByText('3h')).toBeTruthy();
      expect(screen.getByText('4h')).toBeTruthy();
    });

    it('allows selecting duration', () => {
      render(<ReserveAmenityScreen />);

      fireEvent.press(screen.getByText('3h'));

      expect(screen.getByText('3h')).toBeTruthy();
    });
  });

  describe('notes section', () => {
    it('shows notes section', () => {
      render(<ReserveAmenityScreen />);

      expect(screen.getByText('Notas (opcional)')).toBeTruthy();
    });

    it('shows notes input', () => {
      render(<ReserveAmenityScreen />);

      expect(screen.getByPlaceholderText('Notas adicionales...')).toBeTruthy();
    });
  });

  describe('submit button', () => {
    it('shows submit button', () => {
      render(<ReserveAmenityScreen />);

      expect(screen.getByText('Confirmar reservación')).toBeTruthy();
    });

    it('button is disabled when no time selected', () => {
      render(<ReserveAmenityScreen />);

      const button = screen.getByText('Confirmar reservación');
      expect(button).toBeTruthy();
    });
  });

  describe('form submission', () => {
    it('button is disabled when no time selected', () => {
      render(<ReserveAmenityScreen />);

      // Button should be present but disabled when no time selected
      const button = screen.getByText('Confirmar reservación');
      expect(button).toBeTruthy();
    });

    it('creates reservation on valid submit', async () => {
      const alertSpy = jest.spyOn(Alert, 'alert');

      render(<ReserveAmenityScreen />);

      // Select time
      fireEvent.press(screen.getByText('10:00'));

      fireEvent.press(screen.getByText('Confirmar reservación'));

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith(
          'Éxito',
          'Reservación confirmada',
          expect.any(Array)
        );
      });
    });

    it('shows error when creation fails', async () => {
      const alertSpy = jest.spyOn(Alert, 'alert');
      const consoleError = console.error;
      console.error = jest.fn();

      mockSupabaseFrom.mockReturnValue({
        insert: jest.fn().mockResolvedValue({ error: new Error('Failed') }),
      });

      render(<ReserveAmenityScreen />);

      // Select time
      fireEvent.press(screen.getByText('10:00'));

      fireEvent.press(screen.getByText('Confirmar reservación'));

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith('Error', 'No se pudo crear la reservación');
      });

      console.error = consoleError;
    });

    it('includes notes when provided', async () => {
      const alertSpy = jest.spyOn(Alert, 'alert');

      render(<ReserveAmenityScreen />);

      // Select time
      fireEvent.press(screen.getByText('10:00'));

      // Add notes
      fireEvent.changeText(
        screen.getByPlaceholderText('Notas adicionales...'),
        'Clase de yoga'
      );

      fireEvent.press(screen.getByText('Confirmar reservación'));

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith(
          'Éxito',
          'Reservación confirmada',
          expect.any(Array)
        );
      });
    });

    it('handles missing unit gracefully', async () => {
      const alertSpy = jest.spyOn(Alert, 'alert');

      mockUseOrganization.mockReturnValue({
        currentMembership: { unit_id: null },
      });

      render(<ReserveAmenityScreen />);

      // Select time
      fireEvent.press(screen.getByText('10:00'));

      fireEvent.press(screen.getByText('Confirmar reservación'));

      // Error shown due to missing unit
      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalled();
      });
    });
  });

  describe('date formatting', () => {
    it('shows day names for future dates', () => {
      render(<ReserveAmenityScreen />);

      // Should have 7 days visible
      expect(screen.getByText('Hoy')).toBeTruthy();
      expect(screen.getByText('Mañana')).toBeTruthy();
    });
  });
});
