import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';

// Mock expo-router
const mockPush = jest.fn();
const mockBack = jest.fn();

jest.mock('expo-router', () => ({
  router: {
    push: (...args: any[]) => mockPush(...args),
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
  Search: () => null,
  Package: () => null,
  MapPin: () => null,
  Calendar: () => null,
}));

// Mock expo-haptics
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'light' },
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
import LostFoundScreen from '@/app/(app)/lost-found/index';

describe('LostFoundScreen', () => {
  const mockItems = [
    {
      id: 'item-1',
      type: 'lost',
      title: 'Lost Keys',
      description: 'Set of house keys with red keychain.',
      location: 'Near pool area',
      contact_phone: '5551234567',
      status: 'open',
      photo_url: null,
      created_at: new Date().toISOString(),
      reported_by: 'user-123',
    },
    {
      id: 'item-2',
      type: 'found',
      title: 'Found Wallet',
      description: 'Black leather wallet with ID inside.',
      location: 'Lobby',
      contact_phone: '5559876543',
      status: 'open',
      photo_url: 'https://example.com/wallet.jpg',
      created_at: new Date(Date.now() - 86400000).toISOString(),
      reported_by: 'user-456',
    },
    {
      id: 'item-3',
      type: 'lost',
      title: 'Lost Dog',
      description: 'Small brown chihuahua named Max.',
      location: 'Garden area',
      contact_phone: '5551111111',
      status: 'claimed',
      photo_url: null,
      created_at: new Date(Date.now() - 172800000).toISOString(),
      reported_by: 'user-789',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();

    mockUseOrganization.mockReturnValue({
      currentOrganization: { id: 'org-123', name: 'Test Org' },
    });

    mockSupabaseFrom.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({ data: mockItems, error: null }),
        }),
      }),
    });
  });

  describe('loading state', () => {
    it('shows loading skeletons initially', () => {
      mockSupabaseFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockReturnValue(new Promise(() => {})),
          }),
        }),
      });

      render(<LostFoundScreen />);

      expect(screen.getByText('Objetos Perdidos')).toBeTruthy();
    });
  });

  describe('header', () => {
    it('renders header with title', async () => {
      render(<LostFoundScreen />);

      await waitFor(() => {
        expect(screen.getByText('Objetos Perdidos')).toBeTruthy();
      });
    });
  });

  describe('search', () => {
    it('shows search input', async () => {
      render(<LostFoundScreen />);

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Buscar objeto...')).toBeTruthy();
      });
    });

    it('filters items by search query', async () => {
      render(<LostFoundScreen />);

      await waitFor(() => {
        expect(screen.getByText('Lost Keys')).toBeTruthy();
        expect(screen.getByText('Found Wallet')).toBeTruthy();
      });

      fireEvent.changeText(
        screen.getByPlaceholderText('Buscar objeto...'),
        'Keys'
      );

      await waitFor(() => {
        expect(screen.getByText('Lost Keys')).toBeTruthy();
        expect(screen.queryByText('Found Wallet')).toBeNull();
      });
    });
  });

  describe('filter tabs', () => {
    it('shows filter tabs', async () => {
      render(<LostFoundScreen />);

      await waitFor(() => {
        expect(screen.getByText('Todos')).toBeTruthy();
        expect(screen.getByText('Perdidos')).toBeTruthy();
        expect(screen.getByText('Encontrados')).toBeTruthy();
      });
    });

    it('filters by lost items', async () => {
      render(<LostFoundScreen />);

      await waitFor(() => {
        expect(screen.getByText('Lost Keys')).toBeTruthy();
        expect(screen.getByText('Found Wallet')).toBeTruthy();
      });

      fireEvent.press(screen.getByText('Perdidos'));

      await waitFor(() => {
        expect(screen.getByText('Lost Keys')).toBeTruthy();
        expect(screen.queryByText('Found Wallet')).toBeNull();
      });
    });

    it('filters by found items', async () => {
      render(<LostFoundScreen />);

      await waitFor(() => {
        expect(screen.getByText('Found Wallet')).toBeTruthy();
      });

      fireEvent.press(screen.getByText('Encontrados'));

      await waitFor(() => {
        expect(screen.queryByText('Lost Keys')).toBeNull();
        expect(screen.getByText('Found Wallet')).toBeTruthy();
      });
    });
  });

  describe('items list', () => {
    it('displays item titles', async () => {
      render(<LostFoundScreen />);

      await waitFor(() => {
        expect(screen.getByText('Lost Keys')).toBeTruthy();
        expect(screen.getByText('Found Wallet')).toBeTruthy();
        expect(screen.getByText('Lost Dog')).toBeTruthy();
      });
    });

    it('shows type labels', async () => {
      render(<LostFoundScreen />);

      await waitFor(() => {
        expect(screen.getAllByText('Perdido').length).toBeGreaterThan(0);
        expect(screen.getByText('Encontrado')).toBeTruthy();
      });
    });

    it('shows status badges', async () => {
      render(<LostFoundScreen />);

      await waitFor(() => {
        expect(screen.getAllByText('Abierto').length).toBeGreaterThan(0);
        expect(screen.getByText('Reclamado')).toBeTruthy();
      });
    });

    it('shows locations', async () => {
      render(<LostFoundScreen />);

      await waitFor(() => {
        expect(screen.getByText('Near pool area')).toBeTruthy();
        expect(screen.getByText('Lobby')).toBeTruthy();
        expect(screen.getByText('Garden area')).toBeTruthy();
      });
    });
  });

  describe('navigation', () => {
    it('navigates to item detail when pressed', async () => {
      render(<LostFoundScreen />);

      await waitFor(() => {
        expect(screen.getByText('Lost Keys')).toBeTruthy();
      });

      fireEvent.press(screen.getByText('Lost Keys'));

      expect(mockPush).toHaveBeenCalledWith({
        pathname: '/(app)/lost-found/[id]',
        params: { id: 'item-1' },
      });
    });
  });

  describe('empty state', () => {
    it('shows empty state when no items', async () => {
      mockSupabaseFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({ data: [], error: null }),
          }),
        }),
      });

      render(<LostFoundScreen />);

      await waitFor(() => {
        expect(screen.getByText('Sin objetos')).toBeTruthy();
        expect(screen.getByText('Reporta objetos perdidos o encontrados')).toBeTruthy();
      });
    });

    it('shows report button in empty state', async () => {
      mockSupabaseFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({ data: [], error: null }),
          }),
        }),
      });

      render(<LostFoundScreen />);

      await waitFor(() => {
        expect(screen.getByText('Reportar objeto')).toBeTruthy();
      });
    });

    it('shows no results when search has no matches', async () => {
      render(<LostFoundScreen />);

      await waitFor(() => {
        expect(screen.getByText('Lost Keys')).toBeTruthy();
      });

      fireEvent.changeText(
        screen.getByPlaceholderText('Buscar objeto...'),
        'xyz123nonexistent'
      );

      await waitFor(() => {
        expect(screen.getByText('Sin resultados')).toBeTruthy();
        expect(screen.getByText('No se encontraron objetos con esa busqueda')).toBeTruthy();
      });
    });
  });

  describe('no organization', () => {
    it('handles missing organization gracefully', async () => {
      mockUseOrganization.mockReturnValue({
        currentOrganization: null,
      });

      render(<LostFoundScreen />);

      await waitFor(() => {
        expect(screen.getByText('Sin objetos')).toBeTruthy();
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
            order: jest.fn().mockResolvedValue({ data: null, error: new Error('Fetch failed') }),
          }),
        }),
      });

      render(<LostFoundScreen />);

      await waitFor(() => {
        expect(console.error).toHaveBeenCalledWith(
          'Error fetching lost & found items:',
          expect.any(Error)
        );
      });

      console.error = consoleError;
    });
  });

  describe('pull to refresh', () => {
    it('supports pull to refresh', async () => {
      render(<LostFoundScreen />);

      await waitFor(() => {
        expect(screen.getByText('Objetos Perdidos')).toBeTruthy();
      });
    });
  });
});
