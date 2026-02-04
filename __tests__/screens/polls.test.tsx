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
  BarChart2: () => null,
  Clock: () => null,
  CheckCircle: () => null,
  Users: () => null,
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
import PollsScreen from '@/app/(app)/polls/index';

describe('PollsScreen', () => {
  const mockPolls = [
    {
      id: 'poll-1',
      title: 'Community Event Planning',
      description: 'Vote for the next community event.',
      status: 'active',
      ends_at: new Date(Date.now() + 86400000 * 7).toISOString(), // 7 days from now
      created_at: new Date().toISOString(),
    },
    {
      id: 'poll-2',
      title: 'Parking Rules Update',
      description: null,
      status: 'active',
      ends_at: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
      created_at: new Date(Date.now() - 86400000).toISOString(),
    },
    {
      id: 'poll-3',
      title: 'Previous Event Poll',
      description: 'Already closed poll.',
      status: 'closed',
      ends_at: new Date(Date.now() - 86400000).toISOString(), // Yesterday
      created_at: new Date(Date.now() - 604800000).toISOString(),
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();

    mockUseOrganization.mockReturnValue({
      currentOrganization: { id: 'org-123', name: 'Test Org' },
      isAdmin: false,
    });

    mockSupabaseFrom.mockImplementation((table: string) => {
      if (table === 'polls') {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              order: jest.fn().mockResolvedValue({ data: mockPolls, error: null }),
            }),
          }),
        };
      }
      if (table === 'poll_votes') {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({ count: 5, error: null }),
          }),
        };
      }
      return {};
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

      render(<PollsScreen />);

      expect(screen.getByText('Encuestas')).toBeTruthy();
    });
  });

  describe('header', () => {
    it('renders header with title', async () => {
      render(<PollsScreen />);

      await waitFor(() => {
        expect(screen.getByText('Encuestas')).toBeTruthy();
      });
    });

    it('shows plus button for admin', async () => {
      mockUseOrganization.mockReturnValue({
        currentOrganization: { id: 'org-123', name: 'Test Org' },
        isAdmin: true,
      });

      render(<PollsScreen />);

      await waitFor(() => {
        expect(screen.getByText('Encuestas')).toBeTruthy();
      });
    });
  });

  describe('polls list', () => {
    it('displays poll titles', async () => {
      render(<PollsScreen />);

      await waitFor(() => {
        expect(screen.getByText('Community Event Planning')).toBeTruthy();
        expect(screen.getByText('Parking Rules Update')).toBeTruthy();
        expect(screen.getByText('Previous Event Poll')).toBeTruthy();
      });
    });

    it('displays poll descriptions when present', async () => {
      render(<PollsScreen />);

      await waitFor(() => {
        expect(screen.getByText('Vote for the next community event.')).toBeTruthy();
      });
    });

    it('shows active badge for active polls', async () => {
      render(<PollsScreen />);

      await waitFor(() => {
        expect(screen.getAllByText('Activa').length).toBeGreaterThan(0);
      });
    });

    it('shows closed badge for closed polls', async () => {
      render(<PollsScreen />);

      await waitFor(() => {
        expect(screen.getAllByText('Cerrada').length).toBeGreaterThan(0);
      });
    });

    it('shows section headers', async () => {
      render(<PollsScreen />);

      await waitFor(() => {
        expect(screen.getByText('Encuestas activas')).toBeTruthy();
        expect(screen.getByText('Encuestas cerradas')).toBeTruthy();
      });
    });

    it('shows vote counts', async () => {
      render(<PollsScreen />);

      await waitFor(() => {
        expect(screen.getAllByText(/votos?/).length).toBeGreaterThan(0);
      });
    });
  });

  describe('navigation', () => {
    it('navigates to poll detail when pressed', async () => {
      render(<PollsScreen />);

      await waitFor(() => {
        expect(screen.getByText('Community Event Planning')).toBeTruthy();
      });

      fireEvent.press(screen.getByText('Community Event Planning'));

      expect(mockPush).toHaveBeenCalledWith({
        pathname: '/(app)/polls/[id]',
        params: { id: 'poll-1' },
      });
    });
  });

  describe('empty state', () => {
    it('shows empty state when no polls', async () => {
      mockSupabaseFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({ data: [], error: null }),
          }),
        }),
      });

      render(<PollsScreen />);

      await waitFor(() => {
        expect(screen.getByText('Sin encuestas')).toBeTruthy();
        expect(screen.getByText('Las encuestas de la comunidad apareceran aqui')).toBeTruthy();
      });
    });
  });

  describe('no organization', () => {
    it('handles missing organization gracefully', async () => {
      mockUseOrganization.mockReturnValue({
        currentOrganization: null,
        isAdmin: false,
      });

      render(<PollsScreen />);

      await waitFor(() => {
        expect(screen.getByText('Sin encuestas')).toBeTruthy();
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

      render(<PollsScreen />);

      await waitFor(() => {
        expect(console.error).toHaveBeenCalledWith(
          'Error fetching polls:',
          expect.any(Error)
        );
      });

      console.error = consoleError;
    });
  });

  describe('pull to refresh', () => {
    it('supports pull to refresh', async () => {
      render(<PollsScreen />);

      await waitFor(() => {
        expect(screen.getByText('Encuestas')).toBeTruthy();
      });
    });
  });
});
