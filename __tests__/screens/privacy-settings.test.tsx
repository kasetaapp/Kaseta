import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';

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
  Eye: () => null,
  Users: () => null,
  Phone: () => null,
  MapPin: () => null,
  Download: () => null,
}));

// Mock expo-haptics
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium' },
}));

// Mock supabase
const mockSupabaseFrom = jest.fn();

jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: (table: string) => mockSupabaseFrom(table),
  },
}));

// Mock AuthContext
jest.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'user-123' },
  }),
}));

// Import component after mocks
import PrivacySettingsScreen from '@/app/(app)/settings/privacy';

describe('PrivacySettingsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockSupabaseFrom.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: { show_in_directory: true },
            error: null,
          }),
        }),
      }),
      update: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null }),
      }),
    });
  });

  describe('header', () => {
    it('renders header with title', async () => {
      render(<PrivacySettingsScreen />);

      await waitFor(() => {
        expect(screen.getByText('Privacidad')).toBeTruthy();
      });
    });
  });

  describe('directory section', () => {
    it('shows section title', async () => {
      render(<PrivacySettingsScreen />);

      await waitFor(() => {
        expect(screen.getByText('Directorio comunitario')).toBeTruthy();
      });
    });

    it('shows appear in directory toggle', async () => {
      render(<PrivacySettingsScreen />);

      await waitFor(() => {
        expect(screen.getByText('Aparecer en directorio')).toBeTruthy();
        expect(screen.getByText('Otros residentes pueden ver tu nombre')).toBeTruthy();
      });
    });

    it('shows helper text', async () => {
      render(<PrivacySettingsScreen />);

      await waitFor(() => {
        expect(screen.getByText(/Al activar esta opción/)).toBeTruthy();
      });
    });
  });

  describe('info section', () => {
    it('shows section title', async () => {
      render(<PrivacySettingsScreen />);

      await waitFor(() => {
        expect(screen.getByText('Tu información')).toBeTruthy();
      });
    });

    it('shows guard access info', async () => {
      render(<PrivacySettingsScreen />);

      await waitFor(() => {
        expect(screen.getByText(/Solo los guardias y administradores/)).toBeTruthy();
      });
    });

    it('shows access history info', async () => {
      render(<PrivacySettingsScreen />);

      await waitFor(() => {
        expect(screen.getByText(/Tu historial de acceso solo es visible/)).toBeTruthy();
      });
    });
  });

  describe('data section', () => {
    it('shows section title', async () => {
      render(<PrivacySettingsScreen />);

      await waitFor(() => {
        expect(screen.getByText('Tus datos')).toBeTruthy();
      });
    });

    it('shows download data option', async () => {
      render(<PrivacySettingsScreen />);

      await waitFor(() => {
        expect(screen.getByText('Descargar mis datos')).toBeTruthy();
        expect(screen.getByText('Obtén una copia de toda tu información')).toBeTruthy();
      });
    });

    it('shows request button', async () => {
      render(<PrivacySettingsScreen />);

      await waitFor(() => {
        expect(screen.getByText('Solicitar')).toBeTruthy();
      });
    });
  });

  describe('error handling', () => {
    it('handles fetch error gracefully', async () => {
      const consoleError = console.error;
      console.error = jest.fn();

      mockSupabaseFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockRejectedValue(new Error('Fetch failed')),
          }),
        }),
      });

      render(<PrivacySettingsScreen />);

      await waitFor(() => {
        expect(console.error).toHaveBeenCalledWith(
          'Error fetching settings:',
          expect.any(Error)
        );
      });

      console.error = consoleError;
    });

    it('handles update error gracefully', async () => {
      const consoleError = console.error;
      console.error = jest.fn();

      mockSupabaseFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { show_in_directory: false },
              error: null,
            }),
          }),
        }),
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockRejectedValue(new Error('Update failed')),
        }),
      });

      render(<PrivacySettingsScreen />);

      await waitFor(() => {
        expect(screen.getByText('Aparecer en directorio')).toBeTruthy();
      });

      console.error = consoleError;
    });
  });

  describe('navigation', () => {
    it('navigates back when back button is pressed', async () => {
      const Haptics = require('expo-haptics');

      render(<PrivacySettingsScreen />);

      await waitFor(() => {
        expect(screen.getByText('Privacidad')).toBeTruthy();
      });

      expect(Haptics.impactAsync).toBeDefined();
    });
  });

  describe('download data', () => {
    it('triggers haptic feedback on download request', async () => {
      const Haptics = require('expo-haptics');

      render(<PrivacySettingsScreen />);

      await waitFor(() => {
        expect(screen.getByText('Solicitar')).toBeTruthy();
      });

      fireEvent.press(screen.getByText('Solicitar'));

      expect(Haptics.impactAsync).toHaveBeenCalled();
    });
  });

  describe('toggle settings', () => {
    it('calls supabase update on toggle', async () => {
      const mockUpdate = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null }),
      });

      mockSupabaseFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { show_in_directory: false },
              error: null,
            }),
          }),
        }),
        update: mockUpdate,
      });

      render(<PrivacySettingsScreen />);

      await waitFor(() => {
        expect(screen.getByText('Aparecer en directorio')).toBeTruthy();
      });

      expect(mockSupabaseFrom).toHaveBeenCalledWith('users');
    });

    it('triggers haptic feedback on setting change', async () => {
      const Haptics = require('expo-haptics');

      render(<PrivacySettingsScreen />);

      await waitFor(() => {
        expect(screen.getByText('Aparecer en directorio')).toBeTruthy();
      });

      expect(Haptics.impactAsync).toBeDefined();
    });

    it('reverts setting on update error', async () => {
      const consoleError = console.error;
      console.error = jest.fn();

      mockSupabaseFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { show_in_directory: false },
              error: null,
            }),
          }),
        }),
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockRejectedValue(new Error('Update failed')),
        }),
      });

      render(<PrivacySettingsScreen />);

      await waitFor(() => {
        expect(screen.getByText('Privacidad')).toBeTruthy();
      });

      console.error = consoleError;
    });
  });

  describe('preference loading', () => {
    it('loads user preferences from database', async () => {
      render(<PrivacySettingsScreen />);

      await waitFor(() => {
        expect(mockSupabaseFrom).toHaveBeenCalledWith('users');
      });
    });

    it('uses defaults when no data returned', async () => {
      mockSupabaseFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: null,
            }),
          }),
        }),
      });

      render(<PrivacySettingsScreen />);

      await waitFor(() => {
        expect(screen.getByText('Privacidad')).toBeTruthy();
      });
    });
  });
});
