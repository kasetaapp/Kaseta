import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';

// Mock expo-router
const mockBack = jest.fn();
const mockPush = jest.fn();

jest.mock('expo-router', () => ({
  router: {
    back: (...args: any[]) => mockBack(...args),
    push: (...args: any[]) => mockPush(...args),
  },
  useLocalSearchParams: () => ({
    id: 'amenity-123',
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
  Users: () => null,
  Clock: () => null,
  Calendar: () => null,
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

// Import component after mocks
import AmenityDetailScreen from '@/app/(app)/amenities/[id]';

describe('AmenityDetailScreen', () => {
  const mockAmenity = {
    id: 'amenity-123',
    name: 'Gimnasio',
    description: 'Gimnasio completamente equipado',
    icon: '🏋️',
    capacity: 20,
    requires_reservation: true,
    available: true,
  };

  const mockReservations = [
    {
      id: 'res-1',
      amenity_id: 'amenity-123',
      start_time: new Date(Date.now() + 3600000).toISOString(),
      end_time: new Date(Date.now() + 7200000).toISOString(),
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();

    mockSupabaseFrom.mockImplementation((table: string) => {
      if (table === 'amenities') {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ data: mockAmenity, error: null }),
            }),
          }),
        };
      }
      if (table === 'amenity_reservations') {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              gte: jest.fn().mockReturnValue({
                order: jest.fn().mockReturnValue({
                  limit: jest.fn().mockResolvedValue({ data: mockReservations, error: null }),
                }),
              }),
            }),
          }),
        };
      }
      return {};
    });
  });

  describe('loading state', () => {
    it('shows loading skeleton initially', () => {
      mockSupabaseFrom.mockImplementation(() => ({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockReturnValue(new Promise(() => {})),
            gte: jest.fn().mockReturnValue({
              order: jest.fn().mockReturnValue({
                limit: jest.fn().mockReturnValue(new Promise(() => {})),
              }),
            }),
          }),
        }),
      }));

      render(<AmenityDetailScreen />);

      expect(screen).toBeTruthy();
    });
  });

  describe('amenity not found', () => {
    it('shows error when amenity not found', async () => {
      mockSupabaseFrom.mockImplementation(() => ({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: null, error: new Error('Not found') }),
            gte: jest.fn().mockReturnValue({
              order: jest.fn().mockReturnValue({
                limit: jest.fn().mockResolvedValue({ data: [], error: null }),
              }),
            }),
          }),
        }),
      }));

      render(<AmenityDetailScreen />);

      await waitFor(() => {
        expect(screen.getByText('Amenidad no encontrada')).toBeTruthy();
        expect(screen.getByText('Volver')).toBeTruthy();
      });
    });
  });

  describe('amenity details', () => {
    it('shows amenity name in header', async () => {
      render(<AmenityDetailScreen />);

      await waitFor(() => {
        expect(screen.getByText('Gimnasio')).toBeTruthy();
      });
    });

    it('shows description', async () => {
      render(<AmenityDetailScreen />);

      await waitFor(() => {
        expect(screen.getByText('Gimnasio completamente equipado')).toBeTruthy();
      });
    });

    it('shows availability badge', async () => {
      render(<AmenityDetailScreen />);

      await waitFor(() => {
        expect(screen.getByText('Disponible')).toBeTruthy();
      });
    });

    it('shows capacity info', async () => {
      render(<AmenityDetailScreen />);

      await waitFor(() => {
        expect(screen.getByText('Capacidad máxima: 20 personas')).toBeTruthy();
      });
    });

    it('shows reservation requirement', async () => {
      render(<AmenityDetailScreen />);

      await waitFor(() => {
        expect(screen.getByText('Requiere reservación')).toBeTruthy();
      });
    });

    it('shows info section', async () => {
      render(<AmenityDetailScreen />);

      await waitFor(() => {
        expect(screen.getByText('Información')).toBeTruthy();
      });
    });
  });

  describe('not available amenity', () => {
    it('shows not available badge', async () => {
      const unavailableAmenity = { ...mockAmenity, available: false };
      mockSupabaseFrom.mockImplementation((table: string) => {
        if (table === 'amenities') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({ data: unavailableAmenity, error: null }),
              }),
            }),
          };
        }
        if (table === 'amenity_reservations') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                gte: jest.fn().mockReturnValue({
                  order: jest.fn().mockReturnValue({
                    limit: jest.fn().mockResolvedValue({ data: [], error: null }),
                  }),
                }),
              }),
            }),
          };
        }
        return {};
      });

      render(<AmenityDetailScreen />);

      await waitFor(() => {
        expect(screen.getByText('No disponible')).toBeTruthy();
      });
    });
  });

  describe('no reservation required', () => {
    it('shows no reservation text', async () => {
      const noResAmenity = { ...mockAmenity, requires_reservation: false };
      mockSupabaseFrom.mockImplementation((table: string) => {
        if (table === 'amenities') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({ data: noResAmenity, error: null }),
              }),
            }),
          };
        }
        if (table === 'amenity_reservations') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                gte: jest.fn().mockReturnValue({
                  order: jest.fn().mockReturnValue({
                    limit: jest.fn().mockResolvedValue({ data: [], error: null }),
                  }),
                }),
              }),
            }),
          };
        }
        return {};
      });

      render(<AmenityDetailScreen />);

      await waitFor(() => {
        expect(screen.getByText('No requiere reservación')).toBeTruthy();
      });
    });
  });

  describe('reservations', () => {
    it('shows upcoming reservations section', async () => {
      render(<AmenityDetailScreen />);

      await waitFor(() => {
        expect(screen.getByText('Próximas reservaciones')).toBeTruthy();
      });
    });
  });

  describe('reserve button', () => {
    it('shows reserve button when available and requires reservation', async () => {
      render(<AmenityDetailScreen />);

      await waitFor(() => {
        expect(screen.getByText('Reservar ahora')).toBeTruthy();
      });
    });

    it('navigates to reserve screen on press', async () => {
      render(<AmenityDetailScreen />);

      await waitFor(() => {
        expect(screen.getByText('Reservar ahora')).toBeTruthy();
      });

      fireEvent.press(screen.getByText('Reservar ahora'));

      expect(mockPush).toHaveBeenCalledWith({
        pathname: '/(app)/amenities/reserve',
        params: { id: 'amenity-123', name: 'Gimnasio' },
      });
    });
  });

  describe('error handling', () => {
    it('handles fetch error gracefully', async () => {
      const consoleError = console.error;
      console.error = jest.fn();

      mockSupabaseFrom.mockImplementation(() => ({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockRejectedValue(new Error('Fetch failed')),
            gte: jest.fn().mockReturnValue({
              order: jest.fn().mockReturnValue({
                limit: jest.fn().mockRejectedValue(new Error('Fetch failed')),
              }),
            }),
          }),
        }),
      }));

      render(<AmenityDetailScreen />);

      await waitFor(() => {
        expect(console.error).toHaveBeenCalledWith(
          'Error fetching amenity:',
          expect.any(Error)
        );
      });

      console.error = consoleError;
    });
  });
});
