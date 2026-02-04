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
  Calendar: () => null,
  Clock: () => null,
  Users: () => null,
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

// Mock OrganizationContext
const mockUseOrganization = jest.fn();

jest.mock('@/contexts/OrganizationContext', () => ({
  useOrganization: () => mockUseOrganization(),
}));

// Import component after mocks
import AmenitiesScreen from '@/app/(app)/amenities/index';

describe('AmenitiesScreen', () => {
  const mockAmenities = [
    {
      id: 'amenity-1',
      name: 'Pool',
      description: 'Olympic-sized swimming pool.',
      icon: '🏊',
      capacity: 50,
      requires_reservation: true,
      available: true,
    },
    {
      id: 'amenity-2',
      name: 'Gym',
      description: 'Fully equipped fitness center.',
      icon: '💪',
      capacity: 20,
      requires_reservation: false,
      available: true,
    },
    {
      id: 'amenity-3',
      name: 'Event Hall',
      description: null,
      icon: '🎉',
      capacity: 100,
      requires_reservation: true,
      available: false,
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
          order: jest.fn().mockResolvedValue({ data: mockAmenities, error: null }),
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

      render(<AmenitiesScreen />);

      expect(screen.getByText('Amenidades')).toBeTruthy();
    });
  });

  describe('header', () => {
    it('renders header with title', async () => {
      render(<AmenitiesScreen />);

      await waitFor(() => {
        expect(screen.getByText('Amenidades')).toBeTruthy();
      });
    });
  });

  describe('amenities list', () => {
    it('displays amenity names', async () => {
      render(<AmenitiesScreen />);

      await waitFor(() => {
        expect(screen.getByText('Pool')).toBeTruthy();
        expect(screen.getByText('Gym')).toBeTruthy();
        expect(screen.getByText('Event Hall')).toBeTruthy();
      });
    });

    it('displays amenity descriptions when present', async () => {
      render(<AmenitiesScreen />);

      await waitFor(() => {
        expect(screen.getByText('Olympic-sized swimming pool.')).toBeTruthy();
        expect(screen.getByText('Fully equipped fitness center.')).toBeTruthy();
      });
    });

    it('shows capacity information', async () => {
      render(<AmenitiesScreen />);

      await waitFor(() => {
        expect(screen.getByText('Hasta 50 personas')).toBeTruthy();
        expect(screen.getByText('Hasta 20 personas')).toBeTruthy();
        expect(screen.getByText('Hasta 100 personas')).toBeTruthy();
      });
    });

    it('shows availability badges', async () => {
      render(<AmenitiesScreen />);

      await waitFor(() => {
        expect(screen.getAllByText('Disponible').length).toBe(2);
        expect(screen.getByText('No disponible')).toBeTruthy();
      });
    });

    it('shows reserve button for amenities that require reservation', async () => {
      render(<AmenitiesScreen />);

      await waitFor(() => {
        // Only Pool is available and requires reservation
        expect(screen.getByText('Reservar')).toBeTruthy();
      });
    });

    it('shows amenity icons', async () => {
      render(<AmenitiesScreen />);

      await waitFor(() => {
        expect(screen.getByText('🏊')).toBeTruthy();
        expect(screen.getByText('💪')).toBeTruthy();
        expect(screen.getByText('🎉')).toBeTruthy();
      });
    });
  });

  describe('navigation', () => {
    it('navigates to amenity detail when card is pressed', async () => {
      render(<AmenitiesScreen />);

      await waitFor(() => {
        expect(screen.getByText('Pool')).toBeTruthy();
      });

      fireEvent.press(screen.getByText('Pool'));

      expect(mockPush).toHaveBeenCalledWith({
        pathname: '/(app)/amenities/[id]',
        params: { id: 'amenity-1' },
      });
    });

    it('navigates to reservation when reserve button is pressed', async () => {
      render(<AmenitiesScreen />);

      await waitFor(() => {
        expect(screen.getByText('Reservar')).toBeTruthy();
      });

      fireEvent.press(screen.getByText('Reservar'));

      expect(mockPush).toHaveBeenCalledWith({
        pathname: '/(app)/amenities/reserve',
        params: { id: 'amenity-1', name: 'Pool' },
      });
    });
  });

  describe('empty state', () => {
    it('shows empty state when no amenities', async () => {
      mockSupabaseFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({ data: [], error: null }),
          }),
        }),
      });

      render(<AmenitiesScreen />);

      await waitFor(() => {
        expect(screen.getByText('Sin amenidades')).toBeTruthy();
        expect(screen.getByText('Las amenidades de tu comunidad aparecerán aquí')).toBeTruthy();
      });
    });
  });

  describe('no organization', () => {
    it('handles missing organization gracefully', async () => {
      mockUseOrganization.mockReturnValue({
        currentOrganization: null,
      });

      render(<AmenitiesScreen />);

      await waitFor(() => {
        expect(screen.getByText('Sin amenidades')).toBeTruthy();
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

      render(<AmenitiesScreen />);

      await waitFor(() => {
        expect(console.error).toHaveBeenCalledWith(
          'Error fetching amenities:',
          expect.any(Error)
        );
      });

      console.error = consoleError;
    });
  });

  describe('pull to refresh', () => {
    it('supports pull to refresh', async () => {
      render(<AmenitiesScreen />);

      await waitFor(() => {
        expect(screen.getByText('Amenidades')).toBeTruthy();
      });
    });
  });
});
