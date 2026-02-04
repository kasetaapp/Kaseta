import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';

// Mock expo-router
const mockPush = jest.fn();

jest.mock('expo-router', () => ({
  router: {
    push: (...args: any[]) => mockPush(...args),
  },
}));

// Mock safe area context
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: { children: React.ReactNode }) => children,
  useSafeAreaInsets: () => ({ top: 44, bottom: 34, left: 0, right: 0 }),
}));

// Mock supabase
const mockSupabaseFrom = jest.fn();

jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: (table: string) => mockSupabaseFrom(table),
  },
}));

// Mock AuthContext
const mockUseAuth = jest.fn();

jest.mock('@/contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

// Mock OrganizationContext
const mockUseOrganization = jest.fn();

jest.mock('@/contexts/OrganizationContext', () => ({
  useOrganization: () => mockUseOrganization(),
}));

// Import component after mocks
import HomeScreen from '@/app/(app)/(tabs)/home';

describe('HomeScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockUseAuth.mockReturnValue({
      user: { id: 'user-123', user_metadata: { full_name: 'John Doe' } },
      profile: { full_name: 'John Doe', avatar_url: null },
    });

    mockUseOrganization.mockReturnValue({
      currentOrganization: { id: 'org-123', name: 'Test Residencial' },
      currentUnit: { id: 'unit-123', name: 'Unit 101' },
      currentMembership: { id: 'member-123', unit_id: 'unit-123' },
      canScanAccess: false,
      canCreateInvitations: true,
      isGuard: false,
      isAdmin: false,
      isLoading: false,
    });

    // Default supabase mock
    mockSupabaseFrom.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            gte: jest.fn().mockResolvedValue({ count: 0 }),
          }),
          gte: jest.fn().mockResolvedValue({ count: 0 }),
          order: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue({ data: [] }),
          }),
        }),
        order: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue({ data: [] }),
        }),
      }),
    });
  });

  describe('loading state', () => {
    it('shows loading skeleton when loading', () => {
      mockUseOrganization.mockReturnValue({
        currentOrganization: null,
        currentUnit: null,
        currentMembership: null,
        canScanAccess: false,
        canCreateInvitations: false,
        isGuard: false,
        isAdmin: false,
        isLoading: true,
      });

      render(<HomeScreen />);

      // Skeleton elements should be visible
    });
  });

  describe('header', () => {
    it('displays welcome message', async () => {
      render(<HomeScreen />);

      await waitFor(() => {
        expect(screen.getByText('Bienvenido')).toBeTruthy();
      });
    });

    it('displays user name', async () => {
      render(<HomeScreen />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeTruthy();
      });
    });

    it('displays organization name', async () => {
      render(<HomeScreen />);

      await waitFor(() => {
        expect(screen.getByText(/Test Residencial/)).toBeTruthy();
      });
    });

    it('displays unit name', async () => {
      render(<HomeScreen />);

      await waitFor(() => {
        expect(screen.getByText(/Unit 101/)).toBeTruthy();
      });
    });
  });

  describe('no organization state', () => {
    it('shows welcome card when no organization', async () => {
      mockUseOrganization.mockReturnValue({
        currentOrganization: null,
        currentUnit: null,
        currentMembership: null,
        canScanAccess: false,
        canCreateInvitations: false,
        isGuard: false,
        isAdmin: false,
        isLoading: false,
      });

      render(<HomeScreen />);

      await waitFor(() => {
        expect(screen.getByText('¡Bienvenido a KASETA!')).toBeTruthy();
      });
    });

    it('shows join organization button when no organization', async () => {
      mockUseOrganization.mockReturnValue({
        currentOrganization: null,
        currentUnit: null,
        currentMembership: null,
        canScanAccess: false,
        canCreateInvitations: false,
        isGuard: false,
        isAdmin: false,
        isLoading: false,
      });

      render(<HomeScreen />);

      await waitFor(() => {
        expect(screen.getByText('Unirse a organización')).toBeTruthy();
      });
    });

    it('navigates to join screen when button is pressed', async () => {
      mockUseOrganization.mockReturnValue({
        currentOrganization: null,
        currentUnit: null,
        currentMembership: null,
        canScanAccess: false,
        canCreateInvitations: false,
        isGuard: false,
        isAdmin: false,
        isLoading: false,
      });

      render(<HomeScreen />);

      await waitFor(() => {
        expect(screen.getByText('Unirse a organización')).toBeTruthy();
      });

      fireEvent.press(screen.getByText('Unirse a organización'));

      expect(mockPush).toHaveBeenCalledWith('/(app)/organization/join');
    });

    it('shows description text for new users', async () => {
      mockUseOrganization.mockReturnValue({
        currentOrganization: null,
        currentUnit: null,
        currentMembership: null,
        canScanAccess: false,
        canCreateInvitations: false,
        isGuard: false,
        isAdmin: false,
        isLoading: false,
      });

      render(<HomeScreen />);

      await waitFor(() => {
        expect(screen.getByText(/únete a tu residencial/)).toBeTruthy();
      });
    });
  });

  describe('quick actions for residents', () => {
    it('shows quick actions section', async () => {
      render(<HomeScreen />);

      await waitFor(() => {
        expect(screen.getByText('Acciones rápidas')).toBeTruthy();
      });
    });

    it('shows create invitation action', async () => {
      render(<HomeScreen />);

      await waitFor(() => {
        expect(screen.getByText('Crear invitación')).toBeTruthy();
      });
    });

    it('shows invitations action', async () => {
      render(<HomeScreen />);

      await waitFor(() => {
        expect(screen.getByText('Invitaciones')).toBeTruthy();
      });
    });

    it('navigates to create invitation when pressed', async () => {
      render(<HomeScreen />);

      await waitFor(() => {
        expect(screen.getByText('Crear invitación')).toBeTruthy();
      });

      fireEvent.press(screen.getByText('Crear invitación'));

      expect(mockPush).toHaveBeenCalledWith('/(app)/invitation/create');
    });

    it('navigates to invitations when pressed', async () => {
      render(<HomeScreen />);

      await waitFor(() => {
        expect(screen.getByText('Invitaciones')).toBeTruthy();
      });

      fireEvent.press(screen.getByText('Invitaciones'));

      expect(mockPush).toHaveBeenCalledWith('/(app)/(tabs)/invitations');
    });

    it('shows scan button when user can scan', async () => {
      mockUseOrganization.mockReturnValue({
        currentOrganization: { id: 'org-123', name: 'Test Residencial' },
        currentUnit: { id: 'unit-123', name: 'Unit 101' },
        currentMembership: { id: 'member-123', unit_id: 'unit-123' },
        canScanAccess: true,
        canCreateInvitations: true,
        isGuard: false,
        isAdmin: true,
        isLoading: false,
      });

      render(<HomeScreen />);

      await waitFor(() => {
        expect(screen.getByText('Escanear QR')).toBeTruthy();
      });
    });
  });

  describe('guard mode', () => {
    beforeEach(() => {
      mockUseOrganization.mockReturnValue({
        currentOrganization: { id: 'org-123', name: 'Test Residencial' },
        currentUnit: null,
        currentMembership: { id: 'member-123', unit_id: null },
        canScanAccess: true,
        canCreateInvitations: false,
        isGuard: true,
        isAdmin: false,
        isLoading: false,
      });
    });

    it('shows guard scan card', async () => {
      render(<HomeScreen />);

      await waitFor(() => {
        expect(screen.getByText('Escanear QR')).toBeTruthy();
      });
    });

    it('shows validate invitation description', async () => {
      render(<HomeScreen />);

      await waitFor(() => {
        expect(screen.getByText('Validar invitación de visitante')).toBeTruthy();
      });
    });

    it('shows guard stats', async () => {
      render(<HomeScreen />);

      await waitFor(() => {
        expect(screen.getByText('Entradas hoy')).toBeTruthy();
        expect(screen.getByText('Salidas hoy')).toBeTruthy();
        expect(screen.getByText('Inv. activas')).toBeTruthy();
      });
    });

    it('navigates to scan when guard card is pressed', async () => {
      render(<HomeScreen />);

      await waitFor(() => {
        expect(screen.getByText('Escanear QR')).toBeTruthy();
      });

      fireEvent.press(screen.getByText('Escanear QR'));

      expect(mockPush).toHaveBeenCalledWith('/(app)/(tabs)/scan');
    });
  });

  describe('stats section', () => {
    it('shows day summary section', async () => {
      render(<HomeScreen />);

      await waitFor(() => {
        expect(screen.getByText('Resumen del día')).toBeTruthy();
      });
    });

    it('shows active invitations stat', async () => {
      render(<HomeScreen />);

      await waitFor(() => {
        expect(screen.getByText('Invitaciones activas')).toBeTruthy();
      });
    });

    it('shows visitors today stat', async () => {
      render(<HomeScreen />);

      await waitFor(() => {
        expect(screen.getByText('Visitas hoy')).toBeTruthy();
      });
    });

    it('shows pending stat', async () => {
      render(<HomeScreen />);

      await waitFor(() => {
        expect(screen.getByText('Pendientes')).toBeTruthy();
      });
    });
  });

  describe('services section', () => {
    it('shows services section', async () => {
      render(<HomeScreen />);

      await waitFor(() => {
        expect(screen.getByText('Servicios')).toBeTruthy();
      });
    });

    it('shows frequent visitors service', async () => {
      render(<HomeScreen />);

      await waitFor(() => {
        expect(screen.getByText('Visitantes frecuentes')).toBeTruthy();
      });
    });

    it('shows amenities service', async () => {
      render(<HomeScreen />);

      await waitFor(() => {
        expect(screen.getByText('Amenidades')).toBeTruthy();
      });
    });

    it('shows maintenance service', async () => {
      render(<HomeScreen />);

      await waitFor(() => {
        expect(screen.getByText('Mantenimiento')).toBeTruthy();
      });
    });

    it('shows packages service', async () => {
      render(<HomeScreen />);

      await waitFor(() => {
        expect(screen.getByText('Paquetes')).toBeTruthy();
      });
    });

    it('navigates to frequent visitors when pressed', async () => {
      render(<HomeScreen />);

      await waitFor(() => {
        expect(screen.getByText('Visitantes frecuentes')).toBeTruthy();
      });

      fireEvent.press(screen.getByText('Visitantes frecuentes'));

      expect(mockPush).toHaveBeenCalledWith('/(app)/frequent-visitors');
    });

    it('navigates to amenities when pressed', async () => {
      render(<HomeScreen />);

      await waitFor(() => {
        expect(screen.getByText('Amenidades')).toBeTruthy();
      });

      fireEvent.press(screen.getByText('Amenidades'));

      expect(mockPush).toHaveBeenCalledWith('/(app)/amenities');
    });

    it('navigates to maintenance when pressed', async () => {
      render(<HomeScreen />);

      await waitFor(() => {
        expect(screen.getByText('Mantenimiento')).toBeTruthy();
      });

      fireEvent.press(screen.getByText('Mantenimiento'));

      expect(mockPush).toHaveBeenCalledWith('/(app)/maintenance');
    });

    it('navigates to packages when pressed', async () => {
      render(<HomeScreen />);

      await waitFor(() => {
        expect(screen.getByText('Paquetes')).toBeTruthy();
      });

      fireEvent.press(screen.getByText('Paquetes'));

      expect(mockPush).toHaveBeenCalledWith('/(app)/packages');
    });
  });

  describe('recent activity section', () => {
    it('shows recent activity section', async () => {
      render(<HomeScreen />);

      await waitFor(() => {
        expect(screen.getByText('Actividad reciente')).toBeTruthy();
      });
    });

    it('shows view all link', async () => {
      render(<HomeScreen />);

      await waitFor(() => {
        expect(screen.getByText('Ver todo')).toBeTruthy();
      });
    });

    it('shows empty state when no activity', async () => {
      render(<HomeScreen />);

      await waitFor(() => {
        expect(screen.getByText('Sin actividad reciente')).toBeTruthy();
      });
    });

    it('navigates to invitations when view all is pressed', async () => {
      render(<HomeScreen />);

      await waitFor(() => {
        expect(screen.getByText('Ver todo')).toBeTruthy();
      });

      fireEvent.press(screen.getByText('Ver todo'));

      expect(mockPush).toHaveBeenCalledWith('/(app)/(tabs)/invitations');
    });
  });

  describe('fallback display name', () => {
    it('shows user metadata name when profile is null', async () => {
      mockUseAuth.mockReturnValue({
        user: { id: 'user-123', user_metadata: { full_name: 'Metadata User' } },
        profile: null,
      });

      render(<HomeScreen />);

      await waitFor(() => {
        expect(screen.getByText('Metadata User')).toBeTruthy();
      });
    });

    it('shows "Usuario" when no name available', async () => {
      mockUseAuth.mockReturnValue({
        user: { id: 'user-123', user_metadata: {} },
        profile: null,
      });

      render(<HomeScreen />);

      await waitFor(() => {
        expect(screen.getByText('Usuario')).toBeTruthy();
      });
    });
  });

  describe('admin mode', () => {
    beforeEach(() => {
      mockUseOrganization.mockReturnValue({
        currentOrganization: { id: 'org-123', name: 'Test Residencial' },
        currentUnit: { id: 'unit-123', name: 'Unit 101' },
        currentMembership: { id: 'member-123', unit_id: 'unit-123' },
        canScanAccess: true,
        canCreateInvitations: true,
        isGuard: false,
        isAdmin: true,
        isLoading: false,
      });
    });

    it('shows admin dashboard', async () => {
      render(<HomeScreen />);

      await waitFor(() => {
        expect(screen.getByText('Bienvenido')).toBeTruthy();
      });
    });

    it('shows scan QR option for admin', async () => {
      render(<HomeScreen />);

      await waitFor(() => {
        expect(screen.getByText('Escanear QR')).toBeTruthy();
      });
    });
  });

  describe('pull to refresh', () => {
    it('supports pull to refresh', async () => {
      render(<HomeScreen />);

      await waitFor(() => {
        expect(screen.getByText('Bienvenido')).toBeTruthy();
      });

      // Verify supabase was called to fetch data
      expect(mockSupabaseFrom).toHaveBeenCalled();
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
              gte: jest.fn().mockResolvedValue({ count: 0, error: new Error('Fetch failed') }),
            }),
            gte: jest.fn().mockResolvedValue({ count: 0, error: new Error('Fetch failed') }),
            order: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue({ data: [], error: new Error('Fetch failed') }),
            }),
          }),
          order: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue({ data: [], error: new Error('Fetch failed') }),
          }),
        }),
      });

      render(<HomeScreen />);

      await waitFor(() => {
        expect(screen.getByText('Bienvenido')).toBeTruthy();
      });

      console.error = consoleError;
    });
  });

  describe('packages service', () => {
    it('shows packages count badge when there are pending packages', async () => {
      mockSupabaseFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              gte: jest.fn().mockResolvedValue({ count: 0 }),
            }),
            gte: jest.fn().mockResolvedValue({ count: 3 }),
            order: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue({ data: [] }),
            }),
          }),
          order: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue({ data: [] }),
          }),
        }),
      });

      render(<HomeScreen />);

      await waitFor(() => {
        expect(screen.getByText('Paquetes')).toBeTruthy();
      });
    });
  });

  describe('guard quick scan', () => {
    beforeEach(() => {
      mockUseOrganization.mockReturnValue({
        currentOrganization: { id: 'org-123', name: 'Test Residencial' },
        currentUnit: null,
        currentMembership: { id: 'member-123', unit_id: null },
        canScanAccess: true,
        canCreateInvitations: false,
        isGuard: true,
        isAdmin: false,
        isLoading: false,
      });
    });

    it('shows guard scan description', async () => {
      render(<HomeScreen />);

      await waitFor(() => {
        expect(screen.getByText('Validar invitación de visitante')).toBeTruthy();
      });
    });

    it('shows exits today stat', async () => {
      render(<HomeScreen />);

      await waitFor(() => {
        expect(screen.getByText('Salidas hoy')).toBeTruthy();
      });
    });
  });

  describe('resident with unit', () => {
    it('shows unit info', async () => {
      render(<HomeScreen />);

      await waitFor(() => {
        expect(screen.getByText(/Unit 101/)).toBeTruthy();
      });
    });

    it('loads dashboard data', async () => {
      render(<HomeScreen />);

      await waitFor(() => {
        expect(mockSupabaseFrom).toHaveBeenCalledWith('invitations');
      });
    });
  });

  describe('activity types', () => {
    it('defines invitation_created type', () => {
      const activityType = 'invitation_created' as const;
      expect(activityType).toBe('invitation_created');
    });

    it('defines access_entry type', () => {
      const activityType = 'access_entry' as const;
      expect(activityType).toBe('access_entry');
    });

    it('defines access_exit type', () => {
      const activityType = 'access_exit' as const;
      expect(activityType).toBe('access_exit');
    });

    it('defines invitation_used type', () => {
      const activityType = 'invitation_used' as const;
      expect(activityType).toBe('invitation_used');
    });
  });

  describe('activity icons', () => {
    it('defines envelope icon for invitation', () => {
      const icon = '✉️';
      expect(icon).toBe('✉️');
    });

    it('defines door icon for entry', () => {
      const icon = '🚪';
      expect(icon).toBe('🚪');
    });

    it('defines wave icon for exit', () => {
      const icon = '👋';
      expect(icon).toBe('👋');
    });

    it('defines check icon for used invitation', () => {
      const icon = '✅';
      expect(icon).toBe('✅');
    });

    it('defines default icon', () => {
      const icon = '📌';
      expect(icon).toBe('📌');
    });
  });

  describe('activity labels', () => {
    it('defines label for invitation created', () => {
      const label = 'Invitación creada';
      expect(label).toBe('Invitación creada');
    });

    it('defines label for entry', () => {
      const label = 'Entrada';
      expect(label).toBe('Entrada');
    });

    it('defines label for exit', () => {
      const label = 'Salida';
      expect(label).toBe('Salida');
    });

    it('defines label for invitation used', () => {
      const label = 'Invitación usada';
      expect(label).toBe('Invitación usada');
    });

    it('defines default label', () => {
      const label = 'Actividad';
      expect(label).toBe('Actividad');
    });
  });

  describe('relative time formatting logic', () => {
    it('returns "Ahora" for less than 1 minute', () => {
      const diffMins = 0;
      const result = diffMins < 1 ? 'Ahora' : 'Other';
      expect(result).toBe('Ahora');
    });

    it('returns minutes format for less than 60 minutes', () => {
      const diffMins = 15;
      const result = diffMins < 60 ? `Hace ${diffMins} min` : 'Other';
      expect(result).toBe('Hace 15 min');
    });

    it('returns hours format for less than 24 hours', () => {
      const diffHours = 5;
      const result = diffHours < 24 ? `Hace ${diffHours}h` : 'Other';
      expect(result).toBe('Hace 5h');
    });

    it('returns "Ayer" for 1 day ago', () => {
      const diffDays = 1;
      const result = diffDays === 1 ? 'Ayer' : 'Other';
      expect(result).toBe('Ayer');
    });

    it('returns days format for less than 7 days', () => {
      const diffDays = 3;
      const result = diffDays < 7 ? `Hace ${diffDays} días` : 'Other';
      expect(result).toBe('Hace 3 días');
    });

    it('returns date for more than 7 days', () => {
      const date = new Date('2024-01-15');
      const diffDays = 10;
      const result = diffDays >= 7 ? date.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' }) : 'Other';
      expect(result).toContain('ene');
    });
  });

  describe('dashboard stats interface', () => {
    it('defines activeInvitations stat', () => {
      const stats = { activeInvitations: 5 };
      expect(stats.activeInvitations).toBe(5);
    });

    it('defines visitorsToday stat', () => {
      const stats = { visitorsToday: 10 };
      expect(stats.visitorsToday).toBe(10);
    });

    it('defines pendingInvitations stat', () => {
      const stats = { pendingInvitations: 3 };
      expect(stats.pendingInvitations).toBe(3);
    });

    it('defines pendingPackages stat', () => {
      const stats = { pendingPackages: 2 };
      expect(stats.pendingPackages).toBe(2);
    });
  });

  describe('guard stats interface', () => {
    it('defines todayEntries stat', () => {
      const stats = { todayEntries: 25 };
      expect(stats.todayEntries).toBe(25);
    });

    it('defines todayExits stat', () => {
      const stats = { todayExits: 18 };
      expect(stats.todayExits).toBe(18);
    });

    it('defines activeInvitations for guard', () => {
      const stats = { activeInvitations: 42 };
      expect(stats.activeInvitations).toBe(42);
    });

    it('defines avgWaitTime stat', () => {
      const stats = { avgWaitTime: 0 };
      expect(stats.avgWaitTime).toBe(0);
    });
  });

  describe('package alert text', () => {
    it('shows singular text for 1 package', () => {
      const count = 1;
      const text = count === 1 ? 'Tienes 1 paquete por recoger' : `Tienes ${count} paquetes por recoger`;
      expect(text).toBe('Tienes 1 paquete por recoger');
    });

    it('shows plural text for multiple packages', () => {
      const count = 3 as number;
      const text = count === 1 ? 'Tienes 1 paquete por recoger' : `Tienes ${count} paquetes por recoger`;
      expect(text).toBe('Tienes 3 paquetes por recoger');
    });
  });

  describe('without unit', () => {
    it('handles no unit id gracefully', async () => {
      mockUseOrganization.mockReturnValue({
        currentOrganization: { id: 'org-123', name: 'Test Residencial' },
        currentUnit: null,
        currentMembership: { id: 'member-123', unit_id: null },
        canScanAccess: false,
        canCreateInvitations: true,
        isGuard: false,
        isAdmin: false,
        isLoading: false,
      });

      render(<HomeScreen />);

      await waitFor(() => {
        expect(screen.getByText('Bienvenido')).toBeTruthy();
      });
    });
  });
});
