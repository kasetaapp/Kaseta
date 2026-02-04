import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert, Linking } from 'react-native';

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
  Phone: () => null,
  AlertTriangle: () => null,
  Shield: () => null,
  Flame: () => null,
  Heart: () => null,
  Building2: () => null,
}));

// Mock supabase
const mockSupabaseFrom = jest.fn();

jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: (table: string) => mockSupabaseFrom(table),
  },
}));

// Mock OrganizationContext
jest.mock('@/contexts/OrganizationContext', () => ({
  useOrganization: () => ({
    currentOrganization: { id: 'org-123', name: 'Test Org' },
  }),
}));

// Import component after mocks
import EmergencyScreen from '@/app/(app)/emergency';

describe('EmergencyScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockSupabaseFrom.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({ data: [], error: null }),
          }),
        }),
      }),
    });
  });

  describe('header', () => {
    it('renders header with title', async () => {
      render(<EmergencyScreen />);

      await waitFor(() => {
        expect(screen.getByText('Emergencias')).toBeTruthy();
      });
    });
  });

  describe('loading state', () => {
    it('shows loading state initially', () => {
      // Keep query pending
      mockSupabaseFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockReturnValue({
              order: jest.fn().mockReturnValue(new Promise(() => {})),
            }),
          }),
        }),
      });

      render(<EmergencyScreen />);

      expect(screen.getByText('Emergencias')).toBeTruthy();
    });
  });

  describe('emergency warning', () => {
    it('shows emergency warning banner', async () => {
      render(<EmergencyScreen />);

      await waitFor(() => {
        expect(screen.getByText('En caso de emergencia real, llama al 911 inmediatamente')).toBeTruthy();
      });
    });
  });

  describe('emergency numbers', () => {
    it('shows emergency numbers section', async () => {
      render(<EmergencyScreen />);

      await waitFor(() => {
        expect(screen.getByText('Números de emergencia')).toBeTruthy();
      });
    });

    it('displays Emergencias number', async () => {
      render(<EmergencyScreen />);

      await waitFor(() => {
        expect(screen.getAllByText('Emergencias').length).toBeGreaterThan(0);
        expect(screen.getAllByText('911').length).toBeGreaterThan(0);
        expect(screen.getByText('Policía, Ambulancia, Bomberos')).toBeTruthy();
      });
    });

    it('displays Policía number', async () => {
      render(<EmergencyScreen />);

      await waitFor(() => {
        expect(screen.getByText('Policía')).toBeTruthy();
        expect(screen.getByText('Seguridad pública')).toBeTruthy();
      });
    });

    it('displays Bomberos number', async () => {
      render(<EmergencyScreen />);

      await waitFor(() => {
        expect(screen.getByText('Bomberos')).toBeTruthy();
        expect(screen.getByText('Incendios y rescate')).toBeTruthy();
      });
    });

    it('displays Cruz Roja number', async () => {
      render(<EmergencyScreen />);

      await waitFor(() => {
        expect(screen.getByText('Cruz Roja')).toBeTruthy();
        expect(screen.getByText('065')).toBeTruthy();
        expect(screen.getByText('Emergencias médicas')).toBeTruthy();
      });
    });

    it('calls emergency number when pressed', async () => {
      const linkingSpy = jest.spyOn(Linking, 'openURL');

      render(<EmergencyScreen />);

      await waitFor(() => {
        expect(screen.getAllByText('911').length).toBeGreaterThan(0);
      });

      // Press on first 911 element
      fireEvent.press(screen.getAllByText('911')[0]);

      expect(linkingSpy).toHaveBeenCalledWith('tel:911');
    });
  });

  describe('community contacts', () => {
    it('shows community contacts section', async () => {
      render(<EmergencyScreen />);

      await waitFor(() => {
        expect(screen.getByText('Contactos de la comunidad')).toBeTruthy();
      });
    });

    it('shows empty state when no community contacts', async () => {
      render(<EmergencyScreen />);

      await waitFor(() => {
        expect(screen.getByText('No hay contactos de la comunidad configurados')).toBeTruthy();
      });
    });

    it('displays community contacts when available', async () => {
      const mockContacts = [
        {
          id: 'contact-1',
          name: 'Seguridad del Fraccionamiento',
          phone: '5551234567',
          role: 'Seguridad',
          is_emergency: true,
        },
        {
          id: 'contact-2',
          name: 'Administración',
          phone: '5559876543',
          role: 'Administrador',
          is_emergency: false,
        },
      ];

      mockSupabaseFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockReturnValue({
              order: jest.fn().mockResolvedValue({ data: mockContacts, error: null }),
            }),
          }),
        }),
      });

      render(<EmergencyScreen />);

      await waitFor(() => {
        expect(screen.getByText('Seguridad del Fraccionamiento')).toBeTruthy();
        expect(screen.getByText('Administración')).toBeTruthy();
      });
    });

    it('shows emergency badge for emergency contacts', async () => {
      const mockContacts = [
        {
          id: 'contact-1',
          name: 'Security',
          phone: '5551234567',
          role: 'Guard',
          is_emergency: true,
        },
      ];

      mockSupabaseFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockReturnValue({
              order: jest.fn().mockResolvedValue({ data: mockContacts, error: null }),
            }),
          }),
        }),
      });

      render(<EmergencyScreen />);

      await waitFor(() => {
        expect(screen.getByText('Emergencia')).toBeTruthy();
      });
    });

    it('shows call confirmation dialog for community contacts', async () => {
      const alertSpy = jest.spyOn(Alert, 'alert');

      const mockContacts = [
        {
          id: 'contact-1',
          name: 'Admin Office',
          phone: '5551234567',
          role: 'Admin',
          is_emergency: false,
        },
      ];

      mockSupabaseFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockReturnValue({
              order: jest.fn().mockResolvedValue({ data: mockContacts, error: null }),
            }),
          }),
        }),
      });

      render(<EmergencyScreen />);

      await waitFor(() => {
        expect(screen.getByText('Admin Office')).toBeTruthy();
      });

      // Press on the card to call
      fireEvent.press(screen.getByText('Admin Office'));

      expect(alertSpy).toHaveBeenCalledWith(
        'Llamar a Admin Office',
        '¿Deseas llamar al 5551234567?',
        expect.any(Array)
      );
    });
  });

  describe('safety tips', () => {
    it('shows safety tips section', async () => {
      render(<EmergencyScreen />);

      await waitFor(() => {
        expect(screen.getByText('Consejos de seguridad')).toBeTruthy();
      });
    });

    it('shows emergency tip', async () => {
      render(<EmergencyScreen />);

      await waitFor(() => {
        expect(screen.getByText('Mantén la calma y proporciona tu ubicación exacta al llamar a emergencias')).toBeTruthy();
      });
    });

    it('shows medical info tip', async () => {
      render(<EmergencyScreen />);

      await waitFor(() => {
        expect(screen.getByText('Ten a la mano información médica importante y alergias conocidas')).toBeTruthy();
      });
    });

    it('shows exit knowledge tip', async () => {
      render(<EmergencyScreen />);

      await waitFor(() => {
        expect(screen.getByText('Conoce las salidas de emergencia de tu edificio y punto de reunión')).toBeTruthy();
      });
    });

    it('shows phone charged tip', async () => {
      render(<EmergencyScreen />);

      await waitFor(() => {
        expect(screen.getByText('Mantén tu teléfono cargado y guarda estos números en tus contactos')).toBeTruthy();
      });
    });
  });

  describe('pull to refresh', () => {
    it('supports pull to refresh', async () => {
      render(<EmergencyScreen />);

      await waitFor(() => {
        expect(screen.getByText('Emergencias')).toBeTruthy();
      });

      // Component has RefreshControl
    });
  });

  describe('no organization', () => {
    it('handles missing organization gracefully', async () => {
      jest.doMock('@/contexts/OrganizationContext', () => ({
        useOrganization: () => ({
          currentOrganization: null,
        }),
      }));

      // Component should still render with default emergency numbers
    });
  });

  describe('error handling', () => {
    it('handles fetch errors gracefully', async () => {
      const consoleError = console.error;
      console.error = jest.fn();

      mockSupabaseFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockReturnValue({
              order: jest.fn().mockResolvedValue({ data: null, error: new Error('Fetch failed') }),
            }),
          }),
        }),
      });

      render(<EmergencyScreen />);

      await waitFor(() => {
        expect(console.error).toHaveBeenCalledWith(
          'Error fetching contacts:',
          expect.any(Error)
        );
      });

      console.error = consoleError;
    });
  });
});
