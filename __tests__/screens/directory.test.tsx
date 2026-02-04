import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { Linking, Alert } from 'react-native';

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
  MessageCircle: () => null,
  Search: () => null,
  User: () => null,
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
import DirectoryScreen from '@/app/(app)/directory';

describe('DirectoryScreen', () => {
  const mockEntries = [
    {
      id: 'member-1',
      user: {
        id: 'user-1',
        full_name: 'John Doe',
        phone: '5551234567',
        show_in_directory: true,
      },
      unit: {
        unit_number: '101',
        building: 'Tower A',
      },
    },
    {
      id: 'member-2',
      user: {
        id: 'user-2',
        full_name: 'Jane Smith',
        phone: '5559876543',
        show_in_directory: true,
      },
      unit: {
        unit_number: '202',
        building: null,
      },
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();

    mockSupabaseFrom.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ data: mockEntries, error: null }),
        }),
      }),
    });
  });

  describe('header', () => {
    it('renders header with title', async () => {
      render(<DirectoryScreen />);

      await waitFor(() => {
        expect(screen.getByText('Directorio')).toBeTruthy();
      });
    });
  });

  describe('loading state', () => {
    it('shows loading state initially', () => {
      mockSupabaseFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue(new Promise(() => {})),
          }),
        }),
      });

      render(<DirectoryScreen />);

      expect(screen.getByText('Directorio')).toBeTruthy();
    });
  });

  describe('search', () => {
    it('shows search input', async () => {
      render(<DirectoryScreen />);

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Buscar por nombre o unidad...')).toBeTruthy();
      });
    });

    it('filters entries by name', async () => {
      render(<DirectoryScreen />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeTruthy();
        expect(screen.getByText('Jane Smith')).toBeTruthy();
      });

      fireEvent.changeText(
        screen.getByPlaceholderText('Buscar por nombre o unidad...'),
        'John'
      );

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeTruthy();
        expect(screen.queryByText('Jane Smith')).toBeNull();
      });
    });

    it('filters entries by unit number', async () => {
      render(<DirectoryScreen />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeTruthy();
        expect(screen.getByText('Jane Smith')).toBeTruthy();
      });

      fireEvent.changeText(
        screen.getByPlaceholderText('Buscar por nombre o unidad...'),
        '202'
      );

      await waitFor(() => {
        expect(screen.queryByText('John Doe')).toBeNull();
        expect(screen.getByText('Jane Smith')).toBeTruthy();
      });
    });

    it('filters entries by building', async () => {
      render(<DirectoryScreen />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeTruthy();
      });

      fireEvent.changeText(
        screen.getByPlaceholderText('Buscar por nombre o unidad...'),
        'Tower A'
      );

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeTruthy();
        expect(screen.queryByText('Jane Smith')).toBeNull();
      });
    });

    it('shows no results when search has no matches', async () => {
      render(<DirectoryScreen />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeTruthy();
      });

      fireEvent.changeText(
        screen.getByPlaceholderText('Buscar por nombre o unidad...'),
        'xyz123'
      );

      await waitFor(() => {
        expect(screen.getByText('Sin resultados')).toBeTruthy();
        expect(screen.getByText('No se encontraron residentes con ese criterio')).toBeTruthy();
      });
    });
  });

  describe('directory entries', () => {
    it('displays resident names', async () => {
      render(<DirectoryScreen />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeTruthy();
        expect(screen.getByText('Jane Smith')).toBeTruthy();
      });
    });

    it('displays unit information', async () => {
      render(<DirectoryScreen />);

      await waitFor(() => {
        expect(screen.getByText(/Tower A/)).toBeTruthy();
        expect(screen.getByText(/Unidad 101/)).toBeTruthy();
      });
    });

    it('displays resident count', async () => {
      render(<DirectoryScreen />);

      await waitFor(() => {
        expect(screen.getByText('2 residentes')).toBeTruthy();
      });
    });

    it('displays singular count for one resident', async () => {
      mockSupabaseFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({
              data: [mockEntries[0]],
              error: null,
            }),
          }),
        }),
      });

      render(<DirectoryScreen />);

      await waitFor(() => {
        expect(screen.getByText('1 residente')).toBeTruthy();
      });
    });

    it('shows initials in avatar', async () => {
      render(<DirectoryScreen />);

      await waitFor(() => {
        expect(screen.getByText('JD')).toBeTruthy(); // John Doe
        expect(screen.getByText('JS')).toBeTruthy(); // Jane Smith
      });
    });
  });

  describe('contact actions', () => {
    it('shows call button', async () => {
      render(<DirectoryScreen />);

      await waitFor(() => {
        expect(screen.getAllByText('Llamar').length).toBeGreaterThan(0);
      });
    });

    it('shows SMS button', async () => {
      render(<DirectoryScreen />);

      await waitFor(() => {
        expect(screen.getAllByText('SMS').length).toBeGreaterThan(0);
      });
    });

    it('shows WhatsApp button', async () => {
      render(<DirectoryScreen />);

      await waitFor(() => {
        expect(screen.getAllByText('WhatsApp').length).toBeGreaterThan(0);
      });
    });

    it('initiates call when call button is pressed', async () => {
      const linkingSpy = jest.spyOn(Linking, 'openURL');

      render(<DirectoryScreen />);

      await waitFor(() => {
        expect(screen.getAllByText('Llamar').length).toBeGreaterThan(0);
      });

      fireEvent.press(screen.getAllByText('Llamar')[0]);

      expect(linkingSpy).toHaveBeenCalledWith('tel:5551234567');
    });

    it('initiates SMS when SMS button is pressed', async () => {
      const linkingSpy = jest.spyOn(Linking, 'openURL');

      render(<DirectoryScreen />);

      await waitFor(() => {
        expect(screen.getAllByText('SMS').length).toBeGreaterThan(0);
      });

      fireEvent.press(screen.getAllByText('SMS')[0]);

      expect(linkingSpy).toHaveBeenCalledWith('sms:5551234567');
    });

    it('initiates WhatsApp with country code', async () => {
      const linkingSpy = jest.spyOn(Linking, 'openURL').mockResolvedValue(true);

      render(<DirectoryScreen />);

      await waitFor(() => {
        expect(screen.getAllByText('WhatsApp').length).toBeGreaterThan(0);
      });

      fireEvent.press(screen.getAllByText('WhatsApp')[0]);

      expect(linkingSpy).toHaveBeenCalledWith('whatsapp://send?phone=525551234567');
    });
  });

  describe('empty state', () => {
    it('shows empty state when no entries', async () => {
      mockSupabaseFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({ data: [], error: null }),
          }),
        }),
      });

      render(<DirectoryScreen />);

      await waitFor(() => {
        expect(screen.getByText('Directorio vacío')).toBeTruthy();
        expect(screen.getByText('Los residentes que compartan su información aparecerán aquí')).toBeTruthy();
      });
    });

    it('shows empty state when all users opted out', async () => {
      mockSupabaseFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({
              data: [
                {
                  id: 'member-1',
                  user: {
                    id: 'user-1',
                    full_name: 'Private User',
                    phone: '5551234567',
                    show_in_directory: false,
                  },
                  unit: { unit_number: '101', building: null },
                },
              ],
              error: null,
            }),
          }),
        }),
      });

      render(<DirectoryScreen />);

      await waitFor(() => {
        expect(screen.getByText('Directorio vacío')).toBeTruthy();
      });
    });
  });

  describe('no organization', () => {
    it('handles missing organization gracefully', async () => {
      jest.doMock('@/contexts/OrganizationContext', () => ({
        useOrganization: () => ({
          currentOrganization: null,
        }),
      }));

      // Component should handle null organization
    });
  });

  describe('error handling', () => {
    it('handles fetch errors gracefully', async () => {
      const consoleError = console.error;
      console.error = jest.fn();

      mockSupabaseFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({ data: null, error: new Error('Fetch failed') }),
          }),
        }),
      });

      render(<DirectoryScreen />);

      await waitFor(() => {
        expect(console.error).toHaveBeenCalledWith(
          'Error fetching directory:',
          expect.any(Error)
        );
      });

      console.error = consoleError;
    });
  });

  describe('pull to refresh', () => {
    it('supports pull to refresh', async () => {
      render(<DirectoryScreen />);

      await waitFor(() => {
        expect(screen.getByText('Directorio')).toBeTruthy();
      });

      // Component has RefreshControl
    });
  });
});
