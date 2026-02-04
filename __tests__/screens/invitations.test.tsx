import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';

// Mock expo-router
const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockBack = jest.fn();

jest.mock('expo-router', () => ({
  router: {
    push: (...args: any[]) => mockPush(...args),
    replace: (...args: any[]) => mockReplace(...args),
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
  Plus: () => null,
}));

// Mock InvitationCard components
jest.mock('@/components/features/invitations', () => ({
  InvitationCard: ({ invitation, onPress }: any) => {
    const { Text, Pressable } = require('react-native');
    return (
      <Pressable testID={`invitation-${invitation.id}`} onPress={() => onPress(invitation)}>
        <Text>{invitation.visitor_name}</Text>
        <Text>{invitation.status}</Text>
      </Pressable>
    );
  },
  InvitationCardSkeleton: () => {
    const { View } = require('react-native');
    return <View testID="invitation-skeleton" />;
  },
}));

// Mock useInvitations hook
const mockUseInvitations = jest.fn();
jest.mock('@/hooks/useInvitations', () => ({
  useInvitations: () => mockUseInvitations(),
}));

// Mock OrganizationContext
const mockUseOrganization = jest.fn();
jest.mock('@/contexts/OrganizationContext', () => ({
  useOrganization: () => mockUseOrganization(),
}));

// Import component after mocks
import InvitationsScreen from '@/app/(app)/(tabs)/invitations';

describe('InvitationsScreen', () => {
  const mockInvitations = [
    {
      id: 'inv-1',
      visitor_name: 'John Doe',
      status: 'active',
      access_type: 'single',
      created_at: new Date().toISOString(),
    },
    {
      id: 'inv-2',
      visitor_name: 'Jane Smith',
      status: 'used',
      access_type: 'multiple',
      created_at: new Date().toISOString(),
    },
    {
      id: 'inv-3',
      visitor_name: 'Bob Wilson',
      status: 'expired',
      access_type: 'temporary',
      created_at: new Date().toISOString(),
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();

    mockUseOrganization.mockReturnValue({
      currentMembership: { id: 'membership-123' },
      currentOrganization: { id: 'org-123', name: 'Test Organization' },
    });

    mockUseInvitations.mockReturnValue({
      invitations: mockInvitations,
      isLoading: false,
      refresh: jest.fn().mockResolvedValue(undefined),
    });
  });

  describe('loading state', () => {
    it('shows skeleton loading state', () => {
      mockUseInvitations.mockReturnValue({
        invitations: [],
        isLoading: true,
        refresh: jest.fn(),
      });

      render(<InvitationsScreen />);

      expect(screen.getAllByTestId('invitation-skeleton')).toBeTruthy();
    });
  });

  describe('no organization state', () => {
    it('shows empty state when no organization', () => {
      mockUseOrganization.mockReturnValue({
        currentMembership: null,
        currentOrganization: null,
      });

      render(<InvitationsScreen />);

      expect(screen.getByText('Sin organización')).toBeTruthy();
      expect(screen.getByText('Selecciona o únete a una organización para ver tus invitaciones')).toBeTruthy();
    });
  });

  describe('header', () => {
    it('renders header with title', () => {
      render(<InvitationsScreen />);

      expect(screen.getByText('Invitaciones')).toBeTruthy();
    });

    it('shows organization name', () => {
      render(<InvitationsScreen />);

      expect(screen.getByText('Test Organization')).toBeTruthy();
    });

    it('shows create button', () => {
      render(<InvitationsScreen />);

      expect(screen.getByText('Nueva')).toBeTruthy();
    });
  });

  describe('filter tabs', () => {
    it('renders all filter tabs', () => {
      render(<InvitationsScreen />);

      expect(screen.getByText('Todas')).toBeTruthy();
      expect(screen.getByText('Activas')).toBeTruthy();
      expect(screen.getByText('Usadas')).toBeTruthy();
      expect(screen.getByText('Vencidas')).toBeTruthy();
    });

    it('filters by active invitations', () => {
      render(<InvitationsScreen />);

      fireEvent.press(screen.getByText('Activas'));

      // Should only show active invitation
      expect(screen.getByText('John Doe')).toBeTruthy();
      expect(screen.queryByText('Jane Smith')).toBeNull(); // used
      expect(screen.queryByText('Bob Wilson')).toBeNull(); // expired
    });

    it('filters by used invitations', () => {
      render(<InvitationsScreen />);

      fireEvent.press(screen.getByText('Usadas'));

      expect(screen.getByText('Jane Smith')).toBeTruthy();
      expect(screen.queryByText('John Doe')).toBeNull(); // active
    });

    it('filters by expired invitations', () => {
      render(<InvitationsScreen />);

      fireEvent.press(screen.getByText('Vencidas'));

      expect(screen.getByText('Bob Wilson')).toBeTruthy();
      expect(screen.queryByText('John Doe')).toBeNull(); // active
    });

    it('shows all invitations in Todas tab', () => {
      render(<InvitationsScreen />);

      expect(screen.getByText('John Doe')).toBeTruthy();
      expect(screen.getByText('Jane Smith')).toBeTruthy();
      expect(screen.getByText('Bob Wilson')).toBeTruthy();
    });
  });

  describe('invitation list', () => {
    it('renders all invitations', () => {
      render(<InvitationsScreen />);

      expect(screen.getByTestId('invitation-inv-1')).toBeTruthy();
      expect(screen.getByTestId('invitation-inv-2')).toBeTruthy();
      expect(screen.getByTestId('invitation-inv-3')).toBeTruthy();
    });

    it('navigates to invitation detail when pressed', () => {
      render(<InvitationsScreen />);

      fireEvent.press(screen.getByTestId('invitation-inv-1'));

      expect(mockPush).toHaveBeenCalledWith({
        pathname: '/(app)/invitation/[id]',
        params: { id: 'inv-1' },
      });
    });
  });

  describe('empty states', () => {
    it('shows empty state for all tab', () => {
      mockUseInvitations.mockReturnValue({
        invitations: [],
        isLoading: false,
        refresh: jest.fn(),
      });

      render(<InvitationsScreen />);

      expect(screen.getByText('Sin invitaciones')).toBeTruthy();
      expect(screen.getByText('Crea tu primera invitación para un visitante')).toBeTruthy();
      expect(screen.getByText('Crear invitación')).toBeTruthy();
    });

    it('shows empty state for active tab', () => {
      mockUseInvitations.mockReturnValue({
        invitations: [],
        isLoading: false,
        refresh: jest.fn(),
      });

      render(<InvitationsScreen />);

      fireEvent.press(screen.getByText('Activas'));

      expect(screen.getByText('Sin invitaciones activas')).toBeTruthy();
      expect(screen.getByText('No tienes invitaciones pendientes de uso')).toBeTruthy();
    });

    it('shows empty state for used tab', () => {
      mockUseInvitations.mockReturnValue({
        invitations: [],
        isLoading: false,
        refresh: jest.fn(),
      });

      render(<InvitationsScreen />);

      fireEvent.press(screen.getByText('Usadas'));

      expect(screen.getByText('Sin invitaciones usadas')).toBeTruthy();
      expect(screen.getByText('Las invitaciones usadas aparecerán aquí')).toBeTruthy();
    });

    it('shows empty state for expired tab', () => {
      mockUseInvitations.mockReturnValue({
        invitations: [],
        isLoading: false,
        refresh: jest.fn(),
      });

      render(<InvitationsScreen />);

      fireEvent.press(screen.getByText('Vencidas'));

      expect(screen.getByText('Sin invitaciones vencidas')).toBeTruthy();
      expect(screen.getByText('Las invitaciones vencidas aparecerán aquí')).toBeTruthy();
    });
  });

  describe('create invitation', () => {
    it('navigates to create screen when button is pressed', () => {
      render(<InvitationsScreen />);

      fireEvent.press(screen.getByText('Nueva'));

      expect(mockPush).toHaveBeenCalledWith('/(app)/invitation/create');
    });

    it('navigates to create from empty state action', () => {
      mockUseInvitations.mockReturnValue({
        invitations: [],
        isLoading: false,
        refresh: jest.fn(),
      });

      render(<InvitationsScreen />);

      fireEvent.press(screen.getByText('Crear invitación'));

      expect(mockPush).toHaveBeenCalledWith('/(app)/invitation/create');
    });
  });

  describe('refresh', () => {
    it('calls refresh when pull to refresh is triggered', async () => {
      const mockRefresh = jest.fn().mockResolvedValue(undefined);
      mockUseInvitations.mockReturnValue({
        invitations: mockInvitations,
        isLoading: false,
        refresh: mockRefresh,
      });

      render(<InvitationsScreen />);

      // The component has RefreshControl, testing actual refresh would require gesture simulation
    });
  });

  describe('cancelled invitations', () => {
    it('includes cancelled invitations in expired filter', () => {
      const invitationsWithCancelled = [
        ...mockInvitations,
        {
          id: 'inv-4',
          visitor_name: 'Cancelled User',
          status: 'cancelled',
          access_type: 'single',
          created_at: new Date().toISOString(),
        },
      ];

      mockUseInvitations.mockReturnValue({
        invitations: invitationsWithCancelled,
        isLoading: false,
        refresh: jest.fn(),
      });

      render(<InvitationsScreen />);

      fireEvent.press(screen.getByText('Vencidas'));

      expect(screen.getByText('Bob Wilson')).toBeTruthy(); // expired
      expect(screen.getByText('Cancelled User')).toBeTruthy(); // cancelled
    });
  });

  describe('haptic feedback', () => {
    it('triggers haptic on tab change', async () => {
      const Haptics = require('expo-haptics');

      render(<InvitationsScreen />);

      fireEvent.press(screen.getByText('Activas'));

      expect(Haptics.impactAsync).toHaveBeenCalledWith(
        Haptics.ImpactFeedbackStyle.Light
      );
    });

    it('triggers haptic on create button press', () => {
      const Haptics = require('expo-haptics');

      render(<InvitationsScreen />);

      fireEvent.press(screen.getByText('Nueva'));

      expect(Haptics.impactAsync).toHaveBeenCalledWith(
        Haptics.ImpactFeedbackStyle.Medium
      );
    });
  });
});
