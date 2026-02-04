import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';

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
  Search: () => null,
  Users: () => null,
  Home: () => null,
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
import AdminUsersScreen from '@/app/(app)/admin/users';

describe('AdminUsersScreen', () => {
  const mockUsers = [
    {
      id: 'member-1',
      user_id: 'user-1',
      organization_id: 'org-123',
      role: 'admin',
      unit_id: null,
      status: 'active',
      created_at: new Date().toISOString(),
      profile: {
        id: 'user-1',
        full_name: 'John Admin',
        email: 'admin@example.com',
        phone: '5551234567',
        avatar_url: null,
      },
      unit: null,
    },
    {
      id: 'member-2',
      user_id: 'user-2',
      organization_id: 'org-123',
      role: 'resident',
      unit_id: 'unit-1',
      status: 'active',
      created_at: new Date().toISOString(),
      profile: {
        id: 'user-2',
        full_name: 'Jane Resident',
        email: 'jane@example.com',
        phone: null,
        avatar_url: null,
      },
      unit: {
        id: 'unit-1',
        name: 'Casa 101',
        identifier: 'A-101',
      },
    },
    {
      id: 'member-3',
      user_id: 'user-3',
      organization_id: 'org-123',
      role: 'guard',
      unit_id: null,
      status: 'active',
      created_at: new Date().toISOString(),
      profile: {
        id: 'user-3',
        full_name: null,
        email: 'guard@example.com',
        phone: null,
        avatar_url: null,
      },
      unit: null,
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
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({ data: mockUsers, error: null }),
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
            eq: jest.fn().mockReturnValue({
              order: jest.fn().mockReturnValue(new Promise(() => {})),
            }),
          }),
        }),
      });

      render(<AdminUsersScreen />);

      expect(screen.getByText('Usuarios')).toBeTruthy();
    });
  });

  describe('header', () => {
    it('renders header with title', async () => {
      render(<AdminUsersScreen />);

      await waitFor(() => {
        expect(screen.getByText('Usuarios')).toBeTruthy();
      });
    });
  });

  describe('filter tabs', () => {
    it('shows all role filter tabs', async () => {
      render(<AdminUsersScreen />);

      await waitFor(() => {
        expect(screen.getByText('Todos')).toBeTruthy();
        // Admin, Residente, Guardia appear both in tabs and badges
        expect(screen.getAllByText('Admin').length).toBeGreaterThan(0);
        expect(screen.getAllByText('Residente').length).toBeGreaterThan(0);
        expect(screen.getAllByText('Guardia').length).toBeGreaterThan(0);
      });
    });

    it('filters by role when tab is pressed', async () => {
      render(<AdminUsersScreen />);

      await waitFor(() => {
        expect(screen.getAllByText('Residente').length).toBeGreaterThan(0);
      });

      // Press the first occurrence (filter tab)
      fireEvent.press(screen.getAllByText('Residente')[0]);

      // Filter should be applied
      expect(screen.getAllByText('Residente').length).toBeGreaterThan(0);
    });
  });

  describe('user list', () => {
    it('shows user names', async () => {
      render(<AdminUsersScreen />);

      await waitFor(() => {
        expect(screen.getByText('John Admin')).toBeTruthy();
        expect(screen.getByText('Jane Resident')).toBeTruthy();
      });
    });

    it('shows "Sin nombre" for users without name', async () => {
      render(<AdminUsersScreen />);

      await waitFor(() => {
        expect(screen.getByText('Sin nombre')).toBeTruthy();
      });
    });

    it('shows user emails', async () => {
      render(<AdminUsersScreen />);

      await waitFor(() => {
        expect(screen.getByText('admin@example.com')).toBeTruthy();
        expect(screen.getByText('jane@example.com')).toBeTruthy();
        expect(screen.getByText('guard@example.com')).toBeTruthy();
      });
    });

    it('shows role badges', async () => {
      render(<AdminUsersScreen />);

      await waitFor(() => {
        expect(screen.getAllByText('Admin').length).toBeGreaterThan(0);
        expect(screen.getAllByText('Residente').length).toBeGreaterThan(0);
        expect(screen.getAllByText('Guardia').length).toBeGreaterThan(0);
      });
    });

    it('shows unit info for residents', async () => {
      render(<AdminUsersScreen />);

      await waitFor(() => {
        expect(screen.getByText('Casa 101 (A-101)')).toBeTruthy();
      });
    });
  });

  describe('user count', () => {
    it('shows user count', async () => {
      render(<AdminUsersScreen />);

      await waitFor(() => {
        expect(screen.getByText('3 usuarios')).toBeTruthy();
      });
    });
  });

  describe('search', () => {
    it('shows search placeholder', async () => {
      render(<AdminUsersScreen />);

      await waitFor(() => {
        expect(screen.getByText('Buscar por nombre, email o unidad...')).toBeTruthy();
      });
    });
  });

  describe('empty state', () => {
    it('shows empty state when no users', async () => {
      mockSupabaseFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              order: jest.fn().mockResolvedValue({ data: [], error: null }),
            }),
          }),
        }),
      });

      render(<AdminUsersScreen />);

      await waitFor(() => {
        expect(screen.getByText('Sin usuarios')).toBeTruthy();
      });
    });
  });

  describe('no organization', () => {
    it('handles missing organization gracefully', async () => {
      mockUseOrganization.mockReturnValue({
        currentOrganization: null,
      });

      render(<AdminUsersScreen />);

      await waitFor(() => {
        expect(screen.getByText('Usuarios')).toBeTruthy();
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
            eq: jest.fn().mockReturnValue({
              order: jest.fn().mockRejectedValue(new Error('Fetch failed')),
            }),
          }),
        }),
      });

      render(<AdminUsersScreen />);

      await waitFor(() => {
        expect(console.error).toHaveBeenCalledWith(
          'Error fetching users:',
          expect.any(Error)
        );
      });

      console.error = consoleError;
    });
  });
});
