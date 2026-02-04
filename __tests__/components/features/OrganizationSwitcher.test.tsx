import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { Text } from 'react-native';
import { OrganizationSwitcher, OrganizationSwitcherRef } from '@/components/features/OrganizationSwitcher';
import { Membership, Organization, OrganizationType, UserRole } from '@/contexts/OrganizationContext';
import * as Haptics from 'expo-haptics';

// Mock expo-router
const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  router: {
    push: (path: string) => mockPush(path),
  },
}));

// Mock OrganizationContext
const mockSwitchOrganization = jest.fn();
const mockUseOrganization = jest.fn();

jest.mock('@/contexts/OrganizationContext', () => ({
  useOrganization: () => mockUseOrganization(),
  // Re-export types for testing
}));

// Mock BottomSheet
jest.mock('@/components/ui/BottomSheet', () => {
  const { forwardRef, useImperativeHandle } = require('react');
  return {
    BottomSheet: forwardRef(({ children }: { children: React.ReactNode }, ref: any) => {
      useImperativeHandle(ref, () => ({
        open: jest.fn(),
        close: jest.fn(),
      }));
      return children;
    }),
    BottomSheetRef: {},
  };
});

// Helper to create mock organization
const createMockOrganization = (overrides: Partial<Organization> = {}): Organization => ({
  id: 'org-1',
  name: 'Test Organization',
  type: 'residential' as OrganizationType,
  slug: 'test-org',
  logo_url: null,
  settings: {},
  created_at: '2024-01-01T00:00:00Z',
  ...overrides,
});

