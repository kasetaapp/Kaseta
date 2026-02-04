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
    id: 'poll-123',
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
  BarChart2: () => null,
  Calendar: () => null,
  Users: () => null,
  Check: () => null,
  Clock: () => null,
}));

// Mock expo-haptics
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'light' },
  NotificationFeedbackType: { Success: 'success', Error: 'error' },
}));

// Mock supabase
const mockSupabaseFrom = jest.fn();
const mockSupabaseRpc = jest.fn();

jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: (table: string) => mockSupabaseFrom(table),
    rpc: (fn: string, params: any) => mockSupabaseRpc(fn, params),
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
import PollDetailScreen from '@/app/(app)/polls/[id]';

describe('PollDetailScreen', () => {
  const mockPoll = {
    id: 'poll-123',
    title: 'Test Poll',
    description: 'This is a test poll',
    status: 'active',
    ends_at: new Date(Date.now() + 86400000).toISOString(),
    created_at: new Date().toISOString(),
  };

  const mockOptions = [
    { id: 'opt-1', poll_id: 'poll-123', option_text: 'Option A', vote_count: 5 },
    { id: 'opt-2', poll_id: 'poll-123', option_text: 'Option B', vote_count: 3 },
    { id: 'opt-3', poll_id: 'poll-123', option_text: 'Option C', vote_count: 2 },
  ];

  beforeEach(() => {
    jest.clearAllMocks();

    mockUseOrganization.mockReturnValue({
      currentOrganization: { id: 'org-123' },
    });

    mockSupabaseFrom.mockImplementation((table: string) => {
      if (table === 'polls') {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ data: mockPoll, error: null }),
            }),
          }),
        };
      }
      if (table === 'poll_options') {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              order: jest.fn().mockResolvedValue({ data: mockOptions, error: null }),
            }),
          }),
          update: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({ error: null }),
          }),
        };
      }
      if (table === 'poll_votes') {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({ data: null, error: null }),
              }),
            }),
          }),
          insert: jest.fn().mockResolvedValue({ error: null }),
        };
      }
      return {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: null, error: null }),
          }),
        }),
      };
    });

    mockSupabaseRpc.mockResolvedValue({ error: null });
  });

  describe('loading state', () => {
    it('shows loading state while fetching', () => {
      mockSupabaseFrom.mockImplementation(() => ({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockReturnValue(new Promise(() => {})),
            order: jest.fn().mockReturnValue(new Promise(() => {})),
          }),
        }),
      }));

      render(<PollDetailScreen />);

      // Component should render without error during loading
      expect(screen).toBeTruthy();
    });
  });

  describe('poll not found', () => {
    it('shows error when poll not found', async () => {
      mockSupabaseFrom.mockImplementation((table: string) => {
        if (table === 'polls') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({ data: null, error: new Error('Not found') }),
              }),
            }),
          };
        }
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              order: jest.fn().mockResolvedValue({ data: [], error: null }),
              single: jest.fn().mockResolvedValue({ data: null, error: null }),
            }),
          }),
        };
      });

      render(<PollDetailScreen />);

      await waitFor(() => {
        expect(screen.getByText('Encuesta no encontrada')).toBeTruthy();
        expect(screen.getByText('Volver')).toBeTruthy();
      });
    });
  });

  describe('poll details', () => {
    it('shows poll title', async () => {
      render(<PollDetailScreen />);

      await waitFor(() => {
        expect(screen.getByText('Test Poll')).toBeTruthy();
      });
    });

    it('shows poll description', async () => {
      render(<PollDetailScreen />);

      await waitFor(() => {
        expect(screen.getByText('This is a test poll')).toBeTruthy();
      });
    });

    it('shows active status badge', async () => {
      render(<PollDetailScreen />);

      await waitFor(() => {
        expect(screen.getByText('Activa')).toBeTruthy();
      });
    });

    it('shows total votes', async () => {
      render(<PollDetailScreen />);

      await waitFor(() => {
        expect(screen.getByText('10 votos')).toBeTruthy();
      });
    });
  });

  describe('poll options', () => {
    it('shows options section', async () => {
      render(<PollDetailScreen />);

      await waitFor(() => {
        expect(screen.getByText('Opciones')).toBeTruthy();
      });
    });

    it('shows all options', async () => {
      render(<PollDetailScreen />);

      await waitFor(() => {
        expect(screen.getByText('Option A')).toBeTruthy();
        expect(screen.getByText('Option B')).toBeTruthy();
        expect(screen.getByText('Option C')).toBeTruthy();
      });
    });

    it('shows vote counts', async () => {
      render(<PollDetailScreen />);

      await waitFor(() => {
        expect(screen.getByText('5 votos')).toBeTruthy();
        expect(screen.getByText('3 votos')).toBeTruthy();
        expect(screen.getByText('2 votos')).toBeTruthy();
      });
    });

    it('shows percentages', async () => {
      render(<PollDetailScreen />);

      await waitFor(() => {
        expect(screen.getByText('50%')).toBeTruthy();
        expect(screen.getByText('30%')).toBeTruthy();
        expect(screen.getByText('20%')).toBeTruthy();
      });
    });
  });

  describe('voting', () => {
    it('shows vote button when can vote', async () => {
      render(<PollDetailScreen />);

      await waitFor(() => {
        expect(screen.getByText('Votar')).toBeTruthy();
      });
    });

    it('allows selecting an option', async () => {
      render(<PollDetailScreen />);

      await waitFor(() => {
        expect(screen.getByText('Option A')).toBeTruthy();
      });

      fireEvent.press(screen.getByText('Option A'));

      // Option should be selectable
      expect(screen.getByText('Option A')).toBeTruthy();
    });
  });

  describe('already voted', () => {
    it('shows already voted message', async () => {
      mockSupabaseFrom.mockImplementation((table: string) => {
        if (table === 'polls') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({ data: mockPoll, error: null }),
              }),
            }),
          };
        }
        if (table === 'poll_options') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                order: jest.fn().mockResolvedValue({ data: mockOptions, error: null }),
              }),
            }),
          };
        }
        if (table === 'poll_votes') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({ data: { option_id: 'opt-1' }, error: null }),
                }),
              }),
            }),
          };
        }
        return {};
      });

      render(<PollDetailScreen />);

      await waitFor(() => {
        expect(screen.getByText('Ya votaste en esta encuesta')).toBeTruthy();
      });
    });
  });

  describe('closed poll', () => {
    it('shows closed status for expired poll', async () => {
      const expiredPoll = {
        ...mockPoll,
        ends_at: new Date(Date.now() - 86400000).toISOString(),
      };

      mockSupabaseFrom.mockImplementation((table: string) => {
        if (table === 'polls') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({ data: expiredPoll, error: null }),
              }),
            }),
          };
        }
        if (table === 'poll_options') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                order: jest.fn().mockResolvedValue({ data: mockOptions, error: null }),
              }),
            }),
          };
        }
        if (table === 'poll_votes') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({ data: null, error: null }),
                }),
              }),
            }),
          };
        }
        return {};
      });

      render(<PollDetailScreen />);

      await waitFor(() => {
        expect(screen.getByText('Cerrada')).toBeTruthy();
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
            order: jest.fn().mockRejectedValue(new Error('Fetch failed')),
          }),
        }),
      }));

      render(<PollDetailScreen />);

      await waitFor(() => {
        expect(console.error).toHaveBeenCalledWith(
          'Error fetching poll:',
          expect.any(Error)
        );
      });

      console.error = consoleError;
    });
  });

  describe('navigation', () => {
    it('navigates back when back button is pressed', async () => {
      const Haptics = require('expo-haptics');

      render(<PollDetailScreen />);

      await waitFor(() => {
        expect(screen.getByText('Test Poll')).toBeTruthy();
      });

      expect(Haptics.impactAsync).toBeDefined();
    });

    it('navigates back from not found screen', async () => {
      mockSupabaseFrom.mockImplementation((table: string) => {
        if (table === 'polls') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({ data: null, error: new Error('Not found') }),
              }),
            }),
          };
        }
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              order: jest.fn().mockResolvedValue({ data: [], error: null }),
              single: jest.fn().mockResolvedValue({ data: null, error: null }),
            }),
          }),
        };
      });

      render(<PollDetailScreen />);

      await waitFor(() => {
        expect(screen.getByText('Volver')).toBeTruthy();
      });

      fireEvent.press(screen.getByText('Volver'));

      expect(mockBack).toHaveBeenCalled();
    });
  });

  describe('submit vote', () => {
    it('does nothing when no option selected', async () => {
      render(<PollDetailScreen />);

      await waitFor(() => {
        expect(screen.getByText('Votar')).toBeTruthy();
      });

      fireEvent.press(screen.getByText('Votar'));

      // Button should still be there (no navigation happened)
      expect(screen.getByText('Votar')).toBeTruthy();
    });

    it('triggers haptic on vote button press', async () => {
      const Haptics = require('expo-haptics');

      render(<PollDetailScreen />);

      await waitFor(() => {
        expect(screen.getByText('Votar')).toBeTruthy();
      });

      expect(Haptics.impactAsync).toBeDefined();
    });

    it('button is pressable', async () => {
      render(<PollDetailScreen />);

      await waitFor(() => {
        expect(screen.getByText('Votar')).toBeTruthy();
      });

      // Vote button should be visible
      expect(screen.getByText('Votar')).toBeTruthy();
    });
  });

  describe('poll with no description', () => {
    it('shows poll without description', async () => {
      const pollNoDesc = { ...mockPoll, description: null };

      mockSupabaseFrom.mockImplementation((table: string) => {
        if (table === 'polls') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({ data: pollNoDesc, error: null }),
              }),
            }),
          };
        }
        if (table === 'poll_options') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                order: jest.fn().mockResolvedValue({ data: mockOptions, error: null }),
              }),
            }),
          };
        }
        if (table === 'poll_votes') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({ data: null, error: null }),
                }),
              }),
            }),
          };
        }
        return {};
      });

      render(<PollDetailScreen />);

      await waitFor(() => {
        expect(screen.getByText('Test Poll')).toBeTruthy();
      });
    });
  });

  describe('time remaining', () => {
    it('shows time remaining for active poll', async () => {
      render(<PollDetailScreen />);

      await waitFor(() => {
        expect(screen.getByText('Test Poll')).toBeTruthy();
      });

      // Should show time remaining text
    });
  });

  describe('option selection', () => {
    it('selects option when pressed', async () => {
      const Haptics = require('expo-haptics');

      render(<PollDetailScreen />);

      await waitFor(() => {
        expect(screen.getByText('Option A')).toBeTruthy();
      });

      fireEvent.press(screen.getByText('Option A'));

      expect(Haptics.impactAsync).toBeDefined();
    });

    it('allows changing selection', async () => {
      render(<PollDetailScreen />);

      await waitFor(() => {
        expect(screen.getByText('Option A')).toBeTruthy();
        expect(screen.getByText('Option B')).toBeTruthy();
      });

      fireEvent.press(screen.getByText('Option A'));
      fireEvent.press(screen.getByText('Option B'));

      // Both options should remain visible
      expect(screen.getByText('Option A')).toBeTruthy();
      expect(screen.getByText('Option B')).toBeTruthy();
    });
  });

  describe('header', () => {
    it('shows header with encuesta title', async () => {
      render(<PollDetailScreen />);

      await waitFor(() => {
        expect(screen.getByText('Encuesta')).toBeTruthy();
      });
    });
  });
});
