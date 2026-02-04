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
}));

// Mock safe area context
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: { children: React.ReactNode }) => children,
  useSafeAreaInsets: () => ({ top: 44, bottom: 34, left: 0, right: 0 }),
}));

// Mock lucide-react-native
jest.mock('lucide-react-native', () => ({
  ChevronLeft: () => null,
  Search: () => null,
  Calendar: () => null,
  User: () => null,
}));

// Mock expo-haptics
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'light' },
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
import AdminInvitationsScreen from '@/app/(app)/admin/invitations';

describe('AdminInvitationsScreen', () => {
  const mockInvitations = [
    {
      id: 'inv-1',
      visitor_name: 'Juan Garcia',
      status: 'active',
      short_code: 'ABC123',
      valid_from: new Date().toISOString(),
      valid_until: new Date(Date.now() + 86400000).toISOString(),
      access_type: 'single',
      current_uses: 0,
      max_uses: 1,
      unit: { id: 'u-1', name: 'Depto 101', identifier: '101' },
      creator: { id: 'c-1', full_name: 'Maria Lopez' },
    },
    {
      id: 'inv-2',
      visitor_name: 'Pedro Martinez',
      status: 'used',
      short_code: 'XYZ789',
      valid_from: new Date().toISOString(),
      valid_until: null,
      access_type: 'multiple',
      current_uses: 3,
      max_uses: 5,
      unit: { id: 'u-2', name: 'Depto 202', identifier: '202' },
      creator: { id: 'c-2', full_name: 'Carlos Ruiz' },
    },
    {
      id: 'inv-3',
      visitor_name: 'Ana Torres',
      status: 'expired',
      short_code: 'DEF456',
      valid_from: new Date(Date.now() - 172800000).toISOString(),
      valid_until: new Date(Date.now() - 86400000).toISOString(),
      access_type: 'single',
      current_uses: 0,
      max_uses: 1,
      unit: null,
      creator: null,
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();

    mockUseOrganization.mockReturnValue({
      currentOrganization: { id: 'org-123', name: 'Test Community' },
    });

    mockSupabaseFrom.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({ data: mockInvitations, error: null }),
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

      render(<AdminInvitationsScreen />);

      expect(screen.getByText('Invitaciones')).toBeTruthy();
    });
  });

  describe('header', () => {
    it('renders header with title', async () => {
      render(<AdminInvitationsScreen />);

      await waitFor(() => {
        expect(screen.getByText('Invitaciones')).toBeTruthy();
      });
    });
  });

  describe('search', () => {
    it('shows search input', async () => {
      render(<AdminInvitationsScreen />);

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Buscar por visitante, unidad o código...')).toBeTruthy();
      });
    });

    it('filters by search query', async () => {
      render(<AdminInvitationsScreen />);

      await waitFor(() => {
        expect(screen.getByText('Juan Garcia')).toBeTruthy();
      });

      fireEvent.changeText(
        screen.getByPlaceholderText('Buscar por visitante, unidad o código...'),
        'Pedro'
      );

      await waitFor(() => {
        expect(screen.queryByText('Juan Garcia')).toBeNull();
        expect(screen.getByText('Pedro Martinez')).toBeTruthy();
      });
    });
  });

  describe('filter tabs', () => {
    it('shows all filter tabs', async () => {
      render(<AdminInvitationsScreen />);

      await waitFor(() => {
        expect(screen.getByText('Todas')).toBeTruthy();
        // Filter tabs and badges both show these statuses
        expect(screen.getAllByText('Activa').length).toBeGreaterThan(0);
        expect(screen.getAllByText('Usada').length).toBeGreaterThan(0);
        expect(screen.getAllByText('Expirada').length).toBeGreaterThan(0);
      });
    });

    it('filters by status', async () => {
      render(<AdminInvitationsScreen />);

      await waitFor(() => {
        expect(screen.getByText('Juan Garcia')).toBeTruthy();
      });

      // There are multiple "Usada" elements - get all and press the first one (filter tab)
      const usadaElements = screen.getAllByText('Usada');
      fireEvent.press(usadaElements[0]);

      await waitFor(() => {
        expect(screen.queryByText('Juan Garcia')).toBeNull();
        expect(screen.getByText('Pedro Martinez')).toBeTruthy();
      });
    });
  });

  describe('invitations list', () => {
    it('shows visitor names', async () => {
      render(<AdminInvitationsScreen />);

      await waitFor(() => {
        expect(screen.getByText('Juan Garcia')).toBeTruthy();
        expect(screen.getByText('Pedro Martinez')).toBeTruthy();
        expect(screen.getByText('Ana Torres')).toBeTruthy();
      });
    });

    it('shows short codes', async () => {
      render(<AdminInvitationsScreen />);

      await waitFor(() => {
        expect(screen.getByText('ABC123')).toBeTruthy();
        expect(screen.getByText('XYZ789')).toBeTruthy();
      });
    });

    it('shows status badges', async () => {
      render(<AdminInvitationsScreen />);

      await waitFor(() => {
        expect(screen.getAllByText('Activa').length).toBeGreaterThan(0);
        expect(screen.getAllByText('Usada').length).toBeGreaterThan(0);
        expect(screen.getAllByText('Expirada').length).toBeGreaterThan(0);
      });
    });

    it('shows unit info', async () => {
      render(<AdminInvitationsScreen />);

      await waitFor(() => {
        expect(screen.getByText('Depto 101')).toBeTruthy();
        expect(screen.getByText('Depto 202')).toBeTruthy();
      });
    });

    it('shows creator info', async () => {
      render(<AdminInvitationsScreen />);

      await waitFor(() => {
        expect(screen.getByText('Creada por Maria Lopez')).toBeTruthy();
        expect(screen.getByText('Creada por Carlos Ruiz')).toBeTruthy();
      });
    });

    it('shows usage count for multiple access', async () => {
      render(<AdminInvitationsScreen />);

      await waitFor(() => {
        expect(screen.getByText('3 / 5 usos')).toBeTruthy();
      });
    });

    it('shows invitation count', async () => {
      render(<AdminInvitationsScreen />);

      await waitFor(() => {
        // Count is rendered with plural/singular logic (with accent: invitación/invitaciones)
        expect(screen.getAllByText(/invitaci/).length).toBeGreaterThan(0);
      });
    });
  });

  describe('empty state', () => {
    it('shows empty state when no invitations', async () => {
      mockSupabaseFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({ data: [], error: null }),
          }),
        }),
      });

      render(<AdminInvitationsScreen />);

      await waitFor(() => {
        expect(screen.getByText('Sin invitaciones')).toBeTruthy();
        expect(screen.getByText('No hay invitaciones que coincidan con tu búsqueda')).toBeTruthy();
      });
    });
  });

  describe('invitation press', () => {
    it('navigates to invitation detail on press', async () => {
      render(<AdminInvitationsScreen />);

      await waitFor(() => {
        expect(screen.getByText('Juan Garcia')).toBeTruthy();
      });

      fireEvent.press(screen.getByText('Juan Garcia'));

      expect(mockPush).toHaveBeenCalledWith({
        pathname: '/(app)/invitation/[id]',
        params: { id: 'inv-1' },
      });
    });
  });

  describe('no organization', () => {
    it('handles missing organization gracefully', async () => {
      mockUseOrganization.mockReturnValue({
        currentOrganization: null,
      });

      render(<AdminInvitationsScreen />);

      await waitFor(() => {
        expect(screen.getByText('Invitaciones')).toBeTruthy();
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
            order: jest.fn().mockRejectedValue(new Error('Fetch failed')),
          }),
        }),
      });

      render(<AdminInvitationsScreen />);

      await waitFor(() => {
        expect(console.error).toHaveBeenCalledWith(
          'Error fetching invitations:',
          expect.any(Error)
        );
      });

      console.error = consoleError;
    });
  });
});
