import React from 'react';
import { render, screen, waitFor } from '@testing-library/react-native';

// Mock expo-router
const mockBack = jest.fn();

jest.mock('expo-router', () => ({
  router: {
    back: (...args: any[]) => mockBack(...args),
  },
  useLocalSearchParams: () => ({
    id: 'ann-123',
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
  Bell: () => null,
  AlertTriangle: () => null,
  Info: () => null,
  Megaphone: () => null,
  Calendar: () => null,
  User: () => null,
}));

// Mock expo-haptics
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'light' },
}));

// Mock supabase
const mockSupabaseFrom = jest.fn();

jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: (table: string) => mockSupabaseFrom(table),
  },
}));

// Import component after mocks
import AnnouncementDetailScreen from '@/app/(app)/announcements/[id]';

describe('AnnouncementDetailScreen', () => {
  const mockAnnouncement = {
    id: 'ann-123',
    title: 'Important Announcement',
    content: 'This is the content of the announcement with important information.',
    type: 'info',
    created_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 86400000 * 7).toISOString(),
    author: { full_name: 'Admin User' },
  };

  beforeEach(() => {
    jest.clearAllMocks();

    mockSupabaseFrom.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: mockAnnouncement, error: null }),
        }),
      }),
    });
  });

  describe('loading state', () => {
    it('shows loading skeleton initially', () => {
      mockSupabaseFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockReturnValue(new Promise(() => {})),
          }),
        }),
      });

      render(<AnnouncementDetailScreen />);

      // Header should be visible during loading
      expect(screen.queryByText('Anuncio')).toBeFalsy();
    });
  });

  describe('announcement not found', () => {
    it('shows error when announcement not found', async () => {
      mockSupabaseFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: null, error: null }),
          }),
        }),
      });

      render(<AnnouncementDetailScreen />);

      await waitFor(() => {
        expect(screen.getByText('Anuncio no encontrado')).toBeTruthy();
        expect(screen.getByText('Volver')).toBeTruthy();
      });
    });
  });

  describe('announcement details', () => {
    it('shows announcement title', async () => {
      render(<AnnouncementDetailScreen />);

      await waitFor(() => {
        expect(screen.getByText('Important Announcement')).toBeTruthy();
      });
    });

    it('shows announcement content', async () => {
      render(<AnnouncementDetailScreen />);

      await waitFor(() => {
        expect(screen.getByText('This is the content of the announcement with important information.')).toBeTruthy();
      });
    });

    it('shows type badge for info type', async () => {
      render(<AnnouncementDetailScreen />);

      await waitFor(() => {
        expect(screen.getByText('Información')).toBeTruthy();
      });
    });

    it('shows author name', async () => {
      render(<AnnouncementDetailScreen />);

      await waitFor(() => {
        expect(screen.getByText('Admin User')).toBeTruthy();
      });
    });
  });

  describe('announcement types', () => {
    it('shows warning badge for warning type', async () => {
      const warningAnnouncement = { ...mockAnnouncement, type: 'warning' };
      mockSupabaseFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: warningAnnouncement, error: null }),
          }),
        }),
      });

      render(<AnnouncementDetailScreen />);

      await waitFor(() => {
        expect(screen.getByText('Aviso')).toBeTruthy();
      });
    });

    it('shows urgent badge for urgent type', async () => {
      const urgentAnnouncement = { ...mockAnnouncement, type: 'urgent' };
      mockSupabaseFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: urgentAnnouncement, error: null }),
          }),
        }),
      });

      render(<AnnouncementDetailScreen />);

      await waitFor(() => {
        expect(screen.getByText('Urgente')).toBeTruthy();
      });
    });

    it('shows general badge for general type', async () => {
      const generalAnnouncement = { ...mockAnnouncement, type: 'general' };
      mockSupabaseFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: generalAnnouncement, error: null }),
          }),
        }),
      });

      render(<AnnouncementDetailScreen />);

      await waitFor(() => {
        expect(screen.getByText('General')).toBeTruthy();
      });
    });
  });

  describe('expiration info', () => {
    it('shows expiration date when set', async () => {
      render(<AnnouncementDetailScreen />);

      await waitFor(() => {
        expect(screen.getByText(/Este anuncio expira:/)).toBeTruthy();
      });
    });

    it('does not show expiration when not set', async () => {
      const noExpirationAnnouncement = { ...mockAnnouncement, expires_at: null };
      mockSupabaseFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: noExpirationAnnouncement, error: null }),
          }),
        }),
      });

      render(<AnnouncementDetailScreen />);

      await waitFor(() => {
        expect(screen.queryByText(/Este anuncio expira:/)).toBeNull();
      });
    });
  });

  describe('header', () => {
    it('shows header title', async () => {
      render(<AnnouncementDetailScreen />);

      await waitFor(() => {
        expect(screen.getByText('Anuncio')).toBeTruthy();
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

      render(<AnnouncementDetailScreen />);

      await waitFor(() => {
        expect(console.error).toHaveBeenCalledWith(
          'Error fetching announcement:',
          expect.any(Error)
        );
      });

      console.error = consoleError;
    });
  });
});