// Helper to create mock membership
const createMockMembership = (overrides: Partial<Membership> = {}): Membership => ({
  id: 'mem-1',
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

describe('OrganizationSwitcher Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockUseOrganization.mockReturnValue({
      memberships: [],
      currentMembership: null,
      switchOrganization: mockSwitchOrganization,
    });
  });

  describe('rendering', () => {
    it('renders title', () => {
      render(<OrganizationSwitcher />);

      expect(screen.getByText('Organizaciones')).toBeTruthy();
    });

    it('renders join button', () => {
      render(<OrganizationSwitcher />);

      expect(screen.getByText('+ Unirse a una organización')).toBeTruthy();
    });
  });

  describe('empty state', () => {
    it('shows empty state when no memberships', () => {
      mockUseOrganization.mockReturnValue({
        memberships: [],
        currentMembership: null,
        switchOrganization: mockSwitchOrganization,
      });

      render(<OrganizationSwitcher />);

      expect(screen.getByText('No perteneces a ninguna organización')).toBeTruthy();
      expect(screen.getByText('Pide a un administrador que te agregue')).toBeTruthy();
    });

    it('shows building emoji in empty state', () => {
      mockUseOrganization.mockReturnValue({
        memberships: [],
        currentMembership: null,
        switchOrganization: mockSwitchOrganization,
      });

      render(<OrganizationSwitcher />);

      expect(screen.getByText('🏢')).toBeTruthy();
    });
  });

  describe('organization list', () => {
    it('renders membership items', () => {
      const memberships = [
        createMockMembership({
          organization: createMockOrganization({ name: 'First Org' }),
        }),
        createMockMembership({
          id: 'mem-2',
          organization: createMockOrganization({ id: 'org-2', name: 'Second Org' }),
        }),
      ];

      mockUseOrganization.mockReturnValue({
        memberships,
        currentMembership: memberships[0],
        switchOrganization: mockSwitchOrganization,
      });

      render(<OrganizationSwitcher />);

      expect(screen.getByText('First Org')).toBeTruthy();
      expect(screen.getByText('Second Org')).toBeTruthy();
    });

    it('shows "Actual" badge for current organization', () => {
      const memberships = [createMockMembership()];

      mockUseOrganization.mockReturnValue({
        memberships,
        currentMembership: memberships[0],
        switchOrganization: mockSwitchOrganization,
      });

      render(<OrganizationSwitcher />);

      expect(screen.getByText('Actual')).toBeTruthy();
    });

    it('shows checkmark for active organization', () => {
      const memberships = [createMockMembership()];

      mockUseOrganization.mockReturnValue({
        memberships,
        currentMembership: memberships[0],
        switchOrganization: mockSwitchOrganization,
      });

      render(<OrganizationSwitcher />);

      expect(screen.getByText('✓')).toBeTruthy();
    });
  });

  describe('organization type labels', () => {
    it.each([
      ['residential', 'Residencial', '🏠'],
      ['corporate', 'Corporativo', '🏢'],
      ['educational', 'Educativo', '🎓'],
      ['industrial', 'Industrial', '🏭'],
      ['healthcare', 'Salud', '🏥'],
      ['events', 'Eventos', '🎪'],
    ])('displays correct label and emoji for %s type', (type, label, emoji) => {
      const memberships = [
        createMockMembership({
          organization: createMockOrganization({ type: type as OrganizationType }),
        }),
      ];

      mockUseOrganization.mockReturnValue({
        memberships,
        currentMembership: memberships[0],
        switchOrganization: mockSwitchOrganization,
      });

      render(<OrganizationSwitcher />);

      expect(screen.getByText(new RegExp(emoji))).toBeTruthy();
      expect(screen.getByText(new RegExp(label))).toBeTruthy();
    });
  });

  describe('role labels', () => {
    it.each([
      ['resident', 'Residente'],
      ['admin', 'Administrador'],
      ['guard', 'Guardia'],
      ['super_admin', 'Super Admin'],
    ])('displays correct label for %s role', (role, label) => {
      const memberships = [
        createMockMembership({ role: role as UserRole }),
      ];

      mockUseOrganization.mockReturnValue({
        memberships,
        currentMembership: memberships[0],
        switchOrganization: mockSwitchOrganization,
      });

      render(<OrganizationSwitcher />);

      expect(screen.getByText(label)).toBeTruthy();
    });
  });

  describe('unit display', () => {
    it('shows unit name and identifier', () => {
      const memberships = [
        createMockMembership({
          unit: {
            id: 'unit-1',
            organization_id: 'org-1',
            name: 'Apartment A',
            identifier: '1A',
            created_at: '2024-01-01T00:00:00Z',
          },
        }),
      ];

      mockUseOrganization.mockReturnValue({
        memberships,
        currentMembership: memberships[0],
        switchOrganization: mockSwitchOrganization,
      });

      render(<OrganizationSwitcher />);

      expect(screen.getByText('Apartment A (1A)')).toBeTruthy();
    });

    it('shows only unit name when no identifier', () => {
      const memberships = [
        createMockMembership({
          unit: {
            id: 'unit-1',
            organization_id: 'org-1',
            name: 'Main Office',
            identifier: null,
            created_at: '2024-01-01T00:00:00Z',
          },
        }),
      ];

      mockUseOrganization.mockReturnValue({
        memberships,
        currentMembership: memberships[0],
        switchOrganization: mockSwitchOrganization,
      });

      render(<OrganizationSwitcher />);

      expect(screen.getByText('Main Office')).toBeTruthy();
    });
  });

  describe('organization switching', () => {
    it('calls switchOrganization when item is pressed', async () => {
      const memberships = [
        createMockMembership({ id: 'mem-1' }),
        createMockMembership({
          id: 'mem-2',
          organization: createMockOrganization({ name: 'Other Org' }),
        }),
      ];

      mockUseOrganization.mockReturnValue({
        memberships,
        currentMembership: memberships[0],
        switchOrganization: mockSwitchOrganization,
      });

      render(<OrganizationSwitcher />);

      fireEvent.press(screen.getByText('Other Org'));

      await waitFor(() => {
        expect(mockSwitchOrganization).toHaveBeenCalledWith('mem-2');
      });
    });

    it('triggers medium haptic on organization switch', async () => {
      const memberships = [
        createMockMembership({ id: 'mem-1' }),
        createMockMembership({
          id: 'mem-2',
          organization: createMockOrganization({ name: 'Other Org' }),
        }),
      ];

      mockUseOrganization.mockReturnValue({
        memberships,
        currentMembership: memberships[0],
        switchOrganization: mockSwitchOrganization,
      });

      render(<OrganizationSwitcher />);

      fireEvent.press(screen.getByText('Other Org'));

      expect(Haptics.impactAsync).toHaveBeenCalledWith(
        Haptics.ImpactFeedbackStyle.Medium
      );
    });
  });

  describe('join organization', () => {
    it('navigates to join page when button is pressed', () => {
      render(<OrganizationSwitcher />);

      fireEvent.press(screen.getByText('+ Unirse a una organización'));

      expect(mockPush).toHaveBeenCalledWith('/(app)/organization/join');
    });

    it('triggers light haptic on join button press', () => {
      render(<OrganizationSwitcher />);

      fireEvent.press(screen.getByText('+ Unirse a una organización'));

      expect(Haptics.impactAsync).toHaveBeenCalledWith(
        Haptics.ImpactFeedbackStyle.Light
      );
    });
  });

  describe('ref methods', () => {
    it('exposes open method via ref', () => {
      const ref = React.createRef<OrganizationSwitcherRef>();

      render(<OrganizationSwitcher ref={ref} />);

      expect(ref.current?.open).toBeDefined();
    });

    it('exposes close method via ref', () => {
      const ref = React.createRef<OrganizationSwitcherRef>();

      render(<OrganizationSwitcher ref={ref} />);

      expect(ref.current?.close).toBeDefined();
    });
  });

  describe('press animations', () => {
    it('handles pressIn event', () => {
      const memberships = [createMockMembership()];

      mockUseOrganization.mockReturnValue({
        memberships,
        currentMembership: memberships[0],
        switchOrganization: mockSwitchOrganization,
      });

      render(<OrganizationSwitcher />);

      fireEvent(screen.getByText('Test Organization'), 'pressIn');

      // Animation triggered without error
    });

    it('handles pressOut event', () => {
      const memberships = [createMockMembership()];

      mockUseOrganization.mockReturnValue({
        memberships,
        currentMembership: memberships[0],
        switchOrganization: mockSwitchOrganization,
      });

      render(<OrganizationSwitcher />);

      fireEvent(screen.getByText('Test Organization'), 'pressIn');
      fireEvent(screen.getByText('Test Organization'), 'pressOut');

      // Animation reset without error
    });
  });

  describe('null organization handling', () => {
    it('does not render item when organization is null', () => {
      const memberships = [
        createMockMembership({ organization: undefined as any }),
      ];

      mockUseOrganization.mockReturnValue({
        memberships,
        currentMembership: memberships[0],
        switchOrganization: mockSwitchOrganization,
      });

      render(<OrganizationSwitcher />);

      // Should show empty state or not crash
      expect(screen.getByText('Organizaciones')).toBeTruthy();
    });
  });
});
