import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react-native';
import { Text } from 'react-native';
import {
  OrganizationProvider,
  useOrganization,
  Organization,
  Membership,
  UserRole,
} from '@/contexts/OrganizationContext';

// Mock AsyncStorage
const mockAsyncStorage: Record<string, string> = {};
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn((key: string) => Promise.resolve(mockAsyncStorage[key] || null)),
  setItem: jest.fn((key: string, value: string) => {
    mockAsyncStorage[key] = value;
    return Promise.resolve();
  }),
  removeItem: jest.fn((key: string) => {
    delete mockAsyncStorage[key];
    return Promise.resolve();
  }),
}));

// Mock supabase
const mockFrom = jest.fn();
const mockSelect = jest.fn();
const mockEq = jest.fn();
const mockOrder = jest.fn();
const mockChannel = jest.fn();
const mockOn = jest.fn();
const mockSubscribe = jest.fn();
const mockRemoveChannel = jest.fn();

jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: (table: string) => mockFrom(table),
    channel: (name: string) => mockChannel(name),
    removeChannel: (channel: any) => mockRemoveChannel(channel),
  },
}));

// Mock AuthContext
const mockUseAuth = jest.fn();
jest.mock('@/contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

// Create mock data
const createMockOrganization = (overrides = {}): Organization => ({
  id: 'org-1',
  name: 'Test Organization',
  type: 'residential',
  slug: 'test-org',
  logo_url: null,
  settings: {},
  created_at: '2024-01-01T00:00:00Z',
  ...overrides,
});

const createMockMembership = (overrides = {}): Membership => ({
  id: 'membership-1',
  user_id: 'user-123',
  organization_id: 'org-1',
  unit_id: 'unit-1',
  role: 'resident' as UserRole,
  role_id: 'role-1',
  is_active: true,
  joined_at: '2024-01-01T00:00:00Z',
  organization: createMockOrganization(),
  unit: {
    id: 'unit-1',
    organization_id: 'org-1',
    name: 'Unit 101',
    identifier: '101',
    created_at: '2024-01-01T00:00:00Z',
  },
  ...overrides,
});

// Test component to access organization context
function TestComponent() {
  const org = useOrganization();
  return (
    <>
      <Text testID="loading">{org.isLoading ? 'loading' : 'ready'}</Text>
      <Text testID="error">{org.error || 'none'}</Text>
      <Text testID="memberships-count">{org.memberships.length}</Text>
      <Text testID="current-org">{org.currentOrganization?.name || 'none'}</Text>
      <Text testID="current-role">{org.currentRole || 'none'}</Text>
      <Text testID="current-unit">{org.currentUnit?.name || 'none'}</Text>
      <Text testID="is-admin">{org.isAdmin ? 'yes' : 'no'}</Text>
      <Text testID="is-guard">{org.isGuard ? 'yes' : 'no'}</Text>
      <Text testID="is-resident">{org.isResident ? 'yes' : 'no'}</Text>
      <Text testID="is-super-admin">{org.isSuperAdmin ? 'yes' : 'no'}</Text>
      <Text testID="can-manage-users">{org.canManageUsers ? 'yes' : 'no'}</Text>
      <Text testID="can-scan-access">{org.canScanAccess ? 'yes' : 'no'}</Text>
      <Text testID="can-create-invitations">{org.canCreateInvitations ? 'yes' : 'no'}</Text>
    </>
  );
}

describe('OrganizationContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Object.keys(mockAsyncStorage).forEach(key => delete mockAsyncStorage[key]);

    // Default mock implementations
    mockUseAuth.mockReturnValue({
      user: { id: 'user-123' },
      isAuthenticated: true,
    });

    const mockChannelInstance = {
      on: mockOn.mockReturnThis(),
      subscribe: mockSubscribe.mockReturnValue({}),
    };
    mockChannel.mockReturnValue(mockChannelInstance);

    mockFrom.mockReturnValue({
      select: mockSelect.mockReturnValue({
        eq: mockEq.mockReturnValue({
          eq: mockEq.mockReturnValue({
            order: mockOrder.mockResolvedValue({ data: [], error: null }),
          }),
          order: mockOrder.mockResolvedValue({ data: [], error: null }),
        }),
      }),
    });
  });

  describe('OrganizationProvider', () => {
    it('renders children correctly', async () => {
      render(
        <OrganizationProvider>
          <Text testID="child">Child Content</Text>
        </OrganizationProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('child')).toBeTruthy();
      });
    });

    it('starts with loading state', () => {
      render(
        <OrganizationProvider>
          <TestComponent />
        </OrganizationProvider>
      );

      expect(screen.getByTestId('loading').props.children).toBe('loading');
    });

    it('sets isLoading to false after fetch', async () => {
      render(
        <OrganizationProvider>
          <TestComponent />
        </OrganizationProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading').props.children).toBe('ready');
      });
    });

    it('fetches memberships when authenticated', async () => {
      const mockMemberships = [createMockMembership()];
      mockOrder.mockResolvedValue({ data: mockMemberships, error: null });

      render(
        <OrganizationProvider>
          <TestComponent />
        </OrganizationProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('memberships-count').props.children).toBe(1);
      });

      expect(mockFrom).toHaveBeenCalledWith('memberships');
    });

    it('sets current membership to first one by default', async () => {
      const mockMemberships = [
        createMockMembership({ id: 'mem-1' }),
        createMockMembership({ id: 'mem-2', organization: createMockOrganization({ name: 'Second Org' }) }),
      ];
      mockOrder.mockResolvedValue({ data: mockMemberships, error: null });

      render(
        <OrganizationProvider>
          <TestComponent />
        </OrganizationProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('current-org').props.children).toBe('Test Organization');
      });
    });

    it('restores last active membership from storage', async () => {
      mockAsyncStorage['kaseta_active_membership'] = 'mem-2';

      const mockMemberships = [
        createMockMembership({ id: 'mem-1' }),
        createMockMembership({
          id: 'mem-2',
          organization: createMockOrganization({ name: 'Second Org' })
        }),
      ];
      mockOrder.mockResolvedValue({ data: mockMemberships, error: null });

      render(
        <OrganizationProvider>
          <TestComponent />
        </OrganizationProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('current-org').props.children).toBe('Second Org');
      });
    });

    it('clears memberships when user is not authenticated', async () => {
      mockUseAuth.mockReturnValue({
        user: null,
        isAuthenticated: false,
      });

      render(
        <OrganizationProvider>
          <TestComponent />
        </OrganizationProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading').props.children).toBe('ready');
      });

      expect(screen.getByTestId('memberships-count').props.children).toBe(0);
      expect(screen.getByTestId('current-org').props.children).toBe('none');
    });

    it('handles fetch error', async () => {
      mockOrder.mockResolvedValue({ data: null, error: new Error('Fetch failed') });

      render(
        <OrganizationProvider>
          <TestComponent />
        </OrganizationProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('error').props.children).toBe('Failed to load organizations');
      });
    });
  });

  describe('useOrganization hook', () => {
    it('throws error when used outside provider', () => {
      const consoleError = console.error;
      console.error = jest.fn();

      expect(() => {
        render(<TestComponent />);
      }).toThrow('useOrganization must be used within an OrganizationProvider');

      console.error = consoleError;
    });
  });

  describe('switchOrganization', () => {
    it('switches to different membership', async () => {
      const mockMemberships = [
        createMockMembership({ id: 'mem-1' }),
        createMockMembership({
          id: 'mem-2',
          organization: createMockOrganization({ name: 'Second Org' })
        }),
      ];
      mockOrder.mockResolvedValue({ data: mockMemberships, error: null });

      let orgMethods: any;
      function CaptureOrg() {
        orgMethods = useOrganization();
        return <TestComponent />;
      }

      render(
        <OrganizationProvider>
          <CaptureOrg />
        </OrganizationProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading').props.children).toBe('ready');
      });

      await act(async () => {
        await orgMethods.switchOrganization('mem-2');
      });

      expect(screen.getByTestId('current-org').props.children).toBe('Second Org');
    });

    it('saves switched membership to AsyncStorage', async () => {
      const AsyncStorage = require('@react-native-async-storage/async-storage');
      const mockMemberships = [
        createMockMembership({ id: 'mem-1' }),
        createMockMembership({ id: 'mem-2' }),
      ];
      mockOrder.mockResolvedValue({ data: mockMemberships, error: null });

      let orgMethods: any;
      function CaptureOrg() {
        orgMethods = useOrganization();
        return null;
      }

      render(
        <OrganizationProvider>
          <CaptureOrg />
        </OrganizationProvider>
      );

      await waitFor(() => {
        expect(orgMethods).toBeDefined();
      });

      await act(async () => {
        await orgMethods.switchOrganization('mem-2');
      });

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'kaseta_active_membership',
        'mem-2'
      );
    });
  });

  describe('getOrganizationById', () => {
    it('returns organization by ID', async () => {
      const mockOrg = createMockOrganization({ id: 'org-123', name: 'Found Org' });
      const mockMemberships = [
        createMockMembership({ organization_id: 'org-123', organization: mockOrg }),
      ];
      mockOrder.mockResolvedValue({ data: mockMemberships, error: null });

      let orgMethods: any;
      function CaptureOrg() {
        orgMethods = useOrganization();
        return null;
      }

      render(
        <OrganizationProvider>
          <CaptureOrg />
        </OrganizationProvider>
      );

      await waitFor(() => {
        expect(orgMethods.memberships.length).toBe(1);
      });

      const org = orgMethods.getOrganizationById('org-123');
      expect(org?.name).toBe('Found Org');
    });

    it('returns undefined for unknown ID', async () => {
      const mockMemberships = [createMockMembership()];
      mockOrder.mockResolvedValue({ data: mockMemberships, error: null });

      let orgMethods: any;
      function CaptureOrg() {
        orgMethods = useOrganization();
        return null;
      }

      render(
        <OrganizationProvider>
          <CaptureOrg />
        </OrganizationProvider>
      );

      await waitFor(() => {
        expect(orgMethods.memberships.length).toBe(1);
      });

      const org = orgMethods.getOrganizationById('unknown-id');
      expect(org).toBeUndefined();
    });
  });

  describe('Role checks', () => {
    it.each([
      ['resident', { isResident: true, isAdmin: false, isGuard: false, isSuperAdmin: false }],
      ['admin', { isResident: false, isAdmin: true, isGuard: false, isSuperAdmin: false }],
      ['guard', { isResident: false, isAdmin: false, isGuard: true, isSuperAdmin: false }],
      ['super_admin', { isResident: false, isAdmin: true, isGuard: false, isSuperAdmin: true }],
    ])('correctly identifies %s role', async (role, expected) => {
      const mockMemberships = [createMockMembership({ role: role as UserRole })];
      mockOrder.mockResolvedValue({ data: mockMemberships, error: null });

      render(
        <OrganizationProvider>
          <TestComponent />
        </OrganizationProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading').props.children).toBe('ready');
      });

      expect(screen.getByTestId('is-resident').props.children).toBe(expected.isResident ? 'yes' : 'no');
      expect(screen.getByTestId('is-admin').props.children).toBe(expected.isAdmin ? 'yes' : 'no');
      expect(screen.getByTestId('is-guard').props.children).toBe(expected.isGuard ? 'yes' : 'no');
      expect(screen.getByTestId('is-super-admin').props.children).toBe(expected.isSuperAdmin ? 'yes' : 'no');
    });
  });

  describe('Permission checks', () => {
    it('resident can create invitations but not manage users', async () => {
      const mockMemberships = [createMockMembership({ role: 'resident' })];
      mockOrder.mockResolvedValue({ data: mockMemberships, error: null });

      render(
        <OrganizationProvider>
          <TestComponent />
        </OrganizationProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading').props.children).toBe('ready');
      });

      expect(screen.getByTestId('can-create-invitations').props.children).toBe('yes');
      expect(screen.getByTestId('can-manage-users').props.children).toBe('no');
      expect(screen.getByTestId('can-scan-access').props.children).toBe('no');
    });

    it('guard can scan access but not create invitations', async () => {
      const mockMemberships = [createMockMembership({ role: 'guard' })];
      mockOrder.mockResolvedValue({ data: mockMemberships, error: null });

      render(
        <OrganizationProvider>
          <TestComponent />
        </OrganizationProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading').props.children).toBe('ready');
      });

      expect(screen.getByTestId('can-scan-access').props.children).toBe('yes');
      expect(screen.getByTestId('can-create-invitations').props.children).toBe('no');
      expect(screen.getByTestId('can-manage-users').props.children).toBe('no');
    });

    it('admin has all permissions', async () => {
      const mockMemberships = [createMockMembership({ role: 'admin' })];
      mockOrder.mockResolvedValue({ data: mockMemberships, error: null });

      render(
        <OrganizationProvider>
          <TestComponent />
        </OrganizationProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading').props.children).toBe('ready');
      });

      expect(screen.getByTestId('can-create-invitations').props.children).toBe('yes');
      expect(screen.getByTestId('can-manage-users').props.children).toBe('yes');
      expect(screen.getByTestId('can-scan-access').props.children).toBe('yes');
    });

    it('super_admin has all permissions', async () => {
      const mockMemberships = [createMockMembership({ role: 'super_admin' })];
      mockOrder.mockResolvedValue({ data: mockMemberships, error: null });

      render(
        <OrganizationProvider>
          <TestComponent />
        </OrganizationProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading').props.children).toBe('ready');
      });

      expect(screen.getByTestId('can-create-invitations').props.children).toBe('yes');
      expect(screen.getByTestId('can-manage-users').props.children).toBe('yes');
      expect(screen.getByTestId('can-scan-access').props.children).toBe('yes');
    });
  });

  describe('Realtime subscription', () => {
    it('sets up subscription on mount', async () => {
      render(
        <OrganizationProvider>
          <TestComponent />
        </OrganizationProvider>
      );

      await waitFor(() => {
        expect(mockChannel).toHaveBeenCalledWith('memberships_changes');
      });

      expect(mockOn).toHaveBeenCalledWith(
        'postgres_changes',
        expect.objectContaining({
          event: '*',
          schema: 'public',
          table: 'memberships',
        }),
        expect.any(Function)
      );
      expect(mockSubscribe).toHaveBeenCalled();
    });

    it('removes subscription on unmount', async () => {
      const { unmount } = render(
        <OrganizationProvider>
          <TestComponent />
        </OrganizationProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading').props.children).toBe('ready');
      });

      unmount();

      expect(mockRemoveChannel).toHaveBeenCalled();
    });
  });

  describe('Derived state', () => {
    it('extracts currentOrganization from membership', async () => {
      const mockOrg = createMockOrganization({ name: 'My Organization' });
      const mockMemberships = [createMockMembership({ organization: mockOrg })];
      mockOrder.mockResolvedValue({ data: mockMemberships, error: null });

      render(
        <OrganizationProvider>
          <TestComponent />
        </OrganizationProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('current-org').props.children).toBe('My Organization');
      });
    });

    it('extracts currentUnit from membership', async () => {
      const mockMemberships = [createMockMembership({
        unit: {
          id: 'unit-1',
          organization_id: 'org-1',
          name: 'Apartment 101',
          identifier: '101',
          created_at: '2024-01-01T00:00:00Z',
        },
      })];
      mockOrder.mockResolvedValue({ data: mockMemberships, error: null });

      render(
        <OrganizationProvider>
          <TestComponent />
        </OrganizationProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('current-unit').props.children).toBe('Apartment 101');
      });
    });

    it('extracts currentRole from membership', async () => {
      const mockMemberships = [createMockMembership({ role: 'admin' })];
      mockOrder.mockResolvedValue({ data: mockMemberships, error: null });

      render(
        <OrganizationProvider>
          <TestComponent />
        </OrganizationProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('current-role').props.children).toBe('admin');
      });
    });
  });
});
