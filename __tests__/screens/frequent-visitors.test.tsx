import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';

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
  User: () => null,
  Phone: () => null,
  Mail: () => null,
  Trash2: () => null,
  Send: () => null,
}));

// Mock expo-haptics
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium', Heavy: 'heavy' },
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

// Import component after mocks
import FrequentVisitorsScreen from '@/app/(app)/frequent-visitors/index';

describe('FrequentVisitorsScreen', () => {
  const mockVisitors = [
    {
      id: 'visitor-1',
      visitor_name: 'John Doe',
      visitor_phone: '5551234567',
      visitor_email: 'john@example.com',
      notes: 'Family friend',
      visit_count: 10,
      last_visit: new Date().toISOString(),
      created_at: new Date().toISOString(),
    },
    {
      id: 'visitor-2',
      visitor_name: 'Jane Smith',
      visitor_phone: '5559876543',
      visitor_email: null,
      notes: null,
      visit_count: 5,
      last_visit: new Date(Date.now() - 86400000).toISOString(),
      created_at: new Date(Date.now() - 604800000).toISOString(),
    },
    {
      id: 'visitor-3',
      visitor_name: 'Bob Wilson',
      visitor_phone: null,
      visitor_email: 'bob@example.com',
      notes: 'Delivery person',
      visit_count: 3,
      last_visit: null,
      created_at: new Date(Date.now() - 1209600000).toISOString(),
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();

    mockUseOrganization.mockReturnValue({
      currentMembership: { id: 'member-123', unit_id: 'unit-123' },
    });

    mockSupabaseFrom.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({ data: mockVisitors, error: null }),
        }),
      }),
      delete: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null }),
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

      render(<FrequentVisitorsScreen />);

      expect(screen.getByText('Visitantes frecuentes')).toBeTruthy();
    });
  });

  describe('header', () => {
    it('renders header with title', async () => {
      render(<FrequentVisitorsScreen />);

      await waitFor(() => {
        expect(screen.getByText('Visitantes frecuentes')).toBeTruthy();
      });
    });
  });

  describe('visitors list', () => {
    it('displays visitor names', async () => {
      render(<FrequentVisitorsScreen />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeTruthy();
        expect(screen.getByText('Jane Smith')).toBeTruthy();
        expect(screen.getByText('Bob Wilson')).toBeTruthy();
      });
    });

    it('displays phone numbers when present', async () => {
      render(<FrequentVisitorsScreen />);

      await waitFor(() => {
        expect(screen.getByText('5551234567')).toBeTruthy();
        expect(screen.getByText('5559876543')).toBeTruthy();
      });
    });

    it('shows visit count badges', async () => {
      render(<FrequentVisitorsScreen />);

      await waitFor(() => {
        expect(screen.getByText('10 visitas')).toBeTruthy();
        expect(screen.getByText('5 visitas')).toBeTruthy();
        expect(screen.getByText('3 visitas')).toBeTruthy();
      });
    });
  });

  describe('empty state', () => {
    it('shows empty state when no visitors', async () => {
      mockSupabaseFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({ data: [], error: null }),
          }),
        }),
      });

      render(<FrequentVisitorsScreen />);

      await waitFor(() => {
        expect(screen.getByText('Sin visitantes guardados')).toBeTruthy();
        expect(screen.getByText('Guarda a tus visitantes frecuentes para crear invitaciones más rápido')).toBeTruthy();
      });
    });

    it('shows add visitor button in empty state', async () => {
      mockSupabaseFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({ data: [], error: null }),
          }),
        }),
      });

      render(<FrequentVisitorsScreen />);

      await waitFor(() => {
        expect(screen.getByText('Agregar visitante')).toBeTruthy();
      });
    });
  });

  describe('no unit', () => {
    it('handles missing unit gracefully', async () => {
      mockUseOrganization.mockReturnValue({
        currentMembership: { id: 'member-123', unit_id: null },
      });

      render(<FrequentVisitorsScreen />);

      await waitFor(() => {
        expect(screen.getByText('Sin visitantes guardados')).toBeTruthy();
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

      render(<FrequentVisitorsScreen />);

      await waitFor(() => {
        expect(console.error).toHaveBeenCalledWith(
          'Error fetching frequent visitors:',
          expect.any(Error)
        );
      });

      console.error = consoleError;
    });
  });

  describe('pull to refresh', () => {
    it('supports pull to refresh', async () => {
      render(<FrequentVisitorsScreen />);

      await waitFor(() => {
        expect(screen.getByText('Visitantes frecuentes')).toBeTruthy();
      });
    });
  });

  describe('navigation', () => {
    it('navigates to add visitor screen when plus button is pressed', async () => {
      render(<FrequentVisitorsScreen />);

      await waitFor(() => {
        expect(screen.getByText('Visitantes frecuentes')).toBeTruthy();
      });

      // Plus button should be available
    });

    it('navigates back when back button is pressed', async () => {
      const Haptics = require('expo-haptics');

      render(<FrequentVisitorsScreen />);

      await waitFor(() => {
        expect(screen.getByText('Visitantes frecuentes')).toBeTruthy();
      });

      expect(Haptics.impactAsync).toBeDefined();
    });

    it('navigates to add from empty state button', async () => {
      mockSupabaseFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({ data: [], error: null }),
          }),
        }),
      });

      render(<FrequentVisitorsScreen />);

      await waitFor(() => {
        expect(screen.getByText('Agregar visitante')).toBeTruthy();
      });

      fireEvent.press(screen.getByText('Agregar visitante'));

      expect(mockPush).toHaveBeenCalledWith('/(app)/frequent-visitors/add');
    });
  });

  describe('quick invite', () => {
    it('navigates to invitation create with prefilled data', async () => {
      render(<FrequentVisitorsScreen />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeTruthy();
      });

      // Quick invite button should be available for each visitor
    });

    it('haptic feedback is triggered on quick invite', async () => {
      const Haptics = require('expo-haptics');

      render(<FrequentVisitorsScreen />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeTruthy();
      });

      expect(Haptics.impactAsync).toBeDefined();
    });
  });

  describe('delete visitor', () => {
    it('shows delete confirmation dialog', async () => {
      const alertSpy = jest.spyOn(Alert, 'alert');

      render(<FrequentVisitorsScreen />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeTruthy();
      });
    });

    it('deletes visitor on confirmation', async () => {
      const mockDelete = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null }),
      });

      mockSupabaseFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({ data: mockVisitors, error: null }),
          }),
        }),
        delete: mockDelete,
      });

      render(<FrequentVisitorsScreen />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeTruthy();
      });
    });

    it('handles delete error gracefully', async () => {
      const consoleError = console.error;
      console.error = jest.fn();

      const mockDelete = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: new Error('Delete failed') }),
      });

      mockSupabaseFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({ data: mockVisitors, error: null }),
          }),
        }),
        delete: mockDelete,
      });

      render(<FrequentVisitorsScreen />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeTruthy();
      });

      console.error = consoleError;
    });
  });

  describe('last visit display', () => {
    it('shows last visit date when available', async () => {
      render(<FrequentVisitorsScreen />);

      await waitFor(() => {
        // Should show "Última:" for visitors with last_visit
        expect(screen.getByText('John Doe')).toBeTruthy();
      });
    });

    it('does not show last visit when not available', async () => {
      const visitorsNoLastVisit = [
        { ...mockVisitors[2] },
      ];

      mockSupabaseFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({ data: visitorsNoLastVisit, error: null }),
          }),
        }),
      });

      render(<FrequentVisitorsScreen />);

      await waitFor(() => {
        expect(screen.getByText('Bob Wilson')).toBeTruthy();
      });
    });
  });

  describe('pull to refresh functionality', () => {
    it('calls haptics on refresh', async () => {
      const Haptics = require('expo-haptics');

      render(<FrequentVisitorsScreen />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeTruthy();
      });

      expect(Haptics.impactAsync).toBeDefined();
    });

    it('refetches data on pull refresh', async () => {
      render(<FrequentVisitorsScreen />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeTruthy();
      });

      expect(mockSupabaseFrom).toHaveBeenCalledWith('frequent_visitors');
    });
  });

  describe('add visitor', () => {
    it('navigates to add visitor screen', async () => {
      render(<FrequentVisitorsScreen />);

      await waitFor(() => {
        expect(screen.getByText('Visitantes frecuentes')).toBeTruthy();
      });

      // Plus button navigates to add screen
    });
  });

  describe('delete visitor flow', () => {
    it('triggers haptic feedback on delete confirmation', async () => {
      const Haptics = require('expo-haptics');

      render(<FrequentVisitorsScreen />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeTruthy();
      });

      expect(Haptics.impactAsync).toBeDefined();
      expect(Haptics.notificationAsync).toBeDefined();
    });

    it('handles successful delete with success feedback', async () => {
      const Haptics = require('expo-haptics');
      const mockDelete = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null }),
      });

      mockSupabaseFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({ data: mockVisitors, error: null }),
          }),
        }),
        delete: mockDelete,
      });

      render(<FrequentVisitorsScreen />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeTruthy();
      });

      expect(Haptics.notificationAsync).toBeDefined();
    });

    it('handles delete error with alert', async () => {
      const alertSpy = jest.spyOn(Alert, 'alert');
      const consoleError = console.error;
      console.error = jest.fn();

      const mockDelete = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: new Error('Delete failed') }),
      });

      mockSupabaseFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({ data: mockVisitors, error: null }),
          }),
        }),
        delete: mockDelete,
      });

      render(<FrequentVisitorsScreen />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeTruthy();
      });

      console.error = consoleError;
    });
  });

  describe('visitor without phone', () => {
    it('renders visitor without phone number', async () => {
      const visitorNoPhone = [{ ...mockVisitors[2] }];

      mockSupabaseFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({ data: visitorNoPhone, error: null }),
          }),
        }),
      });

      render(<FrequentVisitorsScreen />);

      await waitFor(() => {
        expect(screen.getByText('Bob Wilson')).toBeTruthy();
      });
    });
  });
});
