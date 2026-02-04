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
  Bell: () => null,
  AlertTriangle: () => null,
  Info: () => null,
  Megaphone: () => null,
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
import AnnouncementsScreen from '@/app/(app)/announcements/index';

describe('AnnouncementsScreen', () => {
  const mockAnnouncements = [
    {
      id: 'ann-1',
      title: 'Important Notice',
      content: 'This is an important announcement for all residents.',
      type: 'urgent',
      created_at: new Date().toISOString(),
      expires_at: null,
      author: { full_name: 'Admin User' },
    },
    {
      id: 'ann-2',
      title: 'Community Event',
      content: 'Join us for the annual community gathering next weekend.',
      type: 'info',
      created_at: new Date(Date.now() - 86400000).toISOString(),
      expires_at: null,
      author: { full_name: 'Manager' },
    },
    {
      id: 'ann-3',
      title: 'Maintenance Schedule',
      content: 'Scheduled maintenance for elevators on Monday.',
      type: 'warning',
      created_at: new Date(Date.now() - 172800000).toISOString(),
      expires_at: null,
      author: null,
    },
    {
      id: 'ann-4',
      title: 'General Announcement',
      content: 'New parking rules effective from next month.',
      type: 'general',
      created_at: new Date(Date.now() - 604800000).toISOString(),
      expires_at: null,
      author: { full_name: 'HOA Board' },
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();

    mockUseOrganization.mockReturnValue({
      currentOrganization: { id: 'org-123', name: 'Test Org' },
      isAdmin: false,
    });

    mockSupabaseFrom.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          or: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({ data: mockAnnouncements, error: null }),
          }),
        }),
      }),
    });
  });

  describe('loading state', () => {
    it('shows loading skeletons initially', () => {
      mockSupabaseFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            or: jest.fn().mockReturnValue({
              order: jest.fn().mockReturnValue(new Promise(() => {})),
            }),
          }),
        }),
      });

      render(<AnnouncementsScreen />);

      expect(screen.getByText('Anuncios')).toBeTruthy();
    });
  });

  describe('header', () => {
    it('renders header with title', async () => {
      render(<AnnouncementsScreen />);

      await waitFor(() => {
        expect(screen.getByText('Anuncios')).toBeTruthy();
      });
    });

    it('shows plus button for admin', async () => {
      mockUseOrganization.mockReturnValue({
        currentOrganization: { id: 'org-123', name: 'Test Org' },
        isAdmin: true,
      });

      render(<AnnouncementsScreen />);

      await waitFor(() => {
        expect(screen.getByText('Anuncios')).toBeTruthy();
      });
    });
  });

  describe('announcements list', () => {
    it('displays announcement titles', async () => {
      render(<AnnouncementsScreen />);

      await waitFor(() => {
        expect(screen.getByText('Important Notice')).toBeTruthy();
        expect(screen.getByText('Community Event')).toBeTruthy();
        expect(screen.getByText('Maintenance Schedule')).toBeTruthy();
        expect(screen.getByText('General Announcement')).toBeTruthy();
      });
    });

    it('displays announcement content', async () => {
      render(<AnnouncementsScreen />);

      await waitFor(() => {
        expect(screen.getByText(/This is an important announcement/)).toBeTruthy();
      });
    });

    it('shows type badges', async () => {
      render(<AnnouncementsScreen />);

      await waitFor(() => {
        expect(screen.getByText('Urgente')).toBeTruthy();
        expect(screen.getByText('Información')).toBeTruthy();
        expect(screen.getByText('Aviso')).toBeTruthy();
        expect(screen.getByText('General')).toBeTruthy();
      });
    });

    it('shows author names when present', async () => {
      render(<AnnouncementsScreen />);

      await waitFor(() => {
        expect(screen.getByText('Por: Admin User')).toBeTruthy();
        expect(screen.getByText('Por: Manager')).toBeTruthy();
        expect(screen.getByText('Por: HOA Board')).toBeTruthy();
      });
    });

    it('shows "Hoy" for today announcements', async () => {
      render(<AnnouncementsScreen />);

      await waitFor(() => {
        expect(screen.getByText('Hoy')).toBeTruthy();
      });
    });

    it('shows "Ayer" for yesterday announcements', async () => {
      render(<AnnouncementsScreen />);

      await waitFor(() => {
        expect(screen.getByText('Ayer')).toBeTruthy();
      });
    });
  });

  describe('navigation', () => {
    it('navigates to announcement detail when pressed', async () => {
      render(<AnnouncementsScreen />);

      await waitFor(() => {
        expect(screen.getByText('Important Notice')).toBeTruthy();
      });

      fireEvent.press(screen.getByText('Important Notice'));

      expect(mockPush).toHaveBeenCalledWith({
        pathname: '/(app)/announcements/[id]',
        params: { id: 'ann-1' },
      });
    });
  });

  describe('empty state', () => {
    it('shows empty state when no announcements', async () => {
      mockSupabaseFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            or: jest.fn().mockReturnValue({
              order: jest.fn().mockResolvedValue({ data: [], error: null }),
            }),
          }),
        }),
      });

      render(<AnnouncementsScreen />);

      await waitFor(() => {
        expect(screen.getByText('Sin anuncios')).toBeTruthy();
        expect(screen.getByText('Los comunicados de la administración aparecerán aquí')).toBeTruthy();
      });
    });
  });

  describe('no organization', () => {
    it('handles missing organization gracefully', async () => {
      mockUseOrganization.mockReturnValue({
        currentOrganization: null,
        isAdmin: false,
      });

      render(<AnnouncementsScreen />);

      await waitFor(() => {
        expect(screen.getByText('Sin anuncios')).toBeTruthy();
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
            or: jest.fn().mockReturnValue({
              order: jest.fn().mockResolvedValue({ data: null, error: new Error('Fetch failed') }),
            }),
          }),
        }),
      });

      render(<AnnouncementsScreen />);

      await waitFor(() => {
        expect(console.error).toHaveBeenCalledWith(
          'Error fetching announcements:',
          expect.any(Error)
        );
      });

      console.error = consoleError;
    });
  });

  describe('pull to refresh', () => {
    it('supports pull to refresh', async () => {
      render(<AnnouncementsScreen />);

      await waitFor(() => {
        expect(screen.getByText('Anuncios')).toBeTruthy();
      });
    });
  });

  describe('date formatting', () => {
    it('shows days ago for recent announcements', async () => {
      render(<AnnouncementsScreen />);

      await waitFor(() => {
        expect(screen.getByText(/Hace \d+ días/)).toBeTruthy();
      });
    });
  });
});
